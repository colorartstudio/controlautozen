import { parseBody, requireAuthenticatedRequest, sendJson } from '../_lib/adminAuth.js'
import { sanitizeAgentCommandType } from '../_lib/agentCommandRuntime.js'
import { FieldValue, getAdminDb } from '../_lib/firebaseAdmin.js'
import { assertSubscriptionWriteAccess } from '../_lib/subscriptionAccess.js'

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
    const externalAccountId = String(body.externalAccountId ?? '').trim()
    const taskId = String(body.taskId ?? '').trim()
    const type = sanitizeAgentCommandType(body.type)

    if (!externalAccountId || !taskId) {
      return sendJson(response, 400, {
        message: 'Informe taskId e externalAccountId para enfileirar o comando assistido.',
      })
    }

    const adminDb = getAdminDb()
    const taskRef = adminDb.collection('automationTasks').doc(taskId)
    const accountRef = adminDb.collection('externalAccounts').doc(externalAccountId)
    const [taskSnapshot, accountSnapshot] = await Promise.all([taskRef.get(), accountRef.get()])

    if (!taskSnapshot.exists || !accountSnapshot.exists) {
      return sendJson(response, 404, {
        message: 'Conta externa ou tarefa nao encontrada para o comando assistido.',
      })
    }

    const task = taskSnapshot.data()
    const account = accountSnapshot.data()
    const isAdmin = authContext.profile?.role === 'admin'
    const ownsResources =
      account.ownerId === authContext.uid && task.ownerId === authContext.uid

    if (!isAdmin && !ownsResources) {
      return sendJson(response, 403, {
        message: 'Voce nao pode enfileirar comandos para esta conta.',
      })
    }

    const commandRef = adminDb.collection('agentCommands').doc()

    await commandRef.set({
      createdAt: FieldValue.serverTimestamp(),
      externalAccountId,
      externalAccountName: account.name ?? task.externalAccountName ?? 'Conta externa',
      ownerId: task.ownerId,
      requestedBy: authContext.uid,
      requestedByRole: authContext.profile?.role ?? 'user',
      resultSummary: '',
      status: 'queued',
      taskId,
      type,
      updatedAt: FieldValue.serverTimestamp(),
    })

    return sendJson(response, 200, {
      commandId: commandRef.id,
      ok: true,
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ?? 'Falha ao enfileirar o comando assistido para o agente.',
    })
  }
}
