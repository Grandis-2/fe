import type {
  MockConfig,
  MockConfigUpdate,
} from '@entities/external-reservation'

/** 부하를 넣기 전에 한 번에 고르는 외부 Mock 조건. 세부 값은 Mock 설정에서 바꾼다 */
export type MockPreset = {
  key: string
  label: string
  update: MockConfigUpdate
}

// 통째 교체라 꼬리 세 칸·실패 방식을 항상 같이 보낸다.
const base = {
  registerLatencyMs: 200,
  failureRate: 0,
  failureMode: 'HTTP_5XX',
  latencyTailRate: 0,
  latencyTailMinMs: 0,
  latencyTailMaxMs: 0,
} satisfies MockConfigUpdate

export const MOCK_PRESETS: readonly MockPreset[] = [
  { key: 'normal', label: '정상', update: base },
  {
    key: 'slow',
    label: '느린 외부',
    update: {
      ...base,
      registerLatencyMs: 800,
      failureRate: 0.02,
      latencyTailRate: 0.05,
      latencyTailMinMs: 2000,
      latencyTailMaxMs: 4000,
    },
  },
  { key: 'fail5', label: '실패 5%', update: { ...base, failureRate: 0.05 } },
  {
    key: 'timeout',
    label: '타임아웃 폭주',
    update: { ...base, failureRate: 0.3, failureMode: 'TIMEOUT' },
  },
]

/** 지금 설정이 어느 조건과 같은지. 직접 바꾼 값이면 undefined */
export const presetOf = (config: MockConfig) =>
  MOCK_PRESETS.find(
    ({ update }) =>
      update.registerLatencyMs === config.registerLatencyMs &&
      update.failureRate === config.failureRate &&
      update.failureMode === config.failureMode &&
      update.latencyTailRate === config.latencyTailRate,
  )
