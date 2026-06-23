import { firestoreDb, isFirebaseConfigured } from '../lib/firebase'

export function getFirestoreAvailability() {
  return {
    ready: isFirebaseConfigured && Boolean(firestoreDb),
    collectionHint: 'Crie suas colecoes e regras antes de gravar dados reais.',
  }
}
