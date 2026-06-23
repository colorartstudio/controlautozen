import { FieldValue, getAdminDb } from './firebaseAdmin.js'

const CLAIM_TTL_MINUTES = 15

export function toDate(value) {
  if (!value) {
    return null
  }

  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function getAgentRef(agentId) {
  return getAdminDb().collection('agentHeartbeats').doc(agentId)
}

export async function upsertAgentHeartbeat(agentContext, payload = {}) {
  const ref = getAgentRef(agentContext.agentId)
  const snapshot = await ref.get()

  await ref.set(
    {
      agentId: agentContext.agentId,
      capabilities: payload.capabilities ?? ['session-persisted', 'validation-only'],
      createdAt: snapshot.exists ? snapshot.data()?.createdAt ?? FieldValue.serverTimestamp() : FieldValue.serverTimestamp(),
      currentAccountId: payload.currentAccountId ?? snapshot.data()?.currentAccountId ?? '',
      currentOwnerId: payload.currentOwnerId ?? snapshot.data()?.currentOwnerId ?? '',
      currentTaskId: payload.currentTaskId ?? snapshot.data()?.currentTaskId ?? '',
      hostname: agentContext.hostname || payload.hostname || snapshot.data()?.hostname || '',
      label: agentContext.label || payload.label || snapshot.data()?.label || agentContext.agentId,
      lastClaimAt: payload.lastClaimAt ?? snapshot.data()?.lastClaimAt ?? null,
      lastError: payload.lastError ?? snapshot.data()?.lastError ?? '',
      lastHeartbeatAt: payload.lastHeartbeatAt ?? new Date().toISOString(),
      lastSyncAt: payload.lastSyncAt ?? snapshot.data()?.lastSyncAt ?? null,
      lastValidationAt: payload.lastValidationAt ?? snapshot.data()?.lastValidationAt ?? null,
      platform: agentContext.platform || payload.platform || snapshot.data()?.platform || '',
      queueMode: payload.queueMode ?? snapshot.data()?.queueMode ?? 'single',
      sessionStatus: payload.sessionStatus ?? snapshot.data()?.sessionStatus ?? 'pending',
      status: payload.status ?? snapshot.data()?.status ?? 'idle',
      updatedAt: FieldValue.serverTimestamp(),
      version: agentContext.version || payload.version || snapshot.data()?.version || '',
    },
    { merge: true },
  )
}

export function isClaimStale(task, now = new Date()) {
  const claimedAt = toDate(task?.claimedAt)

  if (!claimedAt) {
    return false
  }

  return now.getTime() - claimedAt.getTime() > CLAIM_TTL_MINUTES * 60 * 1000
}

function parseSortDate(value) {
  const date = toDate(value)
  return date ? date.getTime() : Number.MAX_SAFE_INTEGER
}

export function isTaskDueNow(task, now = new Date()) {
  if (!task?.nextRunAt) {
    return true
  }

  const nextRunAt = toDate(task.nextRunAt)

  if (!nextRunAt) {
    return true
  }

  return nextRunAt.getTime() <= now.getTime()
}

export function sortTasksForQueue(left, right) {
  const priorityDiff = Number(left.priority ?? 999) - Number(right.priority ?? 999)

  if (priorityDiff !== 0) {
    return priorityDiff
  }

  const nextRunDiff = parseSortDate(left.nextRunAt) - parseSortDate(right.nextRunAt)

  if (nextRunDiff !== 0) {
    return nextRunDiff
  }

  return parseSortDate(left.updatedAt) - parseSortDate(right.updatedAt)
}

export function isTaskClaimable(task, now = new Date()) {
  if (String(task?.status ?? '') !== 'active') {
    return false
  }

  if (!isTaskDueNow(task, now)) {
    return false
  }

  if (!task?.claimedBy || !task?.claimedAt) {
    return true
  }

  return isClaimStale(task, now)
}

export function buildQueueSummary(tasks) {
  return {
    activeCount: tasks.filter((item) => item.status === 'active').length,
    claimedCount: tasks.filter(
      (item) => item.agentStatus === 'claimed' && item.claimedBy,
    ).length,
    queuedCount: tasks.filter(
      (item) =>
        item.status === 'active' &&
        isTaskDueNow(item) &&
        (!item.claimedBy || !item.claimedAt || isClaimStale(item)),
    ).length,
  }
}
