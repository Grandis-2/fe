import { parseDateOnly } from './parseDateOnly'

const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
const weekdayFormatter = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' })

/** '2026년 9월 20일 (일)' 형태. 배송일은 미정을 허용한다 */
export const formatDeliveryDate = (date: string | null) => {
  if (!date) return '미정'

  const parsed = parseDateOnly(date)
  if (!parsed) return '미정'
  return `${dateFormatter.format(parsed)} (${weekdayFormatter.format(parsed)})`
}
