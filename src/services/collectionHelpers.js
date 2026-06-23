import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { firestoreDb } from '../lib/firebase'

function assertFirestore() {
  if (!firestoreDb) {
    throw new Error('Firestore nao esta configurado neste ambiente.')
  }
}

export function getCollectionRef(name) {
  assertFirestore()
  return collection(firestoreDb, name)
}

export function subscribeToOwnedCollection(
  name,
  ownerId,
  isAdmin,
  next,
  error,
  options = {},
) {
  const ref = getCollectionRef(name)
  const {
    filters = [],
    sortDirection = 'desc',
    sortField = 'updatedAt',
  } = options
  const constraints = [...filters, orderBy(sortField, sortDirection)]

  if (!isAdmin) {
    constraints.unshift(where('ownerId', '==', ownerId))
  }

  const collectionQuery = query(ref, ...constraints)

  return onSnapshot(
    collectionQuery,
    (snapshot) => {
      next(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
    },
    error,
  )
}

export async function createOwnedDocument(name, ownerId, payload) {
  const ref = getCollectionRef(name)
  const document = {
    ...payload,
    ownerId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }

  return addDoc(ref, document)
}

export async function updateOwnedDocument(name, id, payload) {
  assertFirestore()
  const ref = doc(firestoreDb, name, id)
  await updateDoc(ref, {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteOwnedDocument(name, id) {
  assertFirestore()
  const ref = doc(firestoreDb, name, id)
  await deleteDoc(ref)
}
