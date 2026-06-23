import { subscribeToOwnedCollection } from './collectionHelpers'
import { callProtectedApi } from './secureApi'

export function subscribeToExternalAccounts({ ownerId, isAdmin, next, error }) {
  return subscribeToOwnedCollection(
    'externalAccounts',
    ownerId,
    isAdmin,
    next,
    error,
  )
}

export async function saveExternalAccount(payload) {
  return callProtectedApi('/api/external-accounts/upsert', payload)
}

export async function removeExternalAccount(id) {
  return callProtectedApi('/api/external-accounts/remove', { id })
}
