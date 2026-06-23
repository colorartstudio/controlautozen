import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getFirestore } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from '../config/env'

let firebaseApp = null
let firebaseAnalytics = null
let firebaseAuth = null
let firestoreDb = null
let realtimeDb = null
let analyticsStatus = 'desativado'

if (isFirebaseConfigured) {
  firebaseApp = initializeApp(firebaseConfig)
  firebaseAuth = getAuth(firebaseApp)
  firestoreDb = getFirestore(firebaseApp)
  realtimeDb = getDatabase(firebaseApp)
  analyticsStatus = 'inicializando'

  isSupported()
    .then((supported) => {
      if (!supported) {
        analyticsStatus = 'nao-suportado'
        return null
      }

      firebaseAnalytics = getAnalytics(firebaseApp)
      analyticsStatus = 'pronto'
      return firebaseAnalytics
    })
    .catch(() => {
      analyticsStatus = 'erro'
    })
}

export {
  analyticsStatus,
  firebaseAnalytics,
  firebaseApp,
  firebaseAuth,
  firestoreDb,
  isFirebaseConfigured,
  realtimeDb,
}
