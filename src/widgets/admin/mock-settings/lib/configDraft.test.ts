import { describe, expect, it } from 'vitest'

import {
  changesOf,
  draftOf,
  previewOf,
  problemOf,
  updateOf,
} from './configDraft'

const config = {
  registerLatencyMs: 800,
  latencyJitter: 0.2,
  latencyTailRate: 0,
  latencyTailMinMs: 0,
  latencyTailMaxMs: 0,
  bodyLatencyMs: 800,
  failureRate: 0.02,
  failureMode: 'HTTP_5XX' as const,
  mixedResponses: [],
  configVersion: 12,
  appliedAt: '2026-10-24T05:20:00Z',
  timeoutHoldMs: 30_000,
  workerReadTimeoutMs: 10_000,
}

const edited = {
  ...draftOf(config),
  latency: '1200',
  failure: '5',
  mode: 'MIXED' as const,
  mixed: new Set(['HTTP_500', 'HTTP_502', 'HTTP_503'] as const),
  tailOn: true,
  tailRate: '2',
  tailMin: '8000',
  tailMax: '15000',
}

describe('configDraft', () => {
  it('그대로면 바뀐 곳이 없다', () => {
    expect(changesOf(config, draftOf(config))).toEqual([])
  })

  it('바뀐 곳을 전후로 적는다', () => {
    expect(changesOf(config, edited)).toEqual([
      '평균 800 → 1,200ms',
      '실패 2 → 5%',
      '응답 HTTP 5xx 오류 → 섞기(500·502·503)',
      '꼬리 꺼짐 → 2% · 8초~15초',
    ])
  })

  it('보낼 값 — %는 0~1로, 꼬리 세 칸과 섞을 응답을 함께', () => {
    expect(updateOf(edited)).toEqual({
      registerLatencyMs: 1200,
      failureRate: 0.05,
      failureMode: 'MIXED',
      latencyTailRate: 0.02,
      latencyTailMinMs: 8000,
      latencyTailMaxMs: 15000,
      mixedResponses: ['HTTP_500', 'HTTP_502', 'HTTP_503'],
    })
  })

  it('켜진 꼬리의 0ms 경계를 기본값으로 바꾸지 않는다 — 다른 칸만 바꿔 저장해도 그대로 간다', () => {
    const tail = {
      ...config,
      latencyTailRate: 0.05,
      latencyTailMinMs: 0,
      latencyTailMaxMs: 0,
    }
    const draft = { ...draftOf(tail), failure: '5' }
    expect(updateOf(draft)).toMatchObject({
      latencyTailRate: 0.05,
      latencyTailMinMs: 0,
      latencyTailMaxMs: 0,
    })
    expect(changesOf(tail, draftOf(tail))).toEqual([])
  })

  it('꼬리가 평균을 다 잡아먹으면 막는다', () => {
    expect(problemOf(edited)).toBeUndefined()
    expect(problemOf({ ...edited, tailRate: '50' })).toMatch(
      /평균 응답 시간보다/,
    )
    expect(problemOf({ ...edited, mixed: new Set() })).toMatch(/섞을 응답/)
  })

  it('100건 중 대략 — 실패를 먼저 떼고 남은 것 중 꼬리만큼 느리다', () => {
    const preview = previewOf(edited)
    expect([preview.normal, preview.failed, preview.slow]).toEqual([93, 5, 2])
    expect(Math.round(preview.bodyMs)).toBe(990)
  })
})
