import {
  createOwnedDocument,
  deleteOwnedDocument,
  subscribeToOwnedCollection,
  updateOwnedDocument,
} from './collectionHelpers'

function sanitizeAppointment(payload) {
  return {
    title: String(payload.title ?? '').trim(),
    date: String(payload.date ?? '').trim(),
    time: String(payload.time ?? '').trim(),
    vehiclePlate: String(payload.vehiclePlate ?? '').trim().toUpperCase(),
    location: String(payload.location ?? '').trim(),
    status: String(payload.status ?? 'pending').trim(),
    notes: String(payload.notes ?? '').trim(),
  }
}

export function subscribeToAppointments({ ownerId, isAdmin, next, error }) {
  return subscribeToOwnedCollection('appointments', ownerId, isAdmin, next, error)
}

export async function createAppointment(ownerId, payload) {
  return createOwnedDocument('appointments', ownerId, sanitizeAppointment(payload))
}

export async function updateAppointment(id, payload) {
  return updateOwnedDocument('appointments', id, sanitizeAppointment(payload))
}

export async function deleteAppointment(id) {
  return deleteOwnedDocument('appointments', id)
}
