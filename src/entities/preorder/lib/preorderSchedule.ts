import type { Preorder, PreorderModel } from '../model/preorder'

// live: 오늘 오픈, soon: 오픈 예정, done: 마감. 서버가 따로 내려주지 않아 날짜·시각으로 정한다.
export type PreorderStatus = 'live' | 'soon' | 'done'

export type PreorderSchedule = {
  status: PreorderStatus
  ddayLabel: string
}

const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const MINUTE_MS = 60 * 1000

const KST_OFFSET_MS = 9 * HOUR_MS

// 일정 문자열은 모두 한국 시간이다(toPreorder) — 브라우저 시간대와 상관없이 같은 순간으로 읽는다.
// 한국은 서머타임이 없어 고정 오프셋(+09:00)이면 된다. 마감은 초까지('HH:mm:ss') 온다.
export const kstInstant = (date: string, time: string) =>
  new Date(`${date}T${time.length === 5 ? `${time}:00` : time}+09:00`)

// 순간 → 한국 시간 'YYYY-MM-DD'·'HH:mm:ss'. toISOString()은 'YYYY-MM-DDTHH:mm:ss.sssZ'다.
export const toKstParts = (instant: Date | string) => {
  const iso = new Date(
    new Date(instant).getTime() + KST_OFFSET_MS,
  ).toISOString()
  return { date: iso.slice(0, 10), time: iso.slice(11, 19) }
}

// 'YYYY-MM-DD'(한국 날짜)까지 남은 날 수 — 오늘(한국 날짜)이면 0, 지났으면 음수. 둘 다 UTC 자정으로 읽어 뺀다.
const daysUntil = (date: string, now: Date) =>
  Math.round(
    (Date.parse(`${date}T00:00:00Z`) -
      Date.parse(`${toKstParts(now).date}T00:00:00Z`)) /
      DAY_MS,
  )

// 1시간 넘게 남으면 시간(내림), 아니면 분(올림)으로 센다 — '3시간', '25분'.
const timeLeft = (target: Date, now: Date) => {
  const ms = target.getTime() - now.getTime()
  return ms >= HOUR_MS
    ? `${Math.floor(ms / HOUR_MS)}시간`
    : `${Math.ceil(ms / MINUTE_MS)}분`
}

// 오픈 알림은 오픈 1시간 전까지 받는다 — 그 뒤 오픈까지는 '오늘 오픈'으로 두고 예약 버튼만 막는다.
export const getOpenAlertDeadline = ({
  opensAt,
  openTime,
}: Pick<Preorder, 'opensAt' | 'openTime'>) =>
  new Date(kstInstant(opensAt, openTime).getTime() - HOUR_MS)

// 모델마다 예약 시간이 다를 수 있다 — 그 모델의 오픈부터 마감 전까지만 예약할 수 있다.
// 모르는 칸은 홍보 기간(가장 이른 오픈·가장 늦은 마감)으로 센다.
export const isModelReservable = (
  preorder: Pick<Preorder, 'opensAt' | 'openTime' | 'closesAt' | 'closeTime'>,
  model: Pick<PreorderModel, 'opensAt' | 'openTime' | 'closesAt' | 'closeTime'>,
  now = new Date(),
) =>
  now >=
    kstInstant(
      model.opensAt ?? preorder.opensAt,
      model.openTime ?? preorder.openTime,
    ) &&
  now <
    kstInstant(
      model.closesAt ?? preorder.closesAt,
      model.closeTime ?? preorder.closeTime,
    )

// 알림 마감(오픈 1시간 전) 전이면 오픈 예정(다른 날이면 D-N, 그날이면 N시간 후 시작),
// 그때부터 마감 시각 전까지는 오늘 오픈(N분 후 시작/N시간 후 종료), 마감 시각이 지나면 마감이다.
export function getPreorderSchedule(
  {
    opensAt,
    openTime,
    closesAt,
    closeTime,
  }: Pick<Preorder, 'opensAt' | 'openTime' | 'closesAt' | 'closeTime'>,
  now = new Date(),
): PreorderSchedule {
  const closeAt = kstInstant(closesAt, closeTime)
  if (!(now < closeAt)) return { status: 'done', ddayLabel: '마감' }
  const openAt = kstInstant(opensAt, openTime)
  if (now < getOpenAlertDeadline({ opensAt, openTime })) {
    const untilOpen = daysUntil(opensAt, now)
    return {
      status: 'soon',
      ddayLabel:
        untilOpen > 0 ? `D-${untilOpen}` : `${timeLeft(openAt, now)} 후 시작`,
    }
  }
  return now < openAt
    ? { status: 'live', ddayLabel: `${timeLeft(openAt, now)} 후 시작` }
    : { status: 'live', ddayLabel: `${timeLeft(closeAt, now)} 후 종료` }
}

// 'YYYY-MM-DD' → 'YYYY.MM.DD'
export const formatPreorderDate = (date: string) => date.replaceAll('-', '.')

// '2026.10.20 09:00 ~ 23:59' — 마감이 다른 날이면(자정을 넘기거나 여러 날) 마감 날짜도 쓴다:
// '2026.10.20 14:01 ~ 2026.10.21 02:31'. 마감은 초까지 오지만 분까지만 보인다.
export const formatPreorderPeriod = ({
  opensAt,
  openTime,
  closesAt,
  closeTime,
}: Pick<Preorder, 'opensAt' | 'openTime' | 'closesAt' | 'closeTime'>) =>
  `${formatPreorderDate(opensAt)} ${openTime} ~ ${closesAt === opensAt ? '' : `${formatPreorderDate(closesAt)} `}${closeTime.slice(0, 5)}`

// 한 홍보에 묶인 모델끼리 예약 시간이 다를 수 있다 — 모르는 칸은 홍보 기간(가장 이른 오픈·늦은 마감)으로 채운다.
export const formatModelPeriod = (
  preorder: Pick<Preorder, 'opensAt' | 'openTime' | 'closesAt' | 'closeTime'>,
  model: PreorderModel,
) =>
  formatPreorderPeriod({
    opensAt: model.opensAt ?? preorder.opensAt,
    openTime: model.openTime ?? preorder.openTime,
    closesAt: model.closesAt ?? preorder.closesAt,
    closeTime: model.closeTime ?? preorder.closeTime,
  })
