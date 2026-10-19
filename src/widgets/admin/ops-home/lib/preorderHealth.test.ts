import { describe, expect, it } from 'vitest'

import { preorderHealth, untilClose } from './preorderHealth'

const NOW = Date.parse('2026-10-08T05:10:00Z')

describe('preorderHealth', () => {
  it('실패가 하나라도 있으면 밀림보다 먼저 실패', () => {
    expect(
      preorderHealth({
        failures: 1,
        oldestPendingAt: '2026-10-08T05:00:00Z',
        now: NOW,
      }),
    ).toBe('failing')
  })

  it('외부 등록을 1분 넘게 기다리면 밀림', () => {
    expect(
      preorderHealth({
        failures: 0,
        oldestPendingAt: '2026-10-08T05:08:30Z',
        now: NOW,
      }),
    ).toBe('slow')
  })

  it('기다리는 게 없거나 1분 안이면 정상', () => {
    expect(
      preorderHealth({ failures: 0, oldestPendingAt: null, now: NOW }),
    ).toBe('ok')
    expect(
      preorderHealth({
        failures: 0,
        oldestPendingAt: '2026-10-08T05:09:30Z',
        now: NOW,
      }),
    ).toBe('ok')
  })
})

describe('untilClose', () => {
  it('분·시간으로, 1분 안이면 곧 마감', () => {
    expect(untilClose('2026-10-08T06:30:00Z', NOW)).toBe('1시간 20분')
    expect(untilClose('2026-10-08T05:55:00Z', NOW)).toBe('45분')
    expect(untilClose('2026-10-08T05:10:30Z', NOW)).toBe('곧 마감')
  })
})
