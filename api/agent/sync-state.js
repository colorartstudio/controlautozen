import { parseBody, sendJson } from '../_lib/adminAuth.js'
import { requireAgentRequest } from '../_lib/agentAuth.js'
import { upsertAgentHeartbeat } from '../_lib/agentRuntime.js'
import { FieldValue, getAdminDb } from '../_lib/firebaseAdmin.js'

function normalizeLogs(logs, task, externalAccountName) {
  if (!Array.isArray(logs) || logs.length === 0) {
    return [
      {
        message: 'Agente sincronizou a validacao de sessao e o estado da tarefa.',
        source: 'agent',
        status: 'success',
        taskId: task.id,
        type: 'validation',
      },
    ]
  }

  return logs.slice(0, 20).map((item) => ({
    message: String(item.message ?? '').trim() || 'Evento sem descricao.',
    source: String(item.source ?? 'agent').trim(),
    status: String(item.status ?? 'pending').trim(),
    taskId: String(item.taskId ?? task.id).trim(),
    type: String(item.type ?? 'validation').trim(),
    externalAccountName,
  }))
}

function buildTaskPatch(body, nowIso) {
  const validationStatus = String(body.validationStatus ?? 'success').trim()
  const validationSummary = String(
    body.validationSummary ?? 'Validacao concluida pelo agente externo.',
  ).trim()
  const hasError = validationStatus === 'failed' || validationStatus === 'error'

  const patch = {
    agentStatus: hasError ? 'error' : 'idle',
    claimedAt: '',
    claimedBy: '',
    lastResult: validationSummary,
    lastRunAt: nowIso,
    lastValidatedAt: nowIso,
    updatedAt: FieldValue.serverTimestamp(),
    validationStatus,
    validationSummary,
  }

  const nextRunAt = String(body.nextRunAt ?? '').trim()

  if (nextRunAt) {
    patch.nextRunAt = nextRunAt
  }

  const inspection = body.inspection && typeof body.inspection === 'object' ? body.inspection : null

  if (inspection) {
    patch.availableUsd = String(inspection.availableUsd ?? '').trim()
    patch.claimableVisible = Boolean(inspection.claimableVisible)
    patch.confirmVisible = Boolean(inspection.confirmVisible)
    patch.lastEvidencePath = String(inspection.lastEvidencePath ?? '').trim()
    patch.lastInspectionAt = nowIso
    patch.lastInspectionSummary = String(
      inspection.lastInspectionSummary ?? validationSummary,
    ).trim()
    patch.plusVisible = Boolean(inspection.plusVisible)
    patch.threeHoursVisible = Boolean(inspection.threeHoursVisible)
    patch.tradeScreenVisible = Boolean(inspection.tradeScreenVisible)
    patch.tradingLimitUsd = String(inspection.tradingLimitUsd ?? '').trim()
  }

  return patch
}

function buildAccountPatch(body, agentContext, nowIso) {
  const sessionStatus = String(body.sessionStatus ?? 'connected').trim()
  const validationStatus = String(body.validationStatus ?? 'success').trim()
  const runnerStatus = validationStatus === 'failed' || validationStatus === 'error'
    ? 'error'
    : 'idle'

  return {
    agentId: agentContext.agentId,
    lastExecutionAt: nowIso,
    lastSessionCheckAt: nowIso,
    lastValidationAt: nowIso,
    runnerStatus,
    sessionStatus,
    updatedAt: FieldValue.serverTimestamp(),
  }
}

function buildCommandPatch(body, agentContext, nowIso) {
  const validationStatus = String(body.validationStatus ?? 'success').trim()
  const commandStatus =
    validationStatus === 'failed' || validationStatus === 'error'
      ? 'failed'
      : 'completed'

  return {
    completedAt: nowIso,
    claimedBy: agentContext.agentId,
    resultSummary: String(
      body.commandSummary ?? body.validationSummary ?? 'Comando assistido concluido.',
    ).trim(),
    status: commandStatus,
    updatedAt: FieldValue.serverTimestamp(),
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { message: 'Metodo nao permitido.' })
  }

  try {
    const agentContext = requireAgentRequest(request)

    if (agentContext.error) {
      return sendJson(response, agentContext.error.status, {
        message: agentContext.error.message,
      })
    }

    const body = parseBody(request)
    const commandId = String(body.commandId ?? '').trim()
    const taskId = String(body.taskId ?? '').trim()
    const externalAccountId = String(body.externalAccountId ?? '').trim()

    if (!taskId || !externalAccountId) {
      return sendJson(response, 400, {
        message: 'Informe taskId e externalAccountId para sincronizar o estado.',
      })
    }

    const adminDb = getAdminDb()
    const taskRef = adminDb.collection('automationTasks').doc(taskId)
    const accountRef = adminDb.collection('externalAccounts').doc(externalAccountId)
    const commandRef = commandId
      ? adminDb.collection('agentCommands').doc(commandId)
      : null
    const [taskSnapshot, accountSnapshot, commandSnapshot] = await Promise.all([
      taskRef.get(),
      accountRef.get(),
      commandRef ? commandRef.get() : Promise.resolve(null),
    ])

    if (!taskSnapshot.exists || !accountSnapshot.exists) {
      return sendJson(response, 404, {
        message: 'Tarefa ou conta externa nao encontrada para sincronizacao.',
      })
    }

    const task = { id: taskSnapshot.id, ...taskSnapshot.data() }
    const account = accountSnapshot.data()

    if (task.claimedBy && task.claimedBy !== agentContext.agentId) {
      return sendJson(response, 409, {
        message: 'Esta tarefa esta reservada por outro agente.',
      })
    }

    if (
      commandSnapshot?.exists &&
      commandSnapshot.data()?.claimedBy &&
      commandSnapshot.data()?.claimedBy !== agentContext.agentId
    ) {
      return sendJson(response, 409, {
        message: 'Este comando assistido esta reservado por outro agente.',
      })
    }

    const nowIso = new Date().toISOString()
    const taskPatch = buildTaskPatch(body, nowIso)
    const accountPatch = buildAccountPatch(body, agentContext, nowIso)
    const logs = normalizeLogs(
      body.logs,
      task,
      account.name ?? task.externalAccountName,
    )
    const batch = adminDb.batch()

    batch.set(taskRef, taskPatch, { merge: true })
    batch.set(accountRef, accountPatch, { merge: true })

    if (commandRef) {
      batch.set(commandRef, buildCommandPatch(body, agentContext, nowIso), {
        merge: true,
      })
    }

    logs.forEach((item) => {
      const logRef = adminDb.collection('executionLogs').doc()
      batch.set(logRef, {
        createdAt: FieldValue.serverTimestamp(),
        externalAccountId,
        externalAccountName:
          item.externalAccountName ?? account.name ?? task.externalAccountName ?? '',
        message: item.message,
        ownerId: task.ownerId,
        source: item.source,
        status: item.status,
        taskId: item.taskId,
        type: item.type,
        updatedAt: FieldValue.serverTimestamp(),
      })
    })

    await batch.commit()

    await upsertAgentHeartbeat(agentContext, {
      currentAccountId: '',
      currentOwnerId: '',
      currentTaskId: '',
      lastError: String(body.lastError ?? '').trim(),
      lastSyncAt: nowIso,
      lastValidationAt: nowIso,
      sessionStatus: accountPatch.sessionStatus,
      status: accountPatch.runnerStatus === 'error' ? 'error' : 'online',
    })

    return sendJson(response, 200, {
      ok: true,
      syncedAt: nowIso,
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Falha ao sincronizar validacao, sessao e logs do agente.',
    })
  }
}
