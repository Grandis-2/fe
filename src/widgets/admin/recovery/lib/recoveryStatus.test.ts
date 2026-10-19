import { describe, expect, it } from 'vitest'

import { recoveryStatus } from './recoveryStatus'

const NOW = 1_000_000
const sent = {
  at: NOW - 100_000,
  targetCount: 860,
  skippedCount: 0,
  estimatedSeconds: 43,
  capped: false,
  failuresAtSend: { all: 860 },
  byErrorCode: { HTTP_503: 820, TIMEOUT: 40 },
}
const base = {
  rising: false,
  sent: null,
  failuresAtSend: undefined,
  now: NOW,
}

describe('recoveryStatus — 보내기 전', () => {
  it('실패가 없으면 그렇다고 한다', () => {
    expect(recoveryStatus({ ...base, failures: 0 }).tone).toBe('success')
  })

  it('실패가 늘고 있으면 아직 보내지 말라고 한다', () => {
    const status = recoveryStatus({ ...base, failures: 50, rising: true })
    expect(status.tone).toBe('warning')
    expect(status.message).toContain('늘지 않을 때 보내세요')
  })

  it('늘지 않으면 보내도 된다고, 표본이 모자라면 재는 중이라고 한다', () => {
    expect(recoveryStatus({ ...base, failures: 50 }).message).toContain(
      '지금 보내도 돼요',
    )
    expect(
      recoveryStatus({ ...base, failures: 50, rising: null }).message,
    ).toContain('재는 중')
  })

  it('고른 사전예약 이름을 앞에 붙인다', () => {
    expect(
      recoveryStatus({ ...base, failures: 50, scope: '아이폰' }).message,
    ).toMatch(/^아이폰 — 50건이/)
  })
})

describe('recoveryStatus — 보낸 뒤', () => {
  it('예상 시간 안이면 남은 시간을 말한다', () => {
    const status = recoveryStatus({
      ...base,
      failures: 400,
      sent: { ...sent, at: NOW - 13_000 },
      failuresAtSend: 860,
    })
    expect(status.message).toContain('약 30초 남음')
  })

  it('예상 시간이 지나면 결과로 — 0이면 회복, 줄면 줄었음, 그대로면 경고', () => {
    const after = { ...base, sent, failuresAtSend: 860 }
    expect(recoveryStatus({ ...after, failures: 0 }).tone).toBe('success')
    expect(recoveryStatus({ ...after, failures: 212 }).message).toContain(
      '860 → 212건',
    )
    expect(recoveryStatus({ ...after, failures: 860 }).message).toContain(
      '그대로예요',
    )
    // 늘었으면 다시 보내기 실패로 단정하지 않는다 — 새 접수의 실패일 수 있다.
    expect(recoveryStatus({ ...after, failures: 1000 }).message).toContain(
      '새 접수에서 실패가 나고 있어요',
    )
  })
})
