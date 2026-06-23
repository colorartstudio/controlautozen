import {
  acquireExecutorLock,
  calculateNextRunAt,
  createExecutorLog,
  releaseExecutorLock,
  updateExternalAccountRuntime,
  updateTaskExecution,
} from '../_lib/executorRuntime.js'
import { assertSubscriptionWriteAccess } from '../_lib/subscriptionAccess.js'
import { getAdminDb } from '../_lib/firebaseAdmin.js'
import {
  parseBody,
  requireAuthenticatedRequest,
  sendJson,
} from '../_lib/adminAuth.js'

function getRefs(taskId, externalAccountId) {
  const adminDb = getAdminDb()

  return {
    accountRef: adminDb.collection('externalAccounts').doc(externalAccountId),
    taskRef: adminDb.collection('automationTasks').doc(taskId),
  }
}

function ensureOwnership({ account, authContext, task }) {
  const isAdmin = authContext.profile?.role === 'admin'
  const sameOwner =
    account?.ownerId === authContext.uid && task?.ownerId === authContext.uid

  if (!isAdmin && !sameOwner) {
    throw new Error('Voce nao pode executar esta tarefa.')
  }
}

async function appendLifecycleLogs(context) {
  const basePayload = {
    externalAccountId: context.externalAccountId,
    externalAccountName: context.externalAccountName,
    source: 'executor',
    taskId: context.taskId,
    type: 'executor',
  }

  await createExecutorLog(context.ownerId, {
    ...basePayload,
    message: 'Executor interno iniciou a fila unica para esta tarefa.',
    status: 'pending',
  })

  await createExecutorLog(context.ownerId, {
    ...basePayload,
    message:
      'Executor interno validou a assinatura, reservou o slot unico e atualizou os proximos horarios.',
    status: 'success',
  })
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { message: 'Metodo nao permitido.' })
  }

  try {
    const authContext = await requireAuthenticatedRequest(request)

    if (authContext.error) {
      return sendJson(response, authContext.error.status, {
        message: authContext.error.message,
      })
    }

    if (authContext.profile?.role !== 'admin') {
      await assertSubscriptionWriteAccess(authContext.uid)
    }

    const body = parseBody(request)
    const taskId = String(body.taskId ?? '').trim()
    const externalAccountId = String(body.externalAccountId ?? '').trim()

    if (!taskId || !externalAccountId) {
      return sendJson(response, 400, {
        message: 'Informe uma tarefa e uma conta externa validas.',
      })
    }

    const { accountRef, taskRef } = getRefs(taskId, externalAccountId)
    const [accountSnapshot, taskSnapshot] = await Promise.all([
      accountRef.get(),
      taskRef.get(),
    ])

    if (!accountSnapshot.exists || !taskSnapshot.exists) {
      return sendJson(response, 404, {
        message: 'Conta externa ou tarefa nao encontrada.',
      })
    }

    const account = accountSnapshot.data()
    const task = taskSnapshot.data()

    ensureOwnership({ account, authContext, task })

    const context = {
      externalAccountId,
      externalAccountName: account.name ?? task.externalAccountName ?? 'Conta externa',
      ownerId: task.ownerId,
      taskId,
    }

    await acquireExecutorLock(context)

    try {
      const now = new Date()
      const nextRunAt = calculateNextRunAt(task)

      await updateExternalAccountRuntime(accountRef, {
        lastExecutionAt: now,
        runnerStatus: 'running',
        sessionStatus: account.sessionStatus ?? 'connected',
      })

      await updateTaskExecution(taskRef, {
        lastResult: 'Executor interno concluiu o ciclo e reagendou a tarefa.',
        lastRunAt: now.toISOString(),
        nextRunAt: nextRunAt.toISOString().slice(0, 16),
        status: 'active',
      })

      await appendLifecycleLogs(context)

      await updateExternalAccountRuntime(accountRef, {
        lastExecutionAt: now,
        runnerStatus: 'idle',
      })

      await releaseExecutorLock('idle')

      return sendJson(response, 200, {
        ok: true,
        lastRunAt: now.toISOString(),
        nextRunAt: nextRunAt.toISOString(),
      })
    } catch (error) {
      await updateExternalAccountRuntime(accountRef, {
        runnerStatus: 'idle',
      })
      await releaseExecutorLock('error')
      throw error
    }
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Falha ao executar a fila interna da automacao.',
    })
  }
}
