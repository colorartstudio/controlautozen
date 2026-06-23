import {
  createOwnedDocument,
  deleteOwnedDocument,
  subscribeToOwnedCollection,
  updateOwnedDocument,
} from './collectionHelpers'

function sanitizeVehicle(payload) {
  return {
    plate: String(payload.plate ?? '').trim().toUpperCase(),
    brand: String(payload.brand ?? '').trim(),
    model: String(payload.model ?? '').trim(),
    year: String(payload.year ?? '').trim(),
    color: String(payload.color ?? '').trim(),
    status: String(payload.status ?? 'active').trim(),
    notes: String(payload.notes ?? '').trim(),
  }
}

export function subscribeToVehicles({ ownerId, isAdmin, next, error }) {
  return subscribeToOwnedCollection('vehicles', ownerId, isAdmin, next, error)
}

export async function createVehicle(ownerId, payload) {
  return createOwnedDocument('vehicles', ownerId, sanitizeVehicle(payload))
}

export async function updateVehicle(id, payload) {
  return updateOwnedDocument('vehicles', id, sanitizeVehicle(payload))
}

export async function deleteVehicle(id) {
  return deleteOwnedDocument('vehicles', id)
}
