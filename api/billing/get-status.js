import { FieldValue } from '../_lib/firebaseAdmin.js'
import { getNowPaymentStatus } from '../_lib/nowPayments.js'
import {
  buildActiveSubscriptionPatch,
  getEffectiveSubscriptionState,
  getSubscriptionSnapshot,
} from '../_lib/subscriptionAccess.js'
import {
  parseBody,
  requireAuthenticatedRequest,
  sendJson,
} from '../_lib/adminAuth.js'

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
    const { ref, subscription } = await getSubscriptionSnapshot(authContext.uid)
    const paymentId = String(body.paymentId ?? subscription?.paymentId ?? '').trim()

    if (!paymentId) {
      return sendJson(response, 400, {
        message: 'Nenhum pagamento pendente foi encontrado para consulta.',
      })
    }

    const payment = await getNowPaymentStatus(paymentId)
    const paymentStatus = payment.payment_status ?? 'waiting'
    const patch = {
      actuallyPaid: payment.actually_paid ?? null,
      outcomeAmount: payment.outcome_amount ?? null,
      outcomeCurrency: payment.outcome_currency ?? null,
      payAmount: payment.pay_amount ?? null,
      paymentAddress: payment.pay_address ?? subscription?.paymentAddress ?? '',
      paymentAmount: payment.pay_amount ?? subscription?.paymentAmount ?? null,
      paymentCurrency: payment.pay_currency ?? subscription?.paymentCurrency ?? '',
      paymentContext: subscription?.paymentContext ?? '',
      paymentExpiresAt: payment.expiration_estimate_date
        ? new Date(payment.expiration_estimate_date)
        : subscription?.paymentExpiresAt ?? null,
      paymentId,
      paymentStatus,
      updatedAt: FieldValue.serverTimestamp(),
    }

    if (isCompletedPaymentStatus(paymentStatus)) {
      Object.assign(patch, buildActiveSubscriptionPatch(subscription))
      patch.lastPaymentAt = new Date()
      patch.pausedAt = null
      patch.trialConsumedAt = subscription?.trialConsumedAt ?? new Date()
    } else if (isFailedPaymentStatus(paymentStatus)) {
      const state = getEffectiveSubscriptionState(subscription)
      patch.status = state.canManageProduct ? state.effectiveStatus : 'paused'

      if (!state.canManageProduct) {
        patch.pausedAt = new Date()
      }
    }

    await ref.set(patch, { merge: true })

    return sendJson(response, 200, {
      ok: true,
      paymentStatus,
      status: patch.status ?? subscription?.status ?? 'trialing',
    })
  } catch (error) {
    return sendJson(response, 500, {
      message:
        error.message ??
        'Nao foi possivel atualizar o status do pagamento na NOWPayments.',
    })
  }
}
