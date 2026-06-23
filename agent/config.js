import os from 'node:os'
import path from 'node:path'
import { loadProjectEnv } from './loadEnv.js'

loadProjectEnv()

function getRequiredEnv(name) {
  const value = String(process.env[name] ?? '').trim()

  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`)
  }

  return value
}

function parseNumber(value, fallback) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function parseCapabilities(value) {
  if (!value) {
    return ['session-persisted', 'validation-only', 'sample-worker']
  }

  const capabilities = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  return capabilities.length > 0
    ? capabilities
    : ['session-persisted', 'validation-only', 'sample-worker']
}

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback
  }

  const normalized = String(value).trim().toLowerCase()

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false
  }

  return fallback
}

function sanitizeAgentId(value) {
  return value.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '')
}

const defaultAgentId = `sample-agent-${sanitizeAgentId(os.hostname())}`
const projectRoot = process.cwd()

export const agentConfig = {
  agentId: String(process.env.AGENT_ID ?? '').trim() || defaultAgentId,
  capabilities: parseCapabilities(process.env.AGENT_CAPABILITIES),
  executionMode:
    String(process.env.AGENT_EXECUTION_MODE ?? 'mock').trim().toLowerCase() || 'mock',
  heartbeatStatus: String(process.env.AGENT_HEARTBEAT_STATUS ?? 'online').trim(),
  hostname: os.hostname(),
  label: String(process.env.AGENT_LABEL ?? '').trim() || 'Worker de exemplo',
  loginTimeoutMs: parseNumber(process.env.AGENT_LOGIN_TIMEOUT_MS, 45000),
  manualCaptchaWaitMs: parseNumber(process.env.AGENT_MANUAL_CAPTCHA_WAIT_MS, 120000),
  navigationTimeoutMs: parseNumber(process.env.AGENT_NAVIGATION_TIMEOUT_MS, 45000),
  pollIntervalMs: parseNumber(process.env.AGENT_POLL_INTERVAL_MS, 15000),
  queueMode: String(process.env.AGENT_QUEUE_MODE ?? 'single').trim() || 'single',
  profileRootDir:
    String(process.env.AGENT_PROFILE_ROOT_DIR ?? '').trim() ||
    path.join(projectRoot, 'agent', '.sessions'),
  serverUrl: trimTrailingSlash(getRequiredEnv('AGENT_SERVER_URL')),
  sharedSecret: getRequiredEnv('AGENT_SHARED_SECRET'),
  targetLoginUrl:
    trimTrailingSlash(
      String(process.env.AGENT_TARGET_LOGIN_URL ?? 'https://www.zenquantai.com/#/pages/login/login'),
    ) || 'https://www.zenquantai.com/#/pages/login/login',
  targetTradeUrl:
    trimTrailingSlash(
      String(
        process.env.AGENT_TARGET_TRADE_URL ??
          'https://www.zenquantai.com/#/pages/UITransaction/trade',
      ),
    ) || 'https://www.zenquantai.com/#/pages/UITransaction/trade',
  useHeadlessBrowser: parseBoolean(process.env.AGENT_HEADLESS, false),
  simulatedSessionStatus:
    String(process.env.AGENT_SIMULATED_SESSION_STATUS ?? 'connected').trim() ||
    'connected',
  simulatedValidationStatus:
    String(process.env.AGENT_SIMULATED_VALIDATION_STATUS ?? 'success').trim() ||
    'success',
  validationDelayMs: parseNumber(process.env.AGENT_VALIDATION_DELAY_MS, 3000),
  version: String(process.env.AGENT_VERSION ?? '').trim() || 'example-worker-1.0.0',
}

export function redactAgentConfig(config) {
  return {
    ...config,
    sharedSecret: '***',
  }
}
