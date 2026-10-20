import { describe, expect, it } from 'vitest'

import { getPreorderSchedule, isModelOpen } from './preorderSchedule'

const preorder = {
  opensAt: '2026-10-20',
  openTime: '09:00',
  closesAt: '2026-10-20',
  closeTime: '23:59',
}
// 로컬 시각 — 계산도 로컬 기준이다.
const at = (day: number, hour: number, minute = 0) =>
  new Date(2026, 9, day, hour, minute)

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

  it('마감 시각이 지나면 그날이어도 마감', () => {
    expect(getPreorderSchedule(preorder, at(20, 23, 59))).toEqual({
      status: 'done',
      ddayLabel: '마감',
    })
  })
})

describe('isModelOpen', () => {
  it('모델 오픈 시각이 있으면 그 시각부터, 없으면 홍보 오픈부터', () => {
    const late = { opensAt: '2026-10-20', openTime: '09:30' }
    expect(isModelOpen(preorder, late, at(20, 9, 10))).toBe(false)
    expect(isModelOpen(preorder, late, at(20, 9, 30))).toBe(true)
    expect(isModelOpen(preorder, {}, at(20, 9))).toBe(true)
  })
})
