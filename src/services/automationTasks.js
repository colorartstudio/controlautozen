import {
  createOwnedDocument,
  deleteOwnedDocument,
  subscribeToOwnedCollection,
  updateOwnedDocument,
} from './collectionHelpers'

function sanitizeTask(payload) {
  return {
    externalAccountId: String(payload.externalAccountId ?? '').trim(),
    externalAccountName: String(payload.externalAccountName ?? '').trim(),
    plusAmount: Number(payload.plusAmount ?? 50),
    minAvailableBalance: Number(payload.minAvailableBalance ?? 10),
    cycleHours: Number(payload.cycleHours ?? 3),
    priority: Number(payload.priority ?? 1),
    status: String(payload.status ?? 'draft').trim(),
    nextRunAt: String(payload.nextRunAt ?? '').trim(),
    lastRunAt: String(payload.lastRunAt ?? '').trim(),
    lastResult: String(payload.lastResult ?? 'Aguardando').trim(),
    notes: String(payload.notes ?? '').trim(),
  }
}

export function subscribeToAutomationTasks({ ownerId, isAdmin, next, error }) {
  return subscribeToOwnedCollection('automationTasks', ownerId, isAdmin, next, error)
}

export async function createAutomationTask(ownerId, payload) {
  return createOwnedDocument('automationTasks', ownerId, sanitizeTask(payload))
}

export async function updateAutomationTask(id, payload) {
  return updateOwnedDocument('automationTasks', id, sanitizeTask(payload))
}

export async function deleteAutomationTask(id) {
  return deleteOwnedDocument('automationTasks', id)
}
