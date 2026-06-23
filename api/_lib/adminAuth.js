import { getAdminAuth, getAdminDb } from './firebaseAdmin.js'

function getBearerToken(request) {
  const header = request.headers.authorization ?? ''

  if (!header.startsWith('Bearer ')) {
    return ''
  }

  return header.slice('Bearer '.length)
}

export async function requireAuthenticatedRequest(request) {
  const idToken = getBearerToken(request)

  if (!idToken) {
    return {
      error: {
        status: 401,
        message: 'Token de autenticacao ausente.',
      },
    }
  }

  let decodedToken

  try {
    decodedToken = await getAdminAuth().verifyIdToken(idToken)
  } catch {
    return {
      error: {
        status: 401,
        message: 'Token de autenticacao invalido.',
      },
    }
  }

  const profileSnapshot = await getAdminDb().collection('users').doc(decodedToken.uid).get()
  const profile = profileSnapshot.data()

  return {
    decodedToken,
    profile,
    uid: decodedToken.uid,
  }
}

export async function requireAdminRequest(request) {
  const authContext = await requireAuthenticatedRequest(request)

  if (authContext.error) {
    return authContext
  }

  const profileSnapshot = await getAdminDb().collection('users').doc(authContext.uid).get()
  const profile = profileSnapshot.data()

  if (!profileSnapshot.exists || profile?.role !== 'admin') {
    return {
      error: {
        status: 403,
        message: 'Apenas administradores podem usar esta rota.',
      },
    }
  }

  return {
    profile,
    uid: authContext.uid,
  }
}

export function sendJson(response, status, payload) {
  response.status(status).json(payload)
}

export function parseBody(request) {
  if (!request.body) {
    return {}
  }

  if (typeof request.body === 'string') {
    try {
      return JSON.parse(request.body)
    } catch {
      return {}
    }
  }

  return request.body
}
