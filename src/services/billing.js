import { callProtectedApi } from './secureApi'

export async function createSubscriptionPayment() {
  return callProtectedApi('/api/billing/create-payment')
}

export async function refreshSubscriptionPaymentStatus(paymentId) {
  return callProtectedApi('/api/billing/get-status', { paymentId })
}
