export function formatPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 11)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function isPhoneValid(value) {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits.length === 0 || digits.length >= 10
}

export function normalizePlate(value) {
  return String(value ?? '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 7)
    .toUpperCase()
}

export function isEmailValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? '').trim())
}
