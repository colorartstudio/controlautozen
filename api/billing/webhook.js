import { FieldValue, getAdminDb } from '../_lib/firebaseAdmin.js'
import { parseBody, sendJson } from '../_lib/adminAuth.js'
import { verifyNowPaymentsSignature } from '../_lib/nowPayments.js'
import { buildActiveSubscriptionPatch } from '../_lib/subscriptionAccess.js'

function isCompletedPaymentStatus(status) {
  return ['confirmed', 'finished', 'sending'].includes(
    String(status ?? '').trim().toLowerCase(),
  )
}

function isFailedPaymentStatus(status) {
  return ['failed', 'expired', 'refunded'].includes(
    String(status ?? '').trim().toLowerCase(),
  )
}

function extractUidFromOrderId(orderId) {
  const value = String(orderId ?? '').trim()

  if (!value.startsWith('subscription-')) {
    return ''
  }

  const parts = value.split('-')
  return parts.length >= 3 ? parts[1] : ''
}

async function resolveSubscriptionRef(payload) {
  const uid = extractUidFromOrderId(payload.order_id)
  const adminDb = getAdminDb()

  if (uid) {
    const ref = adminDb.collection('subscriptions').doc(uid)
    const snapshot = await ref.get()

    if (snapshot.exists) {
      return { ref, snapshot }
    }
  }

  const paymentId = payload.payment_id ?? payload.id

  if (!paymentId) {
    return { ref: null, snapshot: null }
  }

  const querySnapshot = await adminDb
    .collection('subscriptions')
    .where('paymentId', '==', paymentId)
    .limit(1)
    .get()

  if (querySnapshot.empty) {
    return { ref: null, snapshot: null }
  }

  return {
    ref: querySnapshot.docs[0].ref,
    snapshot: querySnapshot.docs[0],
  }
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, { message: 'Metodo nao permitido.' })
  }

  try {
    const payload = parseBody(request)
    const signature = request.headers['x-nowpayments-sig']

    if (!verifyNowPaymentsSignature(payload, signature)) {
      return sendJson(response, 401, { message: 'Assinatura IPN invalida.' })
    }

    const { ref, snapshot } = await resolveSubscriptionRef(payload)

    if (!ref || !snapshot?.exists) {
      return sendJson(response, 404, {
        message: 'Assinatura relacionada ao pagamento nao encontrada.',
      })
    }

    const subscription = snapshot.data()
    const paymentStatus = payload.payment_status ?? 'waiting'
    const patch = {
      actuallyPaid: payload.actually_paid ?? null,
      outcomeAmount: payload.outcome_amount ?? null,
      outcomeCurrency: payload.outcome_currency ?? null,
      payAmount: payload.pay_amount ?? null,
      paymentAddress: payload.pay_address ?? subscription.paymentAddress ?? '',
      paymentAmount: payload.pay_amount ?? subscription.paymentAmount ?? null,
      paymentCurrency: payload.pay_currency ?? subscription.paymentCurrency ?? '',
      paymentContext: subscription.paymentContext ?? '',
      paymentExpiresAt: payload.expiration_estimate_date
        ? new Date(payload.expiration_estimate_date)
        : subscription.paymentExpiresAt ?? null,
      paymentId: payload.payment_id ?? subscription.paymentId ?? null,
      paymentOrderId: payload.order_id ?? subscription.paymentOrderId ?? null,
      paymentStatus,
      purchaseId: payload.purchase_id ?? subscription.purchaseId ?? null,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (isCompletedPaymentStatus(paymentStatus)) {
      Object.assign(patch, buildActiveSubscriptionPatch(subscription))
      patch.lastPaymentAt = new Date()
      patch.pausedAt = null
      patch.trialConsumedAt = subscription.trialConsumedAt ?? new Date()
    } else if (isFailedPaymentStatus(paymentStatus)) {
      patch.status = 'paused'
      patch.pausedAt = new Date()
    }

    await ref.set(patch, { merge: true })

    return sendJson(response, 200, { ok: true })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ?? 'Falha ao processar callback da NOWPayments.',
    })
  }
}
