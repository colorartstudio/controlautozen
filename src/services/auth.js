import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { firebaseAuth, isFirebaseConfigured } from '../lib/firebase'

function assertAuthConfigured() {
  if (!isFirebaseConfigured || !firebaseAuth) {
    throw new Error('Firebase Auth nao esta configurado neste ambiente.')
  }
}

export function getAuthAvailability() {
  return {
    ready: isFirebaseConfigured && Boolean(firebaseAuth),
    providerHint: 'Ative Email/Senha e Google no Firebase Authentication.',
  }
}

export function observeAuthState(next, error) {
  if (!firebaseAuth) {
    return () => {}
  }

  return onAuthStateChanged(firebaseAuth, next, error)
}

export async function registerWithEmail({ displayName, email, password }) {
  assertAuthConfigured()

  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password,
  )

  if (displayName) {
    await updateProfile(credential.user, { displayName })
  }

  return credential.user
}

export async function loginWithEmail({ email, password }) {
  assertAuthConfigured()
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password)
  return credential.user
}

export async function loginWithGoogle() {
  assertAuthConfigured()
  const provider = new GoogleAuthProvider()
  const credential = await signInWithPopup(firebaseAuth, provider)
  return credential.user
}

export async function logout() {
  assertAuthConfigured()
  await signOut(firebaseAuth)
}
