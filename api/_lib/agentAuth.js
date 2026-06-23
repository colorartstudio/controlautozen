import crypto from 'node:crypto'

function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`)
  }

  return value
}

function readHeader(request, name) {
  return String(request.headers?.[name] ?? '').trim()
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer)
}

export function requireAgentRequest(request) {
  const secret = readHeader(request, 'x-agent-secret')
  const agentId = readHeader(request, 'x-agent-id')

  if (!agentId) {
    return {
      error: {
        status: 401,
        message: 'Agent ID ausente.',
      },
    }
  }

  const expectedSecret = getRequiredEnv('AGENT_SHARED_SECRET')

  if (!secret || !safeEqual(secret, expectedSecret)) {
    return {
      error: {
        status: 401,
        message: 'Segredo do agente invalido.',
      },
    }
  }

  return {
    agentId,
    hostname: readHeader(request, 'x-agent-hostname'),
    label: readHeader(request, 'x-agent-label') || agentId,
    platform: readHeader(request, 'x-agent-platform'),
    version: readHeader(request, 'x-agent-version'),
  }
}
