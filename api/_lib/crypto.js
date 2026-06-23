import { createCipheriv, createHash, randomBytes } from 'crypto'

function getSecretKey() {
  const secret = process.env.ACCOUNT_CREDENTIALS_SECRET

  if (!secret) {
    throw new Error(
      'Variavel de ambiente ausente: ACCOUNT_CREDENTIALS_SECRET',
    )
  }

  return createHash('sha256').update(secret).digest()
}

export function encryptText(value) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getSecretKey(), iv)
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function maskPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '')

  if (!digits) {
    return ''
  }

  if (digits.length <= 4) {
    return `***${digits}`
  }

  return `${digits.slice(0, 3)}***${digits.slice(-3)}`
}
