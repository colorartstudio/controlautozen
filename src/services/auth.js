import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase'

export function getAuthAvailability() {
  return {
    ready: isFirebaseConfigured && Boolean(firebaseAuth),
    providerHint: 'Ative um provedor no Firebase Authentication antes de logar.',
  }
}
