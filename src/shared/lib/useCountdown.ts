import { useEffect, useState } from 'react'

const getRemainingMs = (target: Date) =>
  Math.max(target.getTime() - Date.now(), 0)

export function useCountdown(target: Date) {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(target))

  useEffect(() => {
    const id = setInterval(() => setRemainingMs(getRemainingMs(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  const totalSeconds = Math.floor(remainingMs / 1000)

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
    seconds: String(totalSeconds % 60).padStart(2, '0'),
    isOver: remainingMs === 0,
  }
}
