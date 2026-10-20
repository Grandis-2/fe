import { describe, expect, it } from 'vitest'

import {
  formatPreorderPeriod,
  getPreorderSchedule,
  isModelReservable,
} from './preorderSchedule'

const preorder = {
  opensAt: '2026-10-20',
  openTime: '09:00',
  closesAt: '2026-10-20',
  closeTime: '23:59',
}
// 한국 시각 — 일정은 브라우저 시간대와 상관없이 한국 시간으로 센다(TZ를 바꿔 돌려도 같아야 한다).
const pad = (n: number) => String(n).padStart(2, '0')
const at = (day: number, hour: number, minute = 0, second = 0) =>
  new Date(
    `2026-10-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}+09:00`,
  )

describe('getPreorderSchedule', () => {
  it('오픈 날 전이면 D-N', () => {
    expect(getPreorderSchedule(preorder, at(17, 23))).toEqual({
      status: 'soon',
      ddayLabel: 'D-3',
    })
  })

  it('오픈 날이어도 1시간 전까지는 알림을 받는 오픈 예정', () => {
    expect(getPreorderSchedule(preorder, at(20, 5, 30))).toEqual({
      status: 'soon',
      ddayLabel: '3시간 후 시작',
    })
    expect(getPreorderSchedule(preorder, at(20, 7, 59)).status).toBe('soon')
  })

  it('오픈 1시간 전부터는 오늘 오픈 — 남은 분 후 시작', () => {
    expect(getPreorderSchedule(preorder, at(20, 8))).toEqual({
      status: 'live',
      ddayLabel: '1시간 후 시작',
    })
    expect(getPreorderSchedule(preorder, at(20, 8, 35)).ddayLabel).toBe(
      '25분 후 시작',
    )
  })

  it('열린 뒤엔 남은 시간 후 종료', () => {
    expect(getPreorderSchedule(preorder, at(20, 9))).toEqual({
      status: 'live',
      ddayLabel: '14시간 후 종료',
    })
  })

  it('마감이 초까지 오면 그 초까지 열려 있다', () => {
    const closesAtEnd = { ...preorder, closeTime: '23:59:59' }
    expect(getPreorderSchedule(closesAtEnd, at(20, 23, 59, 30)).status).toBe(
      'live',
    )
    expect(getPreorderSchedule(closesAtEnd, at(20, 23, 59, 59)).status).toBe(
      'done',
    )
  })

  it('한국 자정을 넘기면 날짜가 바뀐다 — 한국 10.19 23:30은 오픈 전날(D-1)', () => {
    expect(getPreorderSchedule(preorder, at(19, 23, 30)).ddayLabel).toBe('D-1')
    // 한국 10.20 00:30은 UTC로 아직 10.19다 — 그래도 오픈 당일로 센다.
    expect(getPreorderSchedule(preorder, at(20, 0, 30)).ddayLabel).toBe(
      '8시간 후 시작',
    )
  })

  it('마감 시각이 지나면 그날이어도 마감', () => {
    expect(getPreorderSchedule(preorder, at(20, 23, 59))).toEqual({
      status: 'done',
      ddayLabel: '마감',
    })
  })
})

describe('isModelReservable', () => {
  it('모델 오픈 시각이 있으면 그 시각부터, 없으면 홍보 오픈부터', () => {
    const late = { opensAt: '2026-10-20', openTime: '09:30' }
    expect(isModelReservable(preorder, late, at(20, 9, 10))).toBe(false)
    expect(isModelReservable(preorder, late, at(20, 9, 30))).toBe(true)
    expect(isModelReservable(preorder, {}, at(20, 9))).toBe(true)
  })

  it('홍보가 열려 있어도 먼저 마감한 모델은 막는다', () => {
    const early = { closesAt: '2026-10-20', closeTime: '12:00:00' }
    expect(isModelReservable(preorder, early, at(20, 11, 59))).toBe(true)
    expect(isModelReservable(preorder, early, at(20, 12))).toBe(false)
    expect(isModelReservable(preorder, {}, at(20, 12))).toBe(true)
  })
})

describe('formatPreorderPeriod', () => {
  it('같은 날 마감이면 날짜를 한 번만, 다른 날이면 마감 날짜도 쓴다', () => {
    expect(formatPreorderPeriod({ ...preorder, closeTime: '23:59:59' })).toBe(
      '2026.10.20 09:00 ~ 23:59',
    )
    expect(
      formatPreorderPeriod({
        ...preorder,
        openTime: '14:01',
        closesAt: '2026-10-21',
        closeTime: '02:31:00',
      }),
    ).toBe('2026.10.20 14:01 ~ 2026.10.21 02:31')
  })
})
