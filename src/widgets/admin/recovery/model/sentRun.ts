/**
 * 마지막으로 다시 보낸 기록. 화면이 아니라 모듈에 둬서 다른 관리자 화면에 다녀와도 회복
 * 확인(보낸 시각·보낼 때 실패 수)이 이어진다. 새로 고치면 사라진다.
 */
export type SentRun = {
  at: number
  targetCount: number
  skippedCount: number
  estimatedSeconds: number
  /** 어느 원인이든 1000건을 꽉 채웠으면 남은 실패가 있을 수 있다 */
  capped: boolean
  /** 보낼 때의 실패 수 — 'all'은 전체, 나머지는 사전예약(상품) id */
  failuresAtSend: Readonly<Record<string, number>>
}

let current: SentRun | null = null
const listeners = new Set<() => void>()

export const sentRunStore = {
  get: () => current,
  set(next: SentRun) {
    current = next
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
