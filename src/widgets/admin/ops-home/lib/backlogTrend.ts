/** 외부 등록 대기가 어디로 가는지 — 판정 상자의 색과 문장을 정한다 */
export type BacklogTrend = {
  status: 'rising' | 'falling' | 'steady' | 'measuring'
  /** 큰 숫자 옆 한 줄 — '분당 +120건 늘어나는 중' */
  headline: string
  /** 그 아래 설명 */
  hint: string
}

/** 분당 1건보다 덜 움직이면 같은 속도로 처리되는 것으로 본다 */
const STEADY_PER_MINUTE = 1

const duration = (minutes: number) =>
  minutes < 60
    ? `${minutes}분`
    : `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`

/**
 * 대기 건수와 분당 변화로 판정한다. 늘면 경고(입장 속도를 줄이라고), 줄면 지금 속도로 다
 * 풀리기까지 걸리는 시간을 말한다.
 * @param perMinute 분당 변화(늘면 +). 표본이 모자라면 null
 */
export function backlogTrend({
  backlog,
  perMinute,
}: {
  backlog: number
  perMinute: number | null
}): BacklogTrend {
  if (perMinute === null) {
    return {
      status: 'measuring',
      headline: '추세를 재는 중',
      hint: '잠시 뒤 늘고 있는지 줄고 있는지 알려 드려요.',
    }
  }
  const step = Math.round(Math.abs(perMinute)).toLocaleString('ko-KR')
  if (perMinute >= STEADY_PER_MINUTE) {
    return {
      status: 'rising',
      headline: `분당 +${step}건 늘어나는 중`,
      hint: '외부 예약 시스템이 접수 속도를 못 따라가요. 계속 늘면 입장 속도를 줄이세요.',
    }
  }
  if (perMinute <= -STEADY_PER_MINUTE && backlog > 0) {
    const minutes = Math.max(1, Math.ceil(backlog / Math.abs(perMinute)))
    return {
      status: 'falling',
      headline: `분당 −${step}건 · 약 ${duration(minutes)} 뒤 해소`,
      hint: '외부 등록이 접수보다 빨라 대기가 줄고 있어요.',
    }
  }
  return {
    status: 'steady',
    headline: backlog > 0 ? '들어오는 만큼 처리 중' : '대기 없음',
    hint:
      backlog > 0
        ? '외부 등록이 접수 속도를 따라가고 있어요.'
        : '접수되는 대로 바로 외부 등록되고 있어요.',
  }
}
