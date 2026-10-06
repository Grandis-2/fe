import type { Preorder, PreorderStatus } from '@entities/preorder'

// 'YYYY-MM-DD' 날짜 계산·표기 — 일정표는 '9.26'처럼 짧게 쓴다.
const toDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

const addDays = (date: string, days: number) => {
  const next = toDate(date)
  next.setDate(next.getDate() + days)
  return next
}

const short = (date: Date) =>
  `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, '0')}`
const shortOf = (date: string) => short(toDate(date))
const range = (from: Date, to: Date) => `${short(from)} – ${short(to)}`

export const monthDay = (date: string) => {
  const value = toDate(date)
  return `${value.getMonth() + 1}월 ${value.getDate()}일`
}

// '10:00' → '오전 10시', '14:30' → '오후 2시 30분'
export const formatOpenTime = (time: string) => {
  const [hour, minute] = time.split(':').map(Number)
  const period = hour < 12 ? '오전' : '오후'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${period} ${hour12}시${minute ? ` ${minute}분` : ''}`
}

export type ScheduleStep = { label: string; date: string; isCurrent: boolean }

// 진행 중이면 사전예약, 오픈 전이면 알림 신청 단계가 지금 단계다. 마감이면 모두 "완료".
export function getScheduleSteps(
  preorder: Preorder,
  status: PreorderStatus,
): ScheduleStep[] {
  const { opensAt, closesAt, paymentEndsAt, releaseAt } = preorder
  const preorderStep = {
    label: '사전예약',
    date: range(toDate(opensAt), toDate(closesAt)),
  }
  const paymentStep = {
    label: '결제 · 물량 배정',
    date: range(addDays(closesAt, 1), toDate(paymentEndsAt)),
  }
  const releaseStep = { label: '출시 · 배송', date: shortOf(releaseAt) }

  if (status === 'soon') {
    return [
      {
        label: '오픈 알림 신청',
        date: `~ ${short(addDays(opensAt, -1))}`,
        isCurrent: true,
      },
      { ...preorderStep, isCurrent: false },
      { ...releaseStep, isCurrent: false },
    ]
  }
  const steps = [preorderStep, paymentStep, releaseStep]
  if (status === 'done') {
    return steps.map((step) => ({
      ...step,
      label: `${step.label} · 완료`,
      isCurrent: false,
    }))
  }
  return steps.map((step, index) => ({ ...step, isCurrent: index === 0 }))
}

export function getNotices(preorder: Preorder, status: PreorderStatus) {
  if (status === 'done') {
    return [
      '사전예약 혜택은 예약 기간 내 결제 완료 주문에만 적용되었어요.',
      '일반 구매 시 사전예약 혜택은 제공되지 않아요.',
      '사전예약 주문의 배송 조회는 마이페이지 > 주문 내역에서 할 수 있어요.',
    ]
  }
  const common = [
    '사전예약 기간 내 결제를 완료한 주문에 한해 혜택이 제공돼요.',
    '준비된 수량이 소진되면 예약이 조기 마감될 수 있어요.',
  ]
  return status === 'soon'
    ? [
        ...common,
        `오픈 알림은 ${monthDay(preorder.opensAt)} ${formatOpenTime(preorder.openTime)}에 앱 푸시로 발송돼요.`,
      ]
    : [...common, '사은품은 출시일 이후 제품과 별도로 순차 발송돼요.']
}
