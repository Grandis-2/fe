/** 대기열이 어디로 가는지 — 판정 상자의 색과 문장을 정한다 */
export type QueueTrend = {
  status: 'rising' | 'falling' | 'steady' | 'measuring'
  /** 큰 숫자 옆 한 줄 — '분당 −1,200명 · 약 8분 뒤 비어요' */
  headline: string
  /** 그 아래 설명 */
  hint: string
}

/** 분당 1명보다 덜 움직이면 줄 길이가 그대로인 것으로 본다 */
const STEADY_PER_MINUTE = 1

const duration = (minutes: number) =>
  minutes < 60
    ? `${minutes}분`
    : `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`

/**
 * 대기 인원과 분당 변화로 판정한다. 줄면 지금 속도로 줄이 다 빠지기까지 걸리는 시간을 말하고,
 * 늘면 들어오는 사람이 입장보다 많다고 알린다(입장 속도를 올릴지 볼 때다).
 * @param perMinute 분당 변화(늘면 +). 표본이 모자라면 null
 */
export function queueTrend({
  waiting,
  perMinute,
}: {
  waiting: number
  perMinute: number | null
}): QueueTrend {
  if (perMinute === null) {
    return {
      status: 'measuring',
      headline: '추세를 재는 중',
      hint: '잠시 뒤 줄이 늘고 있는지 줄고 있는지 알려 드려요.',
    }
  }
  const step = Math.round(Math.abs(perMinute)).toLocaleString('ko-KR')
  if (perMinute >= STEADY_PER_MINUTE) {
    return {
      status: 'rising',
      headline: `분당 +${step}명 늘어나는 중`,
      hint: '들어오는 사람이 입장보다 많아요. 외부 등록에 여유가 있으면 입장 속도를 올리세요.',
    }
  }
  if (perMinute <= -STEADY_PER_MINUTE && waiting > 0) {
    const minutes = Math.max(1, Math.ceil(waiting / Math.abs(perMinute)))
    return {
      status: 'falling',
      headline: `분당 −${step}명 · 약 ${duration(minutes)} 뒤 비어요`,
      hint: '입장이 들어오는 속도보다 빨라 줄이 줄고 있어요.',
    }
  }
  return {
    status: 'steady',
    headline: waiting > 0 ? '들어오는 만큼 입장 중' : '대기 없음',
    hint:
      waiting > 0 ? '줄 길이가 그대로예요.' : '오는 대로 바로 입장하고 있어요.',
  }
}
