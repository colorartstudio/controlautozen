import {
  createOwnedDocument,
  deleteOwnedDocument,
  subscribeToOwnedCollection,
  updateOwnedDocument,
} from './collectionHelpers'

function sanitizeLog(payload) {
  return {
    externalAccountId: String(payload.externalAccountId ?? '').trim(),
    externalAccountName: String(payload.externalAccountName ?? '').trim(),
    taskId: String(payload.taskId ?? '').trim(),
    type: String(payload.type ?? 'manual').trim(),
    status: String(payload.status ?? 'pending').trim(),
    source: String(payload.source ?? 'painel').trim(),
    message: String(payload.message ?? '').trim(),
  }
}

export function subscribeToExecutionLogs({ ownerId, isAdmin, next, error }) {
  return subscribeToOwnedCollection(
    'executionLogs',
    ownerId,
    isAdmin,
    next,
    error,
    { sortField: 'createdAt' },
  )
}

export async function createExecutionLog(ownerId, payload) {
  return createOwnedDocument('executionLogs', ownerId, sanitizeLog(payload))
}

export async function updateExecutionLog(id, payload) {
  return updateOwnedDocument('executionLogs', id, sanitizeLog(payload))
}

export async function deleteExecutionLog(id) {
  return deleteOwnedDocument('executionLogs', id)
}
