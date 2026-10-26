import { getReservation } from '@entities/preorder'
import { pollUntil } from '@shared/lib/pollUntil'

// 접수 뒤 외부 등록을 1초 간격으로 최대 5초만 묻는다.
const POLL_MS = 1_000
const WAIT_MS = 5_000

// 그 안에 등록(REGISTERED)되면 true — 바로 결제로 보낸다. 아니면 false — 예약 접수 화면이 이어서 기다린다.
// 조회 실패는 아직 모르는 것으로 보고 다음 차례에 다시 묻는다(못 받아도 접수는 끝났다).
// 5초가 되면 진행 중인 조회도 끊는다 — 조회가 늦어도 5초를 넘겨 기다리거나, 늦게 온 응답으로 결제에 보내지 않는다.
// ponytail: AbortSignal.any·timeout 대신 직접 묶는다 — 빌드 대상(Safari 16)에 any가 없다.
export const waitForRegistration = async (
  preorderId: string,
  signal: AbortSignal,
) => {
  const bounded = new AbortController()
  const stop = () => bounded.abort()
  const timer = setTimeout(stop, WAIT_MS)
  signal.addEventListener('abort', stop, { once: true })
  try {
    return (
      (await pollUntil(
        () =>
          getReservation(preorderId, bounded.signal)
            .then(({ status }) => status === 'REGISTERED' || null)
            .catch(() => null),
        { intervalMs: POLL_MS, timeoutMs: WAIT_MS, signal: bounded.signal },
      )) ?? false
    )
  } finally {
    clearTimeout(timer)
    signal.removeEventListener('abort', stop)
  }
}
