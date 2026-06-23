import { firebaseAuth } from '../lib/firebase'

async function getCurrentIdToken() {
  if (!firebaseAuth?.currentUser) {
    throw new Error('Faça login novamente para continuar.')
  }

  return firebaseAuth.currentUser.getIdToken()
}

export async function callProtectedApi(path, payload, options = {}) {
  const { method = 'POST' } = options
  const idToken = await getCurrentIdToken()
  let response

  try {
    response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload ?? {}),
    })
  } catch {
    throw new Error(
      'API protegida indisponivel neste ambiente. Use o deploy no Vercel ou rode `vercel dev` para testar localmente.',
    )
  }

  let data = {}

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        'API protegida indisponivel neste ambiente. Para testar contas externas e acoes administrativas localmente, use `vercel dev`.',
      )
    }

    throw new Error(data.message ?? 'Falha ao executar a operacao solicitada.')
  }

  return data
}
