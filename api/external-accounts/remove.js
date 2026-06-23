import { getAdminDb } from '../_lib/firebaseAdmin.js'
import { assertSubscriptionWriteAccess } from '../_lib/subscriptionAccess.js'
import {
  parseBody,
  requireAuthenticatedRequest,
  sendJson,
} from '../_lib/adminAuth.js'

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
    const id = String(body.id ?? '').trim()

    if (!id) {
      return sendJson(response, 400, { message: 'Informe um identificador valido.' })
    }

    const adminDb = getAdminDb()
    const metadataRef = adminDb.collection('externalAccounts').doc(id)
    const snapshot = await metadataRef.get()

    if (!snapshot.exists) {
      return sendJson(response, 404, { message: 'Conta externa nao encontrada.' })
    }

    const current = snapshot.data()
    const canManage =
      current?.ownerId === authContext.uid || authContext.profile?.role === 'admin'

    if (!canManage) {
      return sendJson(response, 403, {
        message: 'Voce nao pode remover esta conta externa.',
      })
    }

    await Promise.all([
      metadataRef.delete(),
      adminDb.collection('externalAccountSecrets').doc(id).delete(),
    ])

    return sendJson(response, 200, { ok: true, id })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Nao foi possivel remover a conta externa. Verifique ACCOUNT_CREDENTIALS_SECRET e FIREBASE_ADMIN_*.',
    })
  }
}
