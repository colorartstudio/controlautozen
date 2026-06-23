import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { firestoreDb } from '../lib/firebase'

function assertFirestore() {
  if (!firestoreDb) {
    throw new Error('Firestore nao esta configurado neste ambiente.')
  }
}

function referralDocRef(uid) {
  assertFirestore()
  return doc(firestoreDb, 'referrals', uid)
}

function buildReferralCode(authUser) {
  const seed = String(
    authUser.displayName ?? authUser.email ?? authUser.uid ?? 'CONTROLAUTOZEN',
  )
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')

  return `CAZ-${(seed || authUser.uid).slice(0, 8)}`
}

function buildDefaultReferral(authUser) {
  const code = buildReferralCode(authUser)

  return {
    ownerId: authUser.uid,
    code,
    invitePath: `/login?ref=${code}`,
    status: 'inactive',
    referredCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

export async function ensureReferralProfile(authUser) {
  const ref = referralDocRef(authUser.uid)
  const snapshot = await getDoc(ref)

  if (snapshot.exists()) {
    return
  }

  await setDoc(ref, buildDefaultReferral(authUser))
}

export function subscribeToReferral(uid, next, error) {
  const ref = referralDocRef(uid)
  return onSnapshot(
    ref,
    (snapshot) => next(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    error,
  )
}

export async function updateOwnReferral(uid, payload) {
  const ref = referralDocRef(uid)
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}
