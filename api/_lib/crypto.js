import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

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

export function decryptText(value) {
  const payload = Buffer.from(String(value ?? ''), 'base64')

  if (payload.length <= 28) {
    throw new Error('Payload criptografado invalido.')
  }

  const iv = payload.subarray(0, 12)
  const tag = payload.subarray(12, 28)
  const encrypted = payload.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', getSecretKey(), iv)

  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
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
