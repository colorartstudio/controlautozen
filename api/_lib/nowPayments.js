import { createHmac } from 'crypto'

const DEFAULT_API_URL = 'https://api.nowpayments.io/v1'

function getRequiredEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`)
  }

  return value
}

function getNowPaymentsBaseUrl() {
  return process.env.NOWPAYMENTS_API_URL ?? DEFAULT_API_URL
}

function getDefaultPriceAmount() {
  return Number(process.env.NOWPAYMENTS_PRICE_AMOUNT ?? 20)
}

function getDefaultPriceCurrency() {
  return String(process.env.NOWPAYMENTS_PRICE_CURRENCY ?? 'brl').trim().toLowerCase()
}

function getDefaultPayCurrency() {
  return String(process.env.NOWPAYMENTS_PAY_CURRENCY ?? 'usdtbsc').trim().toLowerCase()
}

async function requestNowPayments(path, options = {}) {
  const response = await fetch(`${getNowPaymentsBaseUrl()}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': getRequiredEnv('NOWPAYMENTS_API_KEY'),
      ...(options.headers ?? {}),
    },
  })

  let data = {}

  try {
    data = await response.json()
  } catch {
    data = {}
  }

  if (!response.ok) {
    throw new Error(data.message ?? 'Falha ao comunicar com a NOWPayments.')
  }

  return data
}

export function buildNowPaymentsPayload(overrides = {}) {
  return {
    price_amount: getDefaultPriceAmount(),
    price_currency: getDefaultPriceCurrency(),
    pay_currency: getDefaultPayCurrency(),
    ...overrides,
  }
}

export async function createNowPayment(payload) {
  return requestNowPayments('/payment', {
    body: JSON.stringify(payload),
    method: 'POST',
  })
}

export async function getNowPaymentStatus(paymentId) {
  return requestNowPayments(`/payment/${paymentId}`, {
    method: 'GET',
  })
}

export function verifyNowPaymentsSignature(payload, signature) {
  const serialized = JSON.stringify(payload, Object.keys(payload).sort())
  const digest = createHmac('sha512', getRequiredEnv('NOWPAYMENTS_IPN_SECRET'))
    .update(serialized)
    .digest('hex')

  return digest === String(signature ?? '').trim()
}
