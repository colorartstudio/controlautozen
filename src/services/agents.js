import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { firestoreDb } from '../lib/firebase'

function assertFirestore() {
  if (!firestoreDb) {
    throw new Error('Firestore nao esta configurado neste ambiente.')
  }
}

export function subscribeToAgentHeartbeats({ next, error }) {
  assertFirestore()

  const ref = collection(firestoreDb, 'agentHeartbeats')
  const agentQuery = query(ref, orderBy('updatedAt', 'desc'))

  return onSnapshot(
    agentQuery,
    (snapshot) => {
      next(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
    },
    error,
  )
}
