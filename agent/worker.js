import { agentConfig, redactAgentConfig } from './config.js'
import { createAgentHttpClient } from './httpClient.js'
import { runClaimedTask } from './taskRunner.js'

const client = createAgentHttpClient(agentConfig)
let shouldStop = false

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function formatNow() {
  return new Date().toISOString()
}

function log(level, message, details) {
  const prefix = `[${formatNow()}] [agent:${level}]`

  if (details === undefined) {
    console.log(`${prefix} ${message}`)
    return
  }

  console.log(`${prefix} ${message}`, details)
}

function registerShutdownSignals() {
  const stopHandler = (signal) => {
    if (!shouldStop) {
      log('info', `Encerramento solicitado por ${signal}.`)
    }

    shouldStop = true
  }

  process.on('SIGINT', stopHandler)
  process.on('SIGTERM', stopHandler)
}

async function sendHeartbeat(lastError = '') {
  const response = await client.heartbeat({
    capabilities: agentConfig.capabilities,
    lastError,
    queueMode: agentConfig.queueMode,
    sessionStatus: agentConfig.simulatedSessionStatus,
    status: agentConfig.heartbeatStatus,
  })

  log('info', 'Heartbeat sincronizado.', {
    queue: response.queue,
    serverTime: response.serverTime,
  })

  return response
}

async function processClaimedTask(claimResponse) {
  const { externalAccount, task } = claimResponse

  log('info', 'Tarefa reservada pelo agente.', {
    account: externalAccount?.name ?? task.externalAccountName,
    taskId: task.id,
  })

  const result = await runClaimedTask({
    config: agentConfig,
    externalAccount,
    task,
  })

  await client.syncState({
    externalAccountId: externalAccount.id,
    lastError: result.lastError,
    logs: result.logs,
    nextRunAt: result.nextRunAt,
    sessionStatus: result.sessionStatus,
    taskId: task.id,
    validationStatus: result.validationStatus,
    validationSummary: result.validationSummary,
  })

  log('info', 'Sync-state concluido.', {
    nextRunAt: result.nextRunAt,
    taskId: task.id,
    validationStatus: result.validationStatus,
  })
}

async function runCycle() {
  await sendHeartbeat()

  const claimResponse = await client.claimTask()

  if (!claimResponse.claimed) {
    log('info', 'Nenhuma tarefa disponivel para claim.', claimResponse.queue)
    return
  }

  await processClaimedTask(claimResponse)
}

async function startWorker() {
  registerShutdownSignals()

  log('info', 'Worker de exemplo iniciado.', redactAgentConfig(agentConfig))

  while (!shouldStop) {
    try {
      await runCycle()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha desconhecida no worker.'
      log('error', message)

      try {
        await sendHeartbeat(message)
      } catch (heartbeatError) {
        const heartbeatMessage =
          heartbeatError instanceof Error
            ? heartbeatError.message
            : 'Falha ao atualizar heartbeat apos erro.'

        log('error', heartbeatMessage)
      }
    }

    if (shouldStop) {
      break
    }

    await sleep(agentConfig.pollIntervalMs)
  }

  log('info', 'Worker de exemplo finalizado.')
}

startWorker().catch((error) => {
  const message =
    error instanceof Error ? error.message : 'Falha fatal ao iniciar worker de exemplo.'

  log('error', message)
  process.exitCode = 1
})
