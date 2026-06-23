import { parseBody, sendJson } from '../_lib/adminAuth.js'
import { requireAgentRequest } from '../_lib/agentAuth.js'
import {
  buildQueueSummary,
  sortTasksForQueue,
  upsertAgentHeartbeat,
} from '../_lib/agentRuntime.js'
import { getAdminDb } from '../_lib/firebaseAdmin.js'

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
    const adminDb = getAdminDb()
    const taskSnapshots = await adminDb
      .collection('automationTasks')
      .where('status', '==', 'active')
      .get()

    const tasks = taskSnapshots.docs.map((item) => ({ id: item.id, ...item.data() }))
    tasks.sort(sortTasksForQueue)

    await upsertAgentHeartbeat(agentContext, {
      capabilities: Array.isArray(body.capabilities) ? body.capabilities : undefined,
      lastError: String(body.lastError ?? '').trim(),
      queueMode: String(body.queueMode ?? 'single').trim(),
      sessionStatus: String(body.sessionStatus ?? 'pending').trim(),
      status: String(body.status ?? 'online').trim(),
    })

    return sendJson(response, 200, {
      ok: true,
      queue: buildQueueSummary(tasks),
      queuePreview: tasks.slice(0, 5).map((task) => ({
        agentStatus: task.agentStatus ?? 'idle',
        externalAccountId: task.externalAccountId,
        externalAccountName: task.externalAccountName,
        nextRunAt: task.nextRunAt ?? '',
        priority: task.priority ?? 1,
        status: task.status ?? 'draft',
        taskId: task.id,
      })),
      serverTime: new Date().toISOString(),
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Falha ao registrar heartbeat do agente.',
    })
  }
}
