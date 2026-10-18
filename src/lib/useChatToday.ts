import { useEffect, useState } from 'react'
import { argentinaDay } from './chatDates'

export function useChatToday() {
  const [today, setToday] = useState(() => argentinaDay())
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const sync = () => {
      clearTimeout(timer)
      const now = new Date(), day = argentinaDay(now)
      setToday(day)
      const next = new Date(`${day}T00:00:00-03:00`)
      next.setUTCDate(next.getUTCDate() + 1)
      timer = setTimeout(sync, next.getTime() - now.getTime() + 50)
    }
    sync()
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    return () => { clearTimeout(timer); window.removeEventListener('focus', sync); document.removeEventListener('visibilitychange', sync) }
  }, [])
  return today
}

