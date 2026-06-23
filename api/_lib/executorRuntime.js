import { FieldValue, getAdminDb } from './firebaseAdmin.js'

const LOCK_COLLECTION = 'systemLocks'
const LOCK_DOCUMENT_ID = 'executor'

function getExecutorLockRef() {
  return getAdminDb().collection(LOCK_COLLECTION).doc(LOCK_DOCUMENT_ID)
}

function addHours(date, hours) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function toDate(value) {
  if (!value) {
    return null
  }

  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export async function acquireExecutorLock(context) {
  const lockRef = getExecutorLockRef()
  const now = new Date()
  const expiresAt = addHours(now, 1)

  await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(lockRef)
    const current = snapshot.exists ? snapshot.data() : null
    const currentExpiresAt = toDate(current?.expiresAt)
    const isBusy = current?.status === 'running' && currentExpiresAt && currentExpiresAt > now

    if (isBusy) {
      throw new Error('Executor ocupado. Aguarde a fila atual terminar antes de iniciar outro ciclo.')
    }

    transaction.set(
      lockRef,
      {
        externalAccountId: context.externalAccountId,
        externalAccountName: context.externalAccountName,
        expiresAt,
        ownerId: context.ownerId,
        startedAt: now,
        status: 'running',
        taskId: context.taskId,
        updatedAt: now,
      },
      { merge: true },
    )
  })

  return {
    expiresAt,
    lockRef,
    startedAt: now,
  }
}

export async function releaseExecutorLock(status = 'idle') {
  const lockRef = getExecutorLockRef()

  await lockRef.set(
    {
      completedAt: new Date(),
      expiresAt: null,
      status,
      updatedAt: new Date(),
    },
    { merge: true },
  )
}

export async function createExecutorLog(ownerId, payload) {
  const ref = getAdminDb().collection('executionLogs').doc()

  await ref.set({
    createdAt: FieldValue.serverTimestamp(),
    ownerId,
    updatedAt: FieldValue.serverTimestamp(),
    ...payload,
  })

  return ref.id
}

export async function updateTaskExecution(taskRef, payload) {
  await taskRef.set(
    {
      ...payload,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}

export async function updateExternalAccountRuntime(accountRef, payload) {
  await accountRef.set(
    {
      ...payload,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  )
}

export function calculateNextRunAt(task) {
  const now = new Date()
  const cycleHours = Number(task?.cycleHours ?? 3)
  return addHours(now, cycleHours)
}
