import { describe, expect, it } from 'vitest'

import { admissionSignals } from './admissionSignals'

/** 5초 간격 표본 — [접수 누적, 처리 누적, 외부 등록 대기] */
const series = (rows: [number, number, number][]) =>
  rows.map(([received, processed, backlog], index) => ({
    at: index * 5_000,
    value: { received, processed, backlog },
  }))

describe('admissionSignals', () => {
  it('표본이 없거나 하나면 속도를 내지 않는다', () => {
    expect(admissionSignals([]).received).toBeNull()
    const one = admissionSignals(series([[0, 0, 0]]))
    expect(one.received).toBeNull()
    expect(one.backlog).toBe(0)
    expect(one.judged).toBe(false)
  })

  it('30초가 안 되면 속도는 내되 판단은 미룬다', () => {
    const signals = admissionSignals(
      series([
        [0, 0, 5],
        [70, 70, 5],
        [140, 140, 6],
      ]),
    )
    expect(signals.received).toBe(14)
    expect(signals.processed).toBe(14)
    expect(signals.coveredSeconds).toBe(10)
    expect(signals.judged).toBe(false)
    expect(signals.judgedInSeconds).toBe(20)
    expect(signals.congested).toBe(false)
  })

  it('따라가면 밀림이 아니고 한계도 모른다', () => {
    const signals = admissionSignals(
      series([
        [0, 0, 7],
        [70, 70, 7],
        [140, 141, 6],
        [210, 210, 7],
        [280, 281, 6],
        [350, 350, 7],
        [420, 420, 7],
      ]),
    )
    expect(signals.judged).toBe(true)
    expect(signals.congested).toBe(false)
  })

  it('30초 내내 대기가 늘면 밀림이다', () => {
    // 접수 초당 40, 처리 초당 30 — 대기가 5초마다 50건씩 쌓인다.
    const rows: [number, number, number][] = Array.from(
      { length: 7 },
      (_, i) => [i * 200, i * 150, 100 + i * 50],
    )
    const signals = admissionSignals(series(rows))
    expect(signals.congested).toBe(true)
    expect(signals.received).toBe(40)
    expect(signals.processed).toBe(30)
    expect(signals.backlogPerMinute).toBe(600)
  })

  it('한 번이라도 줄면 밀림이 아니다', () => {
    const signals = admissionSignals(
      series([
        [0, 0, 100],
        [200, 150, 150],
        [400, 300, 200],
        [600, 470, 180],
        [800, 620, 230],
        [1000, 770, 280],
        [1200, 920, 330],
      ]),
    )
    expect(signals.congested).toBe(false)
  })

  it('대기가 줄기 시작하면 밀림이 풀린다', () => {
    const rising: [number, number, number][] = Array.from(
      { length: 7 },
      (_, i) => [i * 200, i * 150, 100 + i * 50],
    )
    const easing: [number, number, number][] = [
      [1300, 1100, 250],
      [1400, 1250, 200],
    ]
    const signals = admissionSignals(series([...rising, ...easing]))
    expect(signals.congested).toBe(false)
  })

  it('폴링이 끊긴 뒤에는 새 30초가 찰 때까지 판단하지 않는다', () => {
    // 0~20초는 밀리다가, 200초에 다시 받았다 — 앞 기록으로 밀림이라 하면 안 된다.
    const signals = admissionSignals([
      ...[0, 5, 10, 15, 20].map((sec, i) => ({
        at: sec * 1000,
        value: { received: i * 100, processed: i * 50, backlog: 100 + i * 50 },
      })),
      { at: 200_000, value: { received: 900, processed: 400, backlog: 400 } },
      { at: 205_000, value: { received: 950, processed: 430, backlog: 450 } },
    ])
    expect(signals.judged).toBe(false)
    expect(signals.judgedInSeconds).toBe(25)
    expect(signals.congested).toBe(false)
  })
})
