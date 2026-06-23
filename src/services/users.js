import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  collection,
} from 'firebase/firestore'
import { firestoreDb } from '../lib/firebase'

const USER_FIELDS = ['displayName', 'phone', 'photoURL']
const ADMIN_FIELDS = ['displayName', 'phone', 'photoURL', 'notes']

function assertFirestore() {
  if (!firestoreDb) {
    throw new Error('Firestore nao esta configurado neste ambiente.')
  }
}

function userDocRef(uid) {
  assertFirestore()
  return doc(firestoreDb, 'users', uid)
}

function sanitizePayload(source, allowedKeys) {
  return allowedKeys.reduce((result, key) => {
    const value = source[key]

    if (value !== undefined) {
      result[key] = typeof value === 'string' ? value.trim() : value
    }

    return result
  }, {})
}

function buildProviderIds(authUser) {
  return authUser.providerData
    .map((provider) => provider.providerId)
    .filter(Boolean)
}

export async function ensureUserProfile(authUser) {
  const ref = userDocRef(authUser.uid)
  const snapshot = await getDoc(ref)

  if (!snapshot.exists()) {
    await setDoc(ref, {
      uid: authUser.uid,
      email: authUser.email ?? '',
      displayName: authUser.displayName ?? '',
      phone: authUser.phoneNumber ?? '',
      photoURL: authUser.photoURL ?? '',
      providerIds: buildProviderIds(authUser),
      role: 'user',
      status: 'active',
      authDisabled: false,
      notes: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    })

    return
  }

  await setDoc(
    ref,
    {
      email: authUser.email ?? snapshot.data().email ?? '',
      displayName: authUser.displayName ?? snapshot.data().displayName ?? '',
      phone: authUser.phoneNumber ?? snapshot.data().phone ?? '',
      photoURL: authUser.photoURL ?? snapshot.data().photoURL ?? '',
      providerIds: buildProviderIds(authUser),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  )
}

export function subscribeToUserProfile(uid, next, error) {
  const ref = userDocRef(uid)
  return onSnapshot(
    ref,
    (snapshot) => {
      next(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null)
    },
    error,
  )
}

export function subscribeToUsers(next, error) {
  assertFirestore()
  const usersQuery = query(collection(firestoreDb, 'users'), orderBy('updatedAt', 'desc'))

  return onSnapshot(
    usersQuery,
    (snapshot) => {
      next(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
    },
    error,
  )
}

export async function updateOwnProfile(uid, payload) {
  const ref = userDocRef(uid)
  const sanitized = sanitizePayload(payload, USER_FIELDS)

  await updateDoc(ref, {
    ...sanitized,
    updatedAt: serverTimestamp(),
  })
}

export async function updateUserAsAdmin(uid, payload) {
  const ref = userDocRef(uid)
  const sanitized = sanitizePayload(payload, ADMIN_FIELDS)

  await updateDoc(ref, {
    ...sanitized,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteUserProfile(uid) {
  const ref = userDocRef(uid)
  await deleteDoc(ref)
}
