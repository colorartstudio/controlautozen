import {
  createOwnedDocument,
  deleteOwnedDocument,
  subscribeToOwnedCollection,
  updateOwnedDocument,
} from './collectionHelpers'

function withOptionalRuntimeFields(payload) {
  const runtimePayload = {}

  const runtimeFields = [
    'agentStatus',
    'claimedAt',
    'claimedBy',
    'lastRunAt',
    'lastValidatedAt',
    'validationStatus',
    'validationSummary',
    'lastInspectionAt',
    'lastInspectionSummary',
    'lastEvidencePath',
    'availableUsd',
    'tradingLimitUsd',
    'tradeScreenVisible',
    'plusVisible',
    'threeHoursVisible',
    'claimableVisible',
    'confirmVisible',
  ]

  runtimeFields.forEach((field) => {
    if (field in payload) {
      runtimePayload[field] = payload[field]
    }
  })

  return runtimePayload
}

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
    lastResult: String(payload.lastResult ?? 'Aguardando').trim(),
    notes: String(payload.notes ?? '').trim(),
    ...withOptionalRuntimeFields(payload),
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
