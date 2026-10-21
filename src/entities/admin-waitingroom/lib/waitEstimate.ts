/**
 * 맨 뒤에 선 사람이 들어가기까지 걸릴 시간 — 대기 인원 ÷ 초당 입장. 이탈·새로 서는 사람은
 * 빼고 지금 속도가 그대로라고 본 어림값이다. 줄이 없으면 null, 입장을 멈췄으면(0) 끝이 없다.
 */
export function waitEstimate(waiting: number, perSecond: number | null) {
  if (waiting <= 0) return null
  if (perSecond === null || perSecond <= 0) return '입장 멈춤'
  const seconds = Math.ceil(waiting / perSecond)
  if (seconds < 60) return `${seconds}초`
  if (seconds < 3600) return `약 ${Math.round(seconds / 60)}분`
  return `약 ${Math.floor(seconds / 3600)}시간 ${Math.round((seconds % 3600) / 60)}분`
}
