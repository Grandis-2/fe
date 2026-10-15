import { useState } from 'react'

import {
  MOCK_LATENCY_MAX_MS,
  mockFailureModeLabel,
  mockMixedResponses,
  type MockConfig,
  type MockConfigUpdate,
  type MockFailureMode,
  type MockMixedResponse,
} from '@entities/external-reservation'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { Button, Checkbox, Dropdown, Input } from '@shared/ui'
import type { DropdownOption } from '@shared/ui'

import * as styles from './MockConfigForm.css'

export type MockConfigFormProps = {
  /** 지금 적용 중인 값 — 입력 칸을 이 값으로 채운다 */
  config: MockConfig
  saving?: boolean
  onSave: (update: MockConfigUpdate) => void
}

const failureModeOptions: DropdownOption<MockFailureMode>[] = (
  Object.keys(mockFailureModeLabel) as MockFailureMode[]
).map((mode) => ({ label: mockFailureModeLabel[mode], value: mode }))

// 비율은 화면에서 %로 받고 서버엔 0~1로 보낸다(5% → 0.05).
const toPercent = (rate: number) => String(Math.round(rate * 10_000) / 100)
const isInt = (text: string, min: number, max: number) => {
  const value = Number(text)
  return (
    text.trim() !== '' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  )
}
const isPercent = (text: string, max: number) => {
  const value = Number(text)
  return text.trim() !== '' && value >= 0 && value <= max
}

/**
 * 외부 Mock의 지연·실패 설정 입력. 서버 규칙(꼬리 세 칸 함께, MIXED일 때만 섞을 응답,
 * 꼬리 평균 × 비율 < 평균 지연)을 미리 확인해 400을 피하고, 통째 교체라 모든 칸을 보낸다.
 */
export function MockConfigForm({
  config,
  saving = false,
  onSave,
}: MockConfigFormProps) {
  const [latency, setLatency] = useState(String(config.registerLatencyMs))
  const [failure, setFailure] = useState(toPercent(config.failureRate))
  const [mode, setMode] = useState(config.failureMode)
  const [mixed, setMixed] = useState<ReadonlySet<MockMixedResponse>>(
    new Set(
      config.mixedResponses.length > 0
        ? config.mixedResponses
        : mockMixedResponses,
    ),
  )
  const [tailOn, setTailOn] = useState(config.latencyTailRate > 0)
  const [tailRate, setTailRate] = useState(toPercent(config.latencyTailRate))
  const [tailMin, setTailMin] = useState(String(config.latencyTailMinMs))
  const [tailMax, setTailMax] = useState(String(config.latencyTailMaxMs))

  const latencyOk = isInt(latency, 0, MOCK_LATENCY_MAX_MS)
  const failureOk = isPercent(failure, 100)
  const tailRangeOk =
    isInt(tailMin, 0, MOCK_LATENCY_MAX_MS) &&
    isInt(tailMax, 0, MOCK_LATENCY_MAX_MS) &&
    Number(tailMin) <= Number(tailMax)
  // 꼬리가 평균을 다 잡아먹으면 서버가 거절한다(비율 × 꼬리 평균 < 평균 지연).
  const tailBudgetOk =
    (Number(tailRate) / 100) * ((Number(tailMin) + Number(tailMax)) / 2) <
    Number(latency)
  const tailOk =
    !tailOn ||
    (isPercent(tailRate, 99.99) &&
      Number(tailRate) > 0 &&
      tailRangeOk &&
      tailBudgetOk)
  const mixedOk = mode !== 'MIXED' || mixed.size > 0
  const valid = latencyOk && failureOk && tailOk && mixedOk

  const submit = () =>
    onSave({
      registerLatencyMs: Number(latency),
      failureRate: Number(failure) / 100,
      failureMode: mode,
      ...(tailOn && {
        latencyTailRate: Number(tailRate) / 100,
        latencyTailMinMs: Number(tailMin),
        latencyTailMaxMs: Number(tailMax),
      }),
      // 고른 순서가 아니라 정해진 순서로 보낸다.
      ...(mode === 'MIXED' && {
        mixedResponses: mockMixedResponses.filter((item) => mixed.has(item)),
      }),
    })

  return (
    <div className={styles.root}>
      <div className={styles.grid}>
        <Input
          label="등록 지연 평균(ms)"
          variant="stacked"
          type="number"
          min={0}
          max={MOCK_LATENCY_MAX_MS}
          value={latency}
          onChange={(event) => setLatency(event.target.value)}
          error={latencyOk ? undefined : `0~${MOCK_LATENCY_MAX_MS} 정수입니다.`}
        />
        <Input
          label="일시 실패 확률(%)"
          variant="stacked"
          type="number"
          min={0}
          max={100}
          step={0.1}
          value={failure}
          onChange={(event) => setFailure(event.target.value)}
          error={failureOk ? undefined : '0~100 사이입니다.'}
        />
        <Dropdown
          label="실패 모양"
          size="medium"
          options={failureModeOptions}
          value={mode}
          onSelect={setMode}
        />
      </div>

      {mode === 'MIXED' && (
        <div className={styles.group}>
          <div className={styles.groupLabel}>섞을 응답</div>
          <div className={styles.checks}>
            {mockMixedResponses.map((item) => (
              <label key={item} className={styles.check}>
                <Checkbox
                  checked={mixed.has(item)}
                  onChange={(event) =>
                    setMixed((prev) =>
                      toggleInSet(prev, [item], event.target.checked),
                    )
                  }
                />
                {item}
              </label>
            ))}
          </div>
          {!mixedOk && (
            <div className={styles.error}>하나 이상 골라 주세요.</div>
          )}
        </div>
      )}

      <div className={styles.group}>
        <label className={styles.check}>
          <Checkbox
            checked={tailOn}
            onChange={(event) => setTailOn(event.target.checked)}
          />
          느린 꼬리 걸기(일부 요청만 아주 늦게)
        </label>
        {tailOn && (
          <div className={styles.grid}>
            <Input
              label="꼬리 확률(%)"
              variant="stacked"
              type="number"
              min={0}
              max={99.99}
              step={0.1}
              value={tailRate}
              onChange={(event) => setTailRate(event.target.value)}
            />
            <Input
              label="꼬리 최소(ms)"
              variant="stacked"
              type="number"
              min={0}
              max={MOCK_LATENCY_MAX_MS}
              value={tailMin}
              onChange={(event) => setTailMin(event.target.value)}
            />
            <Input
              label="꼬리 최대(ms)"
              variant="stacked"
              type="number"
              min={0}
              max={MOCK_LATENCY_MAX_MS}
              value={tailMax}
              onChange={(event) => setTailMax(event.target.value)}
            />
          </div>
        )}
        {tailOn && !tailOk && (
          <div className={styles.error}>
            {!tailRangeOk
              ? '최소·최대는 0~60000 정수이고 최소가 최대 이하여야 합니다.'
              : !tailBudgetOk
                ? '꼬리 확률 × 꼬리 평균이 등록 지연 평균보다 작아야 합니다.'
                : '꼬리 확률은 0보다 크고 100보다 작아야 합니다.'}
          </div>
        )}
      </div>

      <Button
        size="small"
        className={styles.save}
        disabled={!valid || saving}
        onClick={submit}
      >
        {saving ? '저장 중…' : '설정 저장'}
      </Button>
    </div>
  )
}
