import { analyticsStatus, firebaseAnalytics, isFirebaseConfigured } from '../lib/firebase'

export function getAnalyticsAvailability() {
  return {
    ready: isFirebaseConfigured && Boolean(firebaseAnalytics),
    status: analyticsStatus,
    hint: 'O Analytics depende de navegador suportado e do measurement ID.',
  }
}
