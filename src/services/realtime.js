import { isFirebaseConfigured, realtimeDb } from '../lib/firebase'

export function getRealtimeAvailability() {
  return {
    ready: isFirebaseConfigured && Boolean(realtimeDb),
    hint: 'Use o Realtime Database apenas quando fizer sentido para dados em tempo real.',
  }
}
