import { useEffect, useState } from 'react'

// 남은 시간·상태처럼 시각에 따라 바뀌는 화면 — intervalMs마다 현재 시각을 다시 읽어 다시 그린다.
// 렌더마다 new Date()를 읽으면 화면을 열어 둔 채로는 경계(오픈·마감)를 지나도 그대로 멈춰 있다.
export function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
