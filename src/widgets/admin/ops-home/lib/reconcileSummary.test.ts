import { describe, expect, it } from 'vitest'

import { reconcileSummary } from './reconcileSummary'

const NOW = Date.parse('2026-10-26T12:00:00Z')
const HOUR = 60 * 60 * 1000

type Run = NonNullable<Parameters<typeof reconcileSummary>[0]>[number]

const run = (over: Partial<Run> = {}): Run => ({
  status: 'COMPLETED',
  verdict: 'MISMATCHED',
  productId: null,
  finishedAt: new Date(NOW - 3 * HOUR).toISOString(),
  findingCount: 7,
  findingCountsByProduct: [
    { productId: 'iphone', count: 5 },
    { productId: 'galaxy', count: 2 },
  ],
  ...over,
})

describe('reconcileSummary', () => {
  it('못 받았으면 null', () => {
    expect(reconcileSummary(undefined, null, NOW)).toEqual({ value: null })
  })

  it('전체는 가장 최근 끝난 검사의 불일치 건수와 검사 시각', () => {
    expect(reconcileSummary([run()], null, NOW)).toEqual({
      value: 7,
      caption: '3시간 전 검사',
    })
  })

  it('사전예약을 고르면 전체 검사의 그 상품 몫, 없으면 0', () => {
    expect(reconcileSummary([run()], 'galaxy', NOW).value).toBe(2)
    expect(reconcileSummary([run()], 'pixel', NOW).value).toBe(0)
  })

  it('다른 상품만 검사한 결과는 건너뛴다', () => {
    const runs = [
      run({ productId: 'galaxy', findingCount: 1, findingCountsByProduct: [] }),
      run(),
    ]
    expect(reconcileSummary(runs, null, NOW).value).toBe(7)
    expect(reconcileSummary(runs, 'galaxy', NOW).value).toBe(1)
  })

  it('검사 중이면 지난 결과를 두고 함께 알린다', () => {
    const runs = [
      run({ status: 'RUNNING', verdict: null, finishedAt: null }),
      run(),
    ]
    expect(reconcileSummary(runs, null, NOW).caption).toBe(
      '3시간 전 검사 · 새 검사 중',
    )
    expect(reconcileSummary([runs[0]], null, NOW)).toEqual({
      value: null,
      emptyText: '검사 중',
    })
  })

  it('실패한 검사는 숫자 대신 판정 불가', () => {
    const summary = reconcileSummary(
      [run({ status: 'FAILED', verdict: 'UNDETERMINED' })],
      null,
      NOW,
    )
    expect(summary.value).toBeNull()
    expect(summary.emptyText).toBe('판정 불가')
  })

  it('검사 기록이 없으면 그렇게 말한다', () => {
    expect(reconcileSummary([], null, NOW).emptyText).toBe('검사 기록 없음')
  })
})
