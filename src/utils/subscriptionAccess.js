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

export function getSubscriptionAccessState(subscription) {
  const now = new Date()
  const trialEndsAt = toDate(subscription?.trialEndsAt)
  const nextBillingAt = toDate(subscription?.nextBillingAt)
  const status = String(subscription?.status ?? '').trim().toLowerCase()
  const isTrialing = status === 'trialing' && trialEndsAt && trialEndsAt > now
  const isActive = status === 'active' && nextBillingAt && nextBillingAt > now

  if (isActive) {
    return {
      canManageProduct: true,
      effectiveStatus: 'active',
      readOnlyReason: '',
    }
  }

  if (isTrialing) {
    return {
      canManageProduct: true,
      effectiveStatus: 'trialing',
      readOnlyReason: '',
    }
  }

  return {
    canManageProduct: false,
    effectiveStatus: 'paused',
    readOnlyReason:
      'Assinatura pausada. Contas e automacoes ficam em modo leitura ate a confirmacao do pagamento.',
  }
}

export function getBillingStatusLabel(paymentStatus) {
  const status = String(paymentStatus ?? '').trim().toLowerCase()

  switch (status) {
    case 'waiting':
      return 'Aguardando pagamento'
    case 'confirming':
      return 'Confirmando na rede'
    case 'confirmed':
      return 'Pagamento confirmado'
    case 'sending':
      return 'Liquidando pagamento'
    case 'finished':
      return 'Pagamento concluido'
    case 'partially_paid':
      return 'Pagamento parcial'
    case 'failed':
      return 'Pagamento falhou'
    case 'expired':
      return 'Pagamento expirado'
    case 'refunded':
      return 'Pagamento devolvido'
    default:
      return 'Sem cobranca ativa'
  }
}
