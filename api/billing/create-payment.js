import { FieldValue } from '../_lib/firebaseAdmin.js'
import {
  buildNowPaymentsPayload,
  createNowPayment,
} from '../_lib/nowPayments.js'
import {
  getEffectiveSubscriptionState,
  getSubscriptionPaymentContext,
  getSubscriptionSnapshot,
} from '../_lib/subscriptionAccess.js'
import {
  parseBody,
  requireAuthenticatedRequest,
  sendJson,
} from '../_lib/adminAuth.js'

function getRequestOrigin(request) {
  const protocol = request.headers['x-forwarded-proto'] ?? 'https'
  const host = request.headers['x-forwarded-host'] ?? request.headers.host

  if (!host) {
    throw new Error('Nao foi possivel identificar a URL publica da aplicacao.')
  }

  return `${protocol}://${host}`
}

function getExistingPayment(subscription) {
  if (!subscription?.paymentId) {
    return null
  }

  const status = String(subscription.paymentStatus ?? '').trim().toLowerCase()
  const expiresAt = subscription.paymentExpiresAt?.toDate?.() ?? null
  const isReusableStatus = ['waiting', 'confirming', 'partially_paid'].includes(status)

  if (isReusableStatus && (!expiresAt || expiresAt > new Date())) {
    return {
      paymentAddress: subscription.paymentAddress ?? '',
      paymentAmount: subscription.paymentAmount ?? null,
      paymentCurrency: subscription.paymentCurrency ?? '',
      paymentExpiresAt: subscription.paymentExpiresAt ?? null,
      paymentId: subscription.paymentId,
      paymentContext: subscription.paymentContext ?? '',
      paymentStatus: subscription.paymentStatus ?? 'waiting',
      qrCodeUrl: subscription.qrCodeUrl ?? '',
    }
  }

  return null
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { message: 'Metodo nao permitido.' })
  }

  try {
    const authContext = await requireAuthenticatedRequest(request)

    if (authContext.error) {
      return sendJson(response, authContext.error.status, {
        message: authContext.error.message,
      })
    }

    const body = parseBody(request)
    const origin = getRequestOrigin(request)
    const { ref, subscription } = await getSubscriptionSnapshot(authContext.uid)
    const effectiveState = getEffectiveSubscriptionState(subscription)
    const paymentContext = getSubscriptionPaymentContext(subscription)
    const existingPayment = getExistingPayment(subscription)

    if (existingPayment) {
      return sendJson(response, 200, {
        ok: true,
        reused: true,
        paymentContext: existingPayment.paymentContext ?? paymentContext.value,
        subscriptionStatus: effectiveState.effectiveStatus,
        ...existingPayment,
      })
    }

    const orderId = `subscription-${authContext.uid}-${Date.now()}`
    const orderDescription = String(
      body.orderDescription ?? `${paymentContext.label} ControlAutoZen`,
    ).trim()

    const payment = await createNowPayment(
      buildNowPaymentsPayload({
        ipn_callback_url: `${origin}/api/billing/webhook`,
        order_description: orderDescription,
        order_id: orderId,
      }),
    )

    await ref.set(
      {
        billingProvider: 'nowpayments',
        paymentAddress: payment.pay_address ?? '',
        paymentAmount: payment.pay_amount ?? null,
        paymentCurrency: payment.pay_currency ?? '',
        paymentContext: paymentContext.value,
        paymentExpiresAt: payment.expiration_estimate_date
          ? new Date(payment.expiration_estimate_date)
          : null,
        paymentId: payment.payment_id ?? null,
        paymentOrderId: payment.order_id ?? orderId,
        paymentStatus: payment.payment_status ?? 'waiting',
        paymentUrl: payment.invoice_url ?? '',
        purchaseId: payment.purchase_id ?? null,
        status: subscription?.status ?? 'trialing',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    )

    return sendJson(response, 200, {
      ok: true,
      paymentAddress: payment.pay_address ?? '',
      paymentAmount: payment.pay_amount ?? null,
      paymentCurrency: payment.pay_currency ?? '',
      paymentContext: paymentContext.value,
      paymentExpiresAt: payment.expiration_estimate_date ?? null,
      paymentId: payment.payment_id ?? null,
      paymentStatus: payment.payment_status ?? 'waiting',
      qrCodeUrl: payment.qr_code_url ?? '',
      subscriptionStatus: effectiveState.effectiveStatus,
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Nao foi possivel criar a cobranca cripto. Confira as variaveis NOWPAYMENTS_* no ambiente.',
    })
  }
}
