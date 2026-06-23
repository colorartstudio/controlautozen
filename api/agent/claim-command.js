import { sendJson } from '../_lib/adminAuth.js'
import { requireAgentRequest } from '../_lib/agentAuth.js'
import {
  assertAgentWorkloadAllowed,
  getAgentExternalAccountPayload,
  isCommandClaimable,
  sortCommandsForQueue,
} from '../_lib/agentCommandRuntime.js'
import { upsertAgentHeartbeat } from '../_lib/agentRuntime.js'
import { FieldValue, getAdminDb } from '../_lib/firebaseAdmin.js'

async function claimCandidate(agentContext, candidateSnapshot) {
  const command = candidateSnapshot.data()
  const adminDb = getAdminDb()
  const accountRef = adminDb.collection('externalAccounts').doc(command.externalAccountId)
  const taskRef = adminDb.collection('automationTasks').doc(command.taskId)
  const [accountSnapshot, taskSnapshot, externalAccount] = await Promise.all([
    accountRef.get(),
    taskRef.get(),
    getAgentExternalAccountPayload(
      command.externalAccountId,
      command.externalAccountName,
    ),
  ])

  if (
    !accountSnapshot.exists ||
    !taskSnapshot.exists ||
    accountSnapshot.data()?.status !== 'active'
  ) {
    return null
  }

  if (!(await assertAgentWorkloadAllowed(command.ownerId))) {
    return null
  }

  const claimedAt = new Date().toISOString()
  const commandRef = candidateSnapshot.ref

  const didClaim = await adminDb.runTransaction(async (transaction) => {
    const latestCommandSnapshot = await transaction.get(commandRef)

    if (!latestCommandSnapshot.exists || !isCommandClaimable(latestCommandSnapshot.data())) {
      return false
    }

    transaction.set(
      commandRef,
      {
        claimedAt,
        claimedBy: agentContext.agentId,
        resultSummary: '',
        status: 'claimed',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    transaction.set(
      accountRef,
      {
        agentId: agentContext.agentId,
        runnerStatus: 'busy',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return true
  })

  if (!didClaim) {
    return null
  }

  await upsertAgentHeartbeat(agentContext, {
    currentAccountId: command.externalAccountId,
    currentOwnerId: command.ownerId,
    currentTaskId: command.taskId,
    lastClaimAt: claimedAt,
    sessionStatus: externalAccount?.sessionStatus ?? 'pending',
    status: 'busy',
  })

  return {
    command: {
      ...command,
      claimedAt,
      claimedBy: agentContext.agentId,
      id: candidateSnapshot.id,
      status: 'claimed',
    },
    externalAccount,
    task: {
      id: taskSnapshot.id,
      ...taskSnapshot.data(),
    },
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

    const adminDb = getAdminDb()
    const snapshots = await adminDb.collection('agentCommands').get()
    const sortedCandidates = snapshots.docs
      .filter((snapshot) => isCommandClaimable(snapshot.data()))
      .sort((left, right) => sortCommandsForQueue(left.data(), right.data()))

    for (const candidateSnapshot of sortedCandidates) {
      const claimed = await claimCandidate(agentContext, candidateSnapshot)

      if (claimed) {
        return sendJson(response, 200, {
          claimed: true,
          ok: true,
          ...claimed,
        })
      }
    }

    await upsertAgentHeartbeat(agentContext, {
      currentAccountId: '',
      currentOwnerId: '',
      currentTaskId: '',
      status: 'idle',
    })

    return sendJson(response, 200, {
      claimed: false,
      ok: true,
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Falha ao reservar o proximo comando assistido para o agente.',
    })
  }
}
