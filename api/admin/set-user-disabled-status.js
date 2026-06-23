import { FieldValue, getAdminAuth, getAdminDb } from '../_lib/firebaseAdmin.js'
import { parseBody, requireAdminRequest, sendJson } from '../_lib/adminAuth.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { message: 'Metodo nao permitido.' })
  }

  try {
    const authContext = await requireAdminRequest(request)

    if (authContext.error) {
      return sendJson(response, authContext.error.status, {
        message: authContext.error.message,
      })
    }

    const body = parseBody(request)
    const uid = String(body.uid ?? '').trim()
    const disabled = Boolean(body.disabled)

    if (!uid) {
      return sendJson(response, 400, { message: 'Informe um uid valido.' })
    }

    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()
    await adminAuth.updateUser(uid, { disabled })
    await adminDb.collection('users').doc(uid).set(
      {
        authDisabled: disabled,
        status: disabled ? 'blocked' : 'active',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return sendJson(response, 200, {
      disabled,
      ok: true,
      uid,
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Nao foi possivel alterar o status de login. Confira as variaveis FIREBASE_ADMIN_* no Vercel.',
    })
  }
}
