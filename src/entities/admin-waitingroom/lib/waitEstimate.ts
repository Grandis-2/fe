import type { WaitingroomProductStatus } from '../model/types'

/** 기다릴 시간(초)을 읽기 좋게 — '45초', '약 3분', '약 2시간 0분' */
const formatWait = (seconds: number) => {
  if (seconds < 60) return `${seconds}초`
  if (seconds < 3600) return `약 ${Math.round(seconds / 60)}분`
  return `약 ${Math.floor(seconds / 3600)}시간 ${Math.round((seconds % 3600) / 60)}분`
}

/**
 * 맨 뒤에 선 사람이 들어가기까지 걸릴 시간 — 대기 인원 ÷ 초당 입장. 이탈·새로 서는 사람은
 * 빼고 지금 속도가 그대로라고 본 어림값이다. 줄이 없으면 null, 입장을 멈췄으면(0) 끝이 없다.
 */
export function waitEstimate(waiting: number, perSecond: number | null) {
  if (waiting <= 0) return null
  if (perSecond === null || perSecond <= 0) return '입장 멈춤'
  return formatWait(Math.ceil(waiting / perSecond))
}

/**
 * 사전예약 하나의 맨 뒤 예상 대기 — 서버가 센 값(estimatedWaitSeconds)을 쓴다. 서버 값이
 * 없으면(입장 멈춤·접수 전) 지금 배분된 속도로 어림한다.
 */
export const productWaitEstimate = (
  product: Pick<
    WaitingroomProductStatus,
    'waiting' | 'credit' | 'estimatedWaitSeconds'
  >,
) =>
  product.waiting > 0 && product.estimatedWaitSeconds !== null
    ? formatWait(product.estimatedWaitSeconds)
    : waitEstimate(product.waiting, product.credit)
