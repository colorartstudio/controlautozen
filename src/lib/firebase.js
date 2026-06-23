import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from '../config/env'

let firebaseApp = null
let firebaseAuth = null
let firestoreDb = null

if (isFirebaseConfigured) {
  firebaseApp = initializeApp(firebaseConfig)
  firebaseAuth = getAuth(firebaseApp)
  firestoreDb = getFirestore(firebaseApp)
}

export { firebaseApp, firebaseAuth, firestoreDb, isFirebaseConfigured }
