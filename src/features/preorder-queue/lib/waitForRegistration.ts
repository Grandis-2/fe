import { getReservation } from '@entities/preorder'

// 접수 뒤 외부 등록을 1초 간격으로 5번(최대 5초)만 묻는다.
const POLL_MS = 1_000
const POLL_COUNT = 5

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// 그 안에 등록(REGISTERED)되면 true — 바로 결제로 보낸다. 아니면 false — 예약 접수 화면이 이어서 기다린다.
// 조회 실패는 아직 모르는 것으로 보고 다음 차례에 다시 묻는다(못 받아도 접수는 끝났다).
export async function waitForRegistration(
  preorderId: string,
  signal: AbortSignal,
) {
  for (let count = 0; count < POLL_COUNT; count += 1) {
    await delay(POLL_MS)
    if (signal.aborted) return false
    const reservation = await getReservation(preorderId, signal).catch(
      () => null,
    )
    if (reservation?.status === 'REGISTERED') return true
  }
  return false
}
