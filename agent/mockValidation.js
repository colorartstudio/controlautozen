import { buildNextRunAt, buildValidationSummary } from './taskResult.js'

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function simulateClaimedTask({ config, externalAccount, task }) {
  const startedAt = new Date()
  await sleep(config.validationDelayMs)

  const validationStatus = config.simulatedValidationStatus
  const hasError = validationStatus === 'failed' || validationStatus === 'error'
  const sessionStatus = hasError ? 'expired_session' : config.simulatedSessionStatus
  const validationSummary = buildValidationSummary({
    externalAccount,
    prefix: 'Sessao validada e tarefa sincronizada',
    task,
    validationStatus,
  })

  return {
    lastError: hasError ? validationSummary : '',
    logs: [
      {
        message: `Claim recebido para ${externalAccount?.name || task.externalAccountName}.`,
        source: 'agent',
        status: 'pending',
        taskId: task.id,
        type: 'claim',
      },
      {
        message: 'Sessao persistida verificada pelo worker de exemplo.',
        source: 'agent',
        status: hasError ? 'failed' : 'success',
        taskId: task.id,
        type: 'session',
      },
      {
        message: validationSummary,
        source: 'agent',
        status: hasError ? 'failed' : 'success',
        taskId: task.id,
        type: 'validation',
      },
    ],
    nextRunAt: buildNextRunAt(task, startedAt),
    sessionStatus,
    validationStatus,
    validationSummary,
  }
}
