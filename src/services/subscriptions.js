import {
  Timestamp,
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

function subscriptionDocRef(uid) {
  assertFirestore()
  return doc(firestoreDb, 'subscriptions', uid)
}

function buildDefaultSubscription(uid) {
  return {
    ownerId: uid,
    planName: 'ControlAutoZen Starter',
    priceAmount: 20,
    currency: 'BRL',
    billingCycle: 'monthly',
    billingCycleDays: 30,
    billingProvider: 'nowpayments',
    paymentAddress: '',
    paymentAmount: null,
    paymentCurrency: 'usdtbsc',
    paymentContext: '',
    paymentExpiresAt: null,
    paymentId: null,
    paymentOrderId: '',
    paymentStatus: '',
    paymentUrl: '',
    pausedAt: null,
    purchaseId: null,
    renewalWindowDays: 5,
    trialConsumedAt: null,
    status: 'trialing',
    trialDays: 7,
    trialEndsAt: Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ),
    lastPaymentAt: null,
    nextBillingAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

export async function ensureSubscriptionProfile(authUser) {
  const ref = subscriptionDocRef(authUser.uid)
  const snapshot = await getDoc(ref)

  if (snapshot.exists()) {
    return
  }

  await setDoc(ref, buildDefaultSubscription(authUser.uid))
}

export function subscribeToSubscription(uid, next, error) {
  const ref = subscriptionDocRef(uid)
  return onSnapshot(
    ref,
    (snapshot) => next(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null),
    error,
  )
}

export async function updateOwnSubscription(uid, payload) {
  const ref = subscriptionDocRef(uid)
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}
