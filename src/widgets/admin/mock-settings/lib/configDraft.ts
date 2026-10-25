import {
  MOCK_LATENCY_MAX_MS,
  mockFailureModeLabel,
  mockMixedResponseLabel,
  mockMixedResponses,
  type MockConfig,
  type MockConfigUpdate,
  type MockFailureMode,
  type MockMixedResponse,
} from '@entities/external-reservation'
import { formatNumber } from '@shared/lib/formatNumber'

/** 입력 중인 설정. 칸은 글자 그대로 들고, 비율은 %로 받는다(5% → '5') */
export type ConfigDraft = {
  latency: string
  failure: string
  mode: MockFailureMode
  mixed: ReadonlySet<MockMixedResponse>
  tailOn: boolean
  tailRate: string
  tailMin: string
  tailMax: string
}

const toPercent = (rate: number) => String(Math.round(rate * 10_000) / 100)

/** ms를 초로 — 0.8초, 15초 */
export const formatSeconds = (ms: number) => `${Math.round(ms / 10) / 100}초`

export const draftOf = (config: MockConfig): ConfigDraft => {
  // 꼬리가 켜져 있으면 서버 값 그대로(0ms도 맞는 값이다). 꺼져 있으면 켤 때 쓸 기본값을 채운다.
  const tailOn = config.latencyTailRate > 0
  return {
    latency: String(config.registerLatencyMs),
    failure: toPercent(config.failureRate),
    mode: config.failureMode,
    // MIXED가 아니면 서버가 빈 목록을 준다 — 켜는 순간 다섯 종류 전부에서 시작한다.
    mixed: new Set(
      config.mixedResponses.length > 0
        ? config.mixedResponses
        : mockMixedResponses,
    ),
    tailOn,
    tailRate: tailOn ? toPercent(config.latencyTailRate) : '2',
    tailMin: String(tailOn ? config.latencyTailMinMs : 2000),
    tailMax: String(tailOn ? config.latencyTailMaxMs : 4000),
  }
}

const isInt = (text: string, min: number, max: number) => {
  const value = Number(text)
  return (
    text.trim() !== '' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  )
}
const isPercent = (text: string, max: number) =>
  text.trim() !== '' && Number(text) >= 0 && Number(text) <= max

export const latencyOk = (draft: ConfigDraft) =>
  isInt(draft.latency, 0, MOCK_LATENCY_MAX_MS)
export const failureOk = (draft: ConfigDraft) => isPercent(draft.failure, 100)

/**
 * 저장을 막는 까닭. 서버 규칙(꼬리 세 칸 함께, MIXED일 때만 섞을 응답, 꼬리 확률 × 꼬리 평균
 * < 평균)을 미리 확인해 400을 피한다. 문제가 없으면 undefined
 */
export function problemOf(draft: ConfigDraft): string | undefined {
  if (!latencyOk(draft))
    return `평균 응답 시간은 0~${MOCK_LATENCY_MAX_MS} 정수로 넣어 주세요.`
  if (!failureOk(draft)) return '일시 실패 확률은 0~100 사이로 넣어 주세요.'
  if (draft.mode === 'MIXED' && draft.mixed.size === 0)
    return '섞을 응답을 하나 이상 골라 주세요.'
  if (!draft.tailOn) return undefined
  const rate = Number(draft.tailRate)
  if (!isPercent(draft.tailRate, 99.99) || rate <= 0)
    return '꼬리에 걸릴 확률은 0보다 크고 100보다 작아야 해요.'
  if (
    !isInt(draft.tailMin, 0, MOCK_LATENCY_MAX_MS) ||
    !isInt(draft.tailMax, 0, MOCK_LATENCY_MAX_MS) ||
    Number(draft.tailMin) > Number(draft.tailMax)
  )
    return `꼬리 최소·최대는 0~${MOCK_LATENCY_MAX_MS} 정수이고 최소가 최대 이하여야 해요.`
  const tailAvg = (Number(draft.tailMin) + Number(draft.tailMax)) / 2
  if ((rate / 100) * tailAvg >= Number(draft.latency))
    return '꼬리 확률 × 꼬리 평균이 평균 응답 시간보다 작아야 해요.'
  return undefined
}

/** 서버에 보낼 값 — 통째로 바뀌므로 꼬리·섞을 응답도 쓸 때는 늘 함께 보낸다 */
export const updateOf = (draft: ConfigDraft): MockConfigUpdate => ({
  registerLatencyMs: Number(draft.latency),
  failureRate: Number(draft.failure) / 100,
  failureMode: draft.mode,
  ...(draft.tailOn && {
    latencyTailRate: Number(draft.tailRate) / 100,
    latencyTailMinMs: Number(draft.tailMin),
    latencyTailMaxMs: Number(draft.tailMax),
  }),
  // 고른 순서가 아니라 정해진 순서로 보낸다.
  ...(draft.mode === 'MIXED' && {
    mixedResponses: mockMixedResponses.filter((item) => draft.mixed.has(item)),
  }),
})

const modeText = (
  mode: MockFailureMode,
  mixed: ReadonlySet<MockMixedResponse>,
) =>
  mode === 'MIXED'
    ? `섞기(${mockMixedResponses
        .filter((item) => mixed.has(item))
        .map((item) => mockMixedResponseLabel[item])
        .join('·')})`
    : mockFailureModeLabel[mode]

const tailText = (draft: ConfigDraft) =>
  draft.tailOn
    ? `${draft.tailRate}% · ${formatSeconds(Number(draft.tailMin))}~${formatSeconds(Number(draft.tailMax))}`
    : '꺼짐'

/** 지금 적용 중인 값과 다른 곳 — '평균 800 → 1,200ms'처럼 전후를 같이 적는다 */
export function changesOf(config: MockConfig, draft: ConfigDraft): string[] {
  const saved = draftOf(config)
  const changes: string[] = []
  if (Number(draft.latency) !== config.registerLatencyMs)
    changes.push(
      `평균 ${formatNumber(config.registerLatencyMs)} → ${formatNumber(Number(draft.latency))}ms`,
    )
  if (draft.failure !== saved.failure)
    changes.push(`실패 ${saved.failure} → ${draft.failure}%`)
  const savedMode = modeText(saved.mode, saved.mixed)
  const nextMode = modeText(draft.mode, draft.mixed)
  if (savedMode !== nextMode) changes.push(`응답 ${savedMode} → ${nextMode}`)
  const savedTail = tailText(saved)
  const nextTail = tailText(draft)
  if (savedTail !== nextTail) changes.push(`꼬리 ${savedTail} → ${nextTail}`)
  return changes
}

/** 100건을 보내면 대략 — 실패를 먼저 떼고, 남은 것 중 꼬리 확률만큼이 느리다 */
export type ConfigPreview = {
  normal: number
  failed: number
  slow: number
  /** 꼬리에 안 걸린 요청의 평균(ms) */
  bodyMs: number
}

export function previewOf(draft: ConfigDraft): ConfigPreview {
  const failed = Math.round(Number(draft.failure))
  const tailRate = draft.tailOn ? Number(draft.tailRate) / 100 : 0
  const slow = Math.round((100 - failed) * tailRate)
  const tailAvg = (Number(draft.tailMin) + Number(draft.tailMax)) / 2
  const latency = Number(draft.latency)
  return {
    normal: 100 - failed - slow,
    failed,
    slow,
    bodyMs:
      tailRate > 0 ? (latency - tailRate * tailAvg) / (1 - tailRate) : latency,
  }
}
