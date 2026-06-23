export function buildNextRunAt(task, now = new Date()) {
  const cycleHours = Number(task?.cycleHours ?? 3)
  const safeCycleHours = Number.isFinite(cycleHours) && cycleHours > 0 ? cycleHours : 3

  return new Date(now.getTime() + safeCycleHours * 60 * 60 * 1000).toISOString()
}

export function buildValidationSummary({
  externalAccount,
  task,
  validationStatus,
  prefix,
}) {
  const accountName = externalAccount?.name || task?.externalAccountName || 'Conta sem nome'

  if (validationStatus === 'failed' || validationStatus === 'error') {
    return `${prefix || 'Validacao'} falhou para ${accountName}.`
  }

  return `${prefix || 'Validacao'} concluida para ${accountName}.`
}
