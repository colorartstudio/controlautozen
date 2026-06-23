function buildHeaders(config) {
  return {
    'content-type': 'application/json',
    'x-agent-hostname': config.hostname,
    'x-agent-id': config.agentId,
    'x-agent-label': config.label,
    'x-agent-platform': config.hostname ? `${process.platform}-${process.arch}` : '',
    'x-agent-secret': config.sharedSecret,
    'x-agent-version': config.version,
  }
}

async function parseResponse(response) {
  const contentType = String(response.headers.get('content-type') ?? '')

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()

  return text
    ? {
        message: text,
      }
    : {}
}

async function postJson(config, route, payload) {
  const response = await fetch(`${config.serverUrl}${route}`, {
    body: JSON.stringify(payload ?? {}),
    headers: buildHeaders(config),
    method: 'POST',
  })

  const data = await parseResponse(response)

  if (!response.ok) {
    throw new Error(
      `Falha ${response.status} em ${route}: ${data.message ?? 'erro desconhecido.'}`,
    )
  }

  return data
}

export function createAgentHttpClient(config) {
  return {
    claimCommand() {
      return postJson(config, '/api/agent/claim-command', {})
    },
    claimTask() {
      return postJson(config, '/api/agent/claim-task', {})
    },
    heartbeat(payload = {}) {
      return postJson(config, '/api/agent/heartbeat', payload)
    },
    syncState(payload) {
      return postJson(config, '/api/agent/sync-state', payload)
    },
  }
}
