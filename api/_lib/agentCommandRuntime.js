import { decryptText } from './crypto.js'
import { FieldValue, getAdminDb } from './firebaseAdmin.js'
import {
  getEffectiveSubscriptionState,
  getSubscriptionSnapshot,
} from './subscriptionAccess.js'
import { isClaimStale, toDate } from './agentRuntime.js'

const ALLOWED_COMMAND_TYPES = new Set([
  'validate_session',
  'open_trade',
  'prepare_cycle',
])

export function sanitizeAgentCommandType(value) {
  const commandType = String(value ?? '').trim()
  return ALLOWED_COMMAND_TYPES.has(commandType) ? commandType : 'validate_session'
}

export function sortCommandsForQueue(left, right) {
  const leftCreatedAt = toDate(left.createdAt)?.getTime() ?? Number.MAX_SAFE_INTEGER
  const rightCreatedAt = toDate(right.createdAt)?.getTime() ?? Number.MAX_SAFE_INTEGER

  if (leftCreatedAt !== rightCreatedAt) {
    return leftCreatedAt - rightCreatedAt
  }

  const leftUpdatedAt = toDate(left.updatedAt)?.getTime() ?? Number.MAX_SAFE_INTEGER
  const rightUpdatedAt = toDate(right.updatedAt)?.getTime() ?? Number.MAX_SAFE_INTEGER

  return leftUpdatedAt - rightUpdatedAt
}

export function isCommandClaimable(command) {
  const status = String(command?.status ?? '')

  if (status === 'queued') {
    return true
  }

  if (status !== 'claimed') {
    return false
  }

  return isClaimStale(command)
}

export async function getAgentExternalAccountPayload(externalAccountId, fallbackName = '') {
  const adminDb = getAdminDb()
  const accountRef = adminDb.collection('externalAccounts').doc(externalAccountId)
  const secretRef = adminDb.collection('externalAccountSecrets').doc(externalAccountId)
  const [accountSnapshot, secretSnapshot] = await Promise.all([accountRef.get(), secretRef.get()])

  if (!accountSnapshot.exists) {
    return null
  }

  const account = accountSnapshot.data()
  const secrets = secretSnapshot.exists ? secretSnapshot.data() : null
  const credentials =
    secrets?.phoneEncrypted && secrets?.passwordEncrypted
      ? {
          password: decryptText(secrets.passwordEncrypted),
          phone: decryptText(secrets.phoneEncrypted),
        }
      : null

  return {
    credentials,
    hasPassword: account.hasPassword ?? false,
    id: externalAccountId,
    name: account.name ?? fallbackName,
    phoneMasked: account.phoneMasked ?? '',
    sessionMode: account.sessionMode ?? 'browser-persisted',
    sessionStatus: account.sessionStatus ?? 'pending',
    status: account.status ?? 'active',
  }
}

export async function assertAgentWorkloadAllowed(ownerId) {
  const { subscription } = await getSubscriptionSnapshot(ownerId)
  const subscriptionState = getEffectiveSubscriptionState(subscription)

  return subscriptionState.canManageProduct
}

export async function markCommandQueued(commandRef, payload) {
  await commandRef.set(
    {
      ...payload,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}
