import { delay } from './delay'

type PollOptions = {
  /** 함수면 매 차례 다시 읽는다(실패가 이어질 때 간격을 늘리는 쪽이 쓴다) */
  intervalMs: number | (() => number)
  /** 첫 조회부터가 아니라 부른 때부터 잰다. 횟수가 아니라 시각이라 응답이 느려도 늘어나지 않는다 */
  timeoutMs: number
  /** 끊기면 다음 차례에 멈춘다 */
  signal?: AbortSignal
}

/**
 * intervalMs마다 check를 부르다가 null이 아닌 값을 주면 그 값을 돌려준다. 시간이 다 되거나
 * 끊기면 null이다. 응답이 오고 나서 다음 간격을 재서 요청이 겹치지 않는다.
 * check가 던지면 그대로 던진다 — 어떤 실패를 '아직 모름'(null)으로 볼지는 check가 정한다.
 */
export async function pollUntil<T>(
  check: () => Promise<T | null>,
  { intervalMs, timeoutMs, signal }: PollOptions,
): Promise<T | null> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await delay(typeof intervalMs === 'function' ? intervalMs() : intervalMs)
    if (signal?.aborted) return null
    const result = await check()
    if (result !== null) return result
  }
  return null
}
