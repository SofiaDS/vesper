const PIN_KEY     = 'vesper_pin'
const SESSION_KEY = 'vesper_unlocked'

export function hasPin(): boolean {
  return Boolean(localStorage.getItem(PIN_KEY))
}

export function setPin(pin: string): void {
  localStorage.setItem(PIN_KEY, pin)
}

export function verifyPin(pin: string): boolean {
  return localStorage.getItem(PIN_KEY) === pin
}

export function removePin(): void {
  localStorage.removeItem(PIN_KEY)
}

export function isUnlocked(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

export function markUnlocked(): void {
  sessionStorage.setItem(SESSION_KEY, '1')
}

export function lock(): void {
  sessionStorage.removeItem(SESSION_KEY)
}
