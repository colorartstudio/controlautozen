const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  currency: 'BRL',
  style: 'currency',
})

export function formatCurrencyBRL(value) {
  return currencyFormatter.format(Number(value ?? 0))
}

export function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function formatCountdown(value) {
  if (!value) {
    return 'Sem agenda'
  }

  const target =
    typeof value?.toDate === 'function'
      ? value.toDate().getTime()
      : new Date(value).getTime()

  if (Number.isNaN(target)) {
    return 'Sem agenda'
  }

  const difference = target - Date.now()

  if (difference <= 0) {
    return 'Pronto para executar'
  }

  const totalMinutes = Math.floor(difference / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  return `${hours}h ${minutes}min`
}

export function getStatusTone(status) {
  switch (status) {
    case 'active':
    case 'connected':
    case 'completed':
    case 'success':
    case 'trialing':
      return 'emerald'
    case 'paused':
    case 'pending':
    case 'draft':
      return 'amber'
    case 'blocked':
    case 'expired':
    case 'failed':
    case 'archived':
      return 'rose'
    default:
      return 'slate'
  }
}

export function buildReferralUrl(code) {
  if (!code) {
    return ''
  }

  if (typeof window === 'undefined') {
    return `/login?ref=${encodeURIComponent(code)}`
  }

  const base = `${window.location.origin}/login`
  return `${base}?ref=${encodeURIComponent(code)}`
}
