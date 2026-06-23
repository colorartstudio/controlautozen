import { FieldValue, getAdminDb } from '../_lib/firebaseAdmin.js'
import { encryptText, maskPhone } from '../_lib/crypto.js'
import { assertSubscriptionWriteAccess } from '../_lib/subscriptionAccess.js'
import {
  parseBody,
  requireAuthenticatedRequest,
  sendJson,
} from '../_lib/adminAuth.js'

const ALLOWED_STATUS = new Set(['active', 'paused', 'archived'])

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
    const name = String(body.name ?? '').trim()
    const phone = String(body.phone ?? '').trim()
    const password = String(body.password ?? '').trim()
    const notes = String(body.notes ?? '').trim()
    const status = ALLOWED_STATUS.has(body.status) ? body.status : 'active'

    if (!name) {
      return sendJson(response, 400, { message: 'Informe um nome para a conta.' })
    }

    if (!id && (!phone || !password)) {
      return sendJson(response, 400, {
        message: 'Celular e senha sao obrigatorios ao cadastrar uma nova conta.',
      })
    }

    const adminDb = getAdminDb()
    const metadataRef = id
      ? adminDb.collection('externalAccounts').doc(id)
      : adminDb.collection('externalAccounts').doc()
    const secretRef = adminDb.collection('externalAccountSecrets').doc(metadataRef.id)
    const snapshot = await metadataRef.get()

    if (snapshot.exists) {
      const current = snapshot.data()
      const canManage =
        current?.ownerId === authContext.uid || authContext.profile?.role === 'admin'

      if (!canManage) {
        return sendJson(response, 403, {
          message: 'Voce nao pode alterar esta conta externa.',
        })
      }
    }

    const metadataPayload = {
      ownerId: snapshot.data()?.ownerId ?? authContext.uid,
      name,
      status,
      notes,
      phoneMasked: phone ? maskPhone(phone) : snapshot.data()?.phoneMasked ?? '',
      hasPassword: password ? true : snapshot.data()?.hasPassword ?? false,
      sessionMode: 'browser-persisted',
      sessionStatus: snapshot.data()?.sessionStatus ?? 'pending',
      runnerStatus: snapshot.data()?.runnerStatus ?? 'idle',
      lastExecutionAt: snapshot.data()?.lastExecutionAt ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (!snapshot.exists || phone || password) {
      metadataPayload.lastCredentialUpdateAt = FieldValue.serverTimestamp()
    } else {
      metadataPayload.lastCredentialUpdateAt =
        snapshot.data()?.lastCredentialUpdateAt ?? null
    }

    if (!snapshot.exists) {
      metadataPayload.createdAt = FieldValue.serverTimestamp()
    }

    await metadataRef.set(metadataPayload, { merge: true })

    if (phone || password || !snapshot.exists) {
      const secretPayload = {
        ownerId: snapshot.data()?.ownerId ?? authContext.uid,
        updatedAt: FieldValue.serverTimestamp(),
      }

      if (!snapshot.exists) {
        secretPayload.createdAt = FieldValue.serverTimestamp()
      }

      if (phone) {
        secretPayload.phoneEncrypted = encryptText(phone)
      }

      if (password) {
        secretPayload.passwordEncrypted = encryptText(password)
      }

      await secretRef.set(secretPayload, { merge: true })
    }

    return sendJson(response, 200, {
      id: metadataRef.id,
      ok: true,
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Nao foi possivel salvar a conta externa. Verifique ACCOUNT_CREDENTIALS_SECRET e FIREBASE_ADMIN_*.',
    })
  }
}
