import { sendJson } from '../_lib/adminAuth.js'
import { requireAgentRequest } from '../_lib/agentAuth.js'
import {
  assertAgentWorkloadAllowed,
  getAgentExternalAccountPayload,
} from '../_lib/agentCommandRuntime.js'
import {
  buildQueueSummary,
  isTaskClaimable,
  sortTasksForQueue,
  upsertAgentHeartbeat,
} from '../_lib/agentRuntime.js'
import { FieldValue, getAdminDb } from '../_lib/firebaseAdmin.js'

async function claimCandidate(agentContext, candidateSnapshot) {
  const adminDb = getAdminDb()
  const task = candidateSnapshot.data()
  const accountRef = adminDb.collection('externalAccounts').doc(task.externalAccountId)
  const [accountSnapshot, externalAccount] = await Promise.all([
    accountRef.get(),
    getAgentExternalAccountPayload(
      task.externalAccountId,
      task.externalAccountName,
    ),
  ])

  if (!accountSnapshot.exists || accountSnapshot.data()?.status !== 'active') {
    return null
  }

  if (!(await assertAgentWorkloadAllowed(task.ownerId))) {
    return null
  }

  const claimedAt = new Date().toISOString()
  const taskRef = candidateSnapshot.ref

  const didClaim = await adminDb.runTransaction(async (transaction) => {
    const latestTaskSnapshot = await transaction.get(taskRef)

    if (!latestTaskSnapshot.exists || !isTaskClaimable(latestTaskSnapshot.data())) {
      return false
    }

    transaction.set(
      taskRef,
      {
        agentStatus: 'claimed',
        claimedAt,
        claimedBy: agentContext.agentId,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    transaction.set(
      accountRef,
      {
        agentId: agentContext.agentId,
        runnerStatus: 'claimed',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return true
  })

  if (!didClaim) {
    return null
  }

  const account = accountSnapshot.data()

  await upsertAgentHeartbeat(agentContext, {
    currentAccountId: candidateSnapshot.data().externalAccountId,
    currentOwnerId: candidateSnapshot.data().ownerId,
    currentTaskId: candidateSnapshot.id,
    lastClaimAt: claimedAt,
    sessionStatus: account.sessionStatus ?? 'pending',
    status: 'busy',
  })

  return {
    externalAccount: externalAccount ?? {
      hasPassword: account.hasPassword ?? false,
      id: candidateSnapshot.data().externalAccountId,
      name: account.name ?? candidateSnapshot.data().externalAccountName,
      phoneMasked: account.phoneMasked ?? '',
      sessionMode: account.sessionMode ?? 'browser-persisted',
      sessionStatus: account.sessionStatus ?? 'pending',
      status: account.status ?? 'active',
    },
    task: {
      ...candidateSnapshot.data(),
      agentStatus: 'claimed',
      claimedAt,
      claimedBy: agentContext.agentId,
      id: candidateSnapshot.id,
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
    const snapshots = await adminDb
      .collection('automationTasks')
      .where('status', '==', 'active')
      .get()

    const sortedCandidates = snapshots.docs
      .filter((snapshot) => isTaskClaimable(snapshot.data()))
      .sort((left, right) => sortTasksForQueue(left.data(), right.data()))

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

    const queue = buildQueueSummary(
      snapshots.docs.map((item) => ({ id: item.id, ...item.data() })),
    )

    await upsertAgentHeartbeat(agentContext, {
      currentAccountId: '',
      currentOwnerId: '',
      currentTaskId: '',
      sessionStatus: 'pending',
      status: 'idle',
    })

    return sendJson(response, 200, {
      claimed: false,
      ok: true,
      queue,
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Falha ao reservar a proxima tarefa para o agente.',
    })
  }
}
