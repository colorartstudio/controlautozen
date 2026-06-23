import { getAdminDb } from './firebaseAdmin.js'

const DEFAULT_BILLING_CYCLE_DAYS = 30
const DEFAULT_RENEWAL_WINDOW_DAYS = 5

function toDate(value) {
  if (!value) {
    return null
  }

  if (typeof value.toDate === 'function') {
    return value.toDate()
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function hasTrialAccess(subscription, now) {
  const trialEndsAt = toDate(subscription?.trialEndsAt)
  return subscription?.status === 'trialing' && trialEndsAt && trialEndsAt > now
}

function hasActiveAccess(subscription, now) {
  const nextBillingAt = toDate(subscription?.nextBillingAt)
  return subscription?.status === 'active' && nextBillingAt && nextBillingAt > now
}

export function getEffectiveSubscriptionState(subscription, now = new Date()) {
  if (!subscription) {
    return {
      canManageProduct: false,
      effectiveStatus: 'missing',
      shouldPauseAutomation: false,
    }
  }

  if (hasTrialAccess(subscription, now)) {
    return {
      canManageProduct: true,
      effectiveStatus: 'trialing',
      shouldPauseAutomation: false,
    }
  }

  if (hasActiveAccess(subscription, now)) {
    return {
      canManageProduct: true,
      effectiveStatus: 'active',
      shouldPauseAutomation: false,
    }
  }

  return {
    canManageProduct: false,
    effectiveStatus: 'paused',
    shouldPauseAutomation: true,
  }
}

export function getSubscriptionPaymentContext(subscription, now = new Date()) {
  const state = getEffectiveSubscriptionState(subscription, now)
  const nextBillingAt = toDate(subscription?.nextBillingAt)
  const renewalWindowDays = Number(
    subscription?.renewalWindowDays ?? DEFAULT_RENEWAL_WINDOW_DAYS,
  )
  const renewalWindowStartsAt = nextBillingAt
    ? addDays(nextBillingAt, renewalWindowDays * -1)
    : null

  if (state.effectiveStatus === 'active') {
    return {
      label:
        renewalWindowStartsAt && renewalWindowStartsAt <= now
          ? 'Renovacao disponivel'
          : 'Renovacao antecipada',
      renewalWindowStartsAt,
      value: 'renewal',
    }
  }

  if (subscription?.status === 'paused' || state.effectiveStatus === 'paused') {
    return {
      label: 'Reativacao',
      renewalWindowStartsAt,
      value: 'reactivation',
    }
  }

  return {
    label: 'Primeira cobranca',
    renewalWindowStartsAt,
    value: 'initial',
  }
}

export async function getSubscriptionSnapshot(uid) {
  const ref = getAdminDb().collection('subscriptions').doc(uid)
  const snapshot = await ref.get()
  return {
    ref,
    snapshot,
    subscription: snapshot.exists ? snapshot.data() : null,
  }
}

export async function assertSubscriptionWriteAccess(uid) {
  const { subscription } = await getSubscriptionSnapshot(uid)
  const state = getEffectiveSubscriptionState(subscription)

  if (!state.canManageProduct) {
    throw new Error(
      'Sua assinatura nao esta ativa para criar ou gerenciar contas e automacoes. Renove no modulo Assinatura.',
    )
  }

  return {
    state,
    subscription,
  }
}

export function buildActiveSubscriptionPatch(subscription, now = new Date()) {
  const currentNextBillingAt = toDate(subscription?.nextBillingAt)
  const baseDate = currentNextBillingAt && currentNextBillingAt > now ? currentNextBillingAt : now
  const billingCycleDays = Number(
    subscription?.billingCycleDays ?? DEFAULT_BILLING_CYCLE_DAYS,
  )

  return {
    nextBillingAt: addDays(baseDate, billingCycleDays),
    pausedAt: null,
    status: 'active',
    trialConsumedAt: subscription?.trialConsumedAt ?? now,
  }
}
