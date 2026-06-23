import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'

function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`)
  }

  return value
}

function getPrivateKey() {
  return getRequiredEnv('FIREBASE_ADMIN_PRIVATE_KEY').replace(/\\n/g, '\n')
}

function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]
  }

  return initializeApp({
    credential: cert({
      projectId: getRequiredEnv('FIREBASE_ADMIN_PROJECT_ID'),
      clientEmail: getRequiredEnv('FIREBASE_ADMIN_CLIENT_EMAIL'),
      privateKey: getPrivateKey(),
    }),
    databaseURL: process.env.FIREBASE_ADMIN_DATABASE_URL,
  })
}

function getAdminAuth() {
  return getAuth(getAdminApp())
}

function getAdminDb() {
  return getFirestore(getAdminApp())
}

export { FieldValue, getAdminAuth, getAdminDb }
