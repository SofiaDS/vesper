import { useState } from 'react'
import { hasPin, isUnlocked, markUnlocked, lock as clearSession } from '../lib/pin'

export function usePinLock() {
  const [locked, setLocked] = useState(() => hasPin() && !isUnlocked())

  function unlock() {
    markUnlocked()
    setLocked(false)
  }

  function lock() {
    clearSession()
    setLocked(true)
  }

  return { locked, unlock, lock }
}
