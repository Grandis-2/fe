import { describe, expect, it } from 'vitest'

import { promotionDue, promotionProductProblem } from './types'

// 2026-10-22 14:00 로컬
const now = new Date(2026, 9, 22, 14).getTime()

describe('promotionDue', () => {
  it('진행 중이면 끝 날까지 남은 날, 끝 날 당일은 오늘까지', () => {
    const ongoing = { status: 'ONGOING' as const, startDate: '2026-10-20' }
    expect(promotionDue({ ...ongoing, endDate: '2026-10-31' }, now)).toEqual({
      label: '9일 남음',
      urgent: false,
    })
    expect(promotionDue({ ...ongoing, endDate: '2026-10-25' }, now)).toEqual({
      label: '3일 남음',
      urgent: true,
    })
    expect(promotionDue({ ...ongoing, endDate: '2026-10-22' }, now).label).toBe(
      '오늘까지',
    )
  })

  it('시작 전이면 시작까지 남은 날', () => {
    const scheduled = { status: 'SCHEDULED' as const, endDate: '2026-11-10' }
    expect(
      promotionDue({ ...scheduled, startDate: '2026-10-25' }, now).label,
    ).toBe('3일 뒤 시작')
    expect(
      promotionDue({ ...scheduled, startDate: '2026-10-23' }, now).label,
    ).toBe('내일 시작')
  })

  it('끝났으면 종료', () => {
    expect(
      promotionDue(
        { status: 'ENDED', startDate: '2026-07-01', endDate: '2026-07-20' },
        now,
      ).label,
    ).toBe('종료')
  })
})

describe('promotionProductProblem', () => {
  const product = (saleMode: 'PREORDER' | 'IN_STOCK') => ({
    productId: saleMode,
    title: saleMode,
    saleMode,
  })

  it('남은 상품이 없거나 모두 일반 상품이면 알린다', () => {
    expect(promotionProductProblem({ status: 'ONGOING', products: [] })).toBe(
      '남은 연결 상품이 없어요 — 상품이 지워져 빠졌어요',
    )
    expect(
      promotionProductProblem({
        status: 'SCHEDULED',
        products: [product('IN_STOCK')],
      }),
    ).toBe('연결 상품이 모두 일반 상품으로 바뀌었어요')
  })

  it('사전예약 상품이 하나라도 있거나 끝났으면 문제 없음', () => {
    expect(
      promotionProductProblem({
        status: 'ONGOING',
        products: [product('IN_STOCK'), product('PREORDER')],
      }),
    ).toBeNull()
    expect(
      promotionProductProblem({ status: 'ENDED', products: [] }),
    ).toBeNull()
  })
})
