import { useState } from 'react'

import {
  MOCK_LATENCY_MAX_MS,
  mockFailureModeLabel,
  mockMixedResponseLabel,
  mockMixedResponses,
  type MockConfig,
  type MockConfigUpdate,
  type MockFailureMode,
} from '@entities/external-reservation'
import { formatNumber } from '@shared/lib/formatNumber'
import { toggleInSet } from '@shared/lib/toggleInSet'
import {
  ChangesBar,
  Chip,
  InlineAlert,
  Input,
  RadioCards,
  StackedBar,
  Toggle,
} from '@shared/ui'

import {
  changesOf,
  draftOf,
  failureOk,
  formatSeconds,
  latencyOk,
  previewOf,
  problemOf,
  updateOf,
  type ConfigDraft,
} from '../../lib/configDraft'

import * as styles from './MockConfigForm.css'

export type MockConfigFormProps = {
  /** 지금 적용 중인 값 — 입력 칸을 이 값으로 채우고, 바뀐 곳을 이 값과 비교한다 */
  config: MockConfig
  saving?: boolean
  onSave: (update: MockConfigUpdate) => void
}

/**
 * 외부 Mock의 응답 속도·실패 설정. 고르기 전에 결과를 짐작할 수 있게 실패 모양마다 워커가
 * 어떻게 받는지 적고, 옆에 '100건 중 대략'을 바로 계산해 보인다. 바뀐 곳은 아래 저장 줄에
 * 모은다 — 팀이 같이 쓰는 서버라 무엇을 바꾸는지 보고 적용하게 한다.
 */
export function MockConfigForm({
  config,
  saving = false,
  onSave,
}: MockConfigFormProps) {
  const [draft, setDraft] = useState(() => draftOf(config))
  const patch = (next: Partial<ConfigDraft>) =>
    setDraft((prev) => ({ ...prev, ...next }))

  const problem = problemOf(draft)
  const changes = changesOf(config, draft)
  const latency = Number(draft.latency)
  const tailTooLong =
    draft.tailOn && Number(draft.tailMax) > config.workerReadTimeoutMs

  const modeItems: {
    value: MockFailureMode
    label: string
    description: string
  }[] = [
    {
      value: 'HTTP_5XX',
      label: mockFailureModeLabel.HTTP_5XX,
      description: '바로 500으로 실패해요. 워커가 같은 키로 다시 보내요.',
    },
    {
      value: 'TIMEOUT',
      label: mockFailureModeLabel.TIMEOUT,
      description: `${formatSeconds(config.timeoutHoldMs)} 붙잡다 끊겨요. 워커는 ${formatSeconds(config.workerReadTimeoutMs)}에 타임아웃이에요.`,
    },
    {
      value: 'MIXED',
      label: mockFailureModeLabel.MIXED,
      description: '아래에서 고른 응답 중 하나를 무작위로 돌려줘요.',
    },
  ]

  const now = previewOf(draftOf(config))
  const next = problem === undefined ? previewOf(draft) : null

  return (
    <div className={styles.root}>
      <div className={styles.columns}>
        <div className={styles.fields}>
          <div className={styles.pair}>
            <div className={styles.field}>
              <Input
                label="평균 응답 시간(ms)"
                variant="stacked"
                type="number"
                min={0}
                max={MOCK_LATENCY_MAX_MS}
                value={draft.latency}
                onChange={(event) => patch({ latency: event.target.value })}
                error={
                  latencyOk(draft)
                    ? undefined
                    : `0~${MOCK_LATENCY_MAX_MS} 정수입니다.`
                }
              />
              {latencyOk(draft) && (
                <span className={styles.hint}>
                  {latency === config.registerLatencyMs
                    ? formatSeconds(latency)
                    : `${formatNumber(config.registerLatencyMs)} → ${formatNumber(latency)}ms (${formatSeconds(latency)})`}
                </span>
              )}
            </div>
            <div className={styles.field}>
              <Input
                label="일시 실패 확률(%)"
                variant="stacked"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={draft.failure}
                onChange={(event) => patch({ failure: event.target.value })}
                error={failureOk(draft) ? undefined : '0~100 사이입니다.'}
              />
              {failureOk(draft) && (
                <span className={styles.hint}>
                  100건 중 약 {Math.round(Number(draft.failure))}건
                </span>
              )}
            </div>
          </div>

          <div className={styles.group}>
            <span className={styles.groupLabel}>실패할 때 돌려줄 응답</span>
            <RadioCards
              label="실패할 때 돌려줄 응답"
              items={modeItems}
              value={draft.mode}
              onChange={(mode) => patch({ mode })}
            />
            {draft.mode === 'MIXED' && (
              <>
                <div
                  className={styles.chips}
                  role="group"
                  aria-label="섞을 응답"
                >
                  {mockMixedResponses.map((item) => (
                    <Chip
                      key={item}
                      variant="solid"
                      selected={draft.mixed.has(item)}
                      onClick={() =>
                        patch({
                          mixed: toggleInSet(
                            draft.mixed,
                            [item],
                            !draft.mixed.has(item),
                          ),
                        })
                      }
                    >
                      {mockMixedResponseLabel[item]}
                    </Chip>
                  ))}
                </div>
                <span className={styles.hint}>
                  502·503은 저장 전 거절로, 본문 없는 500·504는 결과를 모르는
                  실패로 처리돼요.
                </span>
              </>
            )}
          </div>

          <div className={styles.tail}>
            <label className={styles.switchRow}>
              <span className={styles.switchText}>
                <span className={styles.groupLabel}>느린 꼬리</span>
                <span className={styles.hint}>
                  일부 요청만 아주 늦게 — 오픈 직후처럼 몇 건이 오래 걸리는 상황
                </span>
              </span>
              <Toggle
                checked={draft.tailOn}
                onChange={(event) => patch({ tailOn: event.target.checked })}
              />
            </label>
            {draft.tailOn && (
              <div className={styles.triple}>
                <Input
                  label="걸릴 확률(%)"
                  variant="stacked"
                  type="number"
                  min={0}
                  max={99.99}
                  step={0.1}
                  value={draft.tailRate}
                  onChange={(event) => patch({ tailRate: event.target.value })}
                />
                <Input
                  label="최소(ms)"
                  variant="stacked"
                  type="number"
                  min={0}
                  max={MOCK_LATENCY_MAX_MS}
                  value={draft.tailMin}
                  onChange={(event) => patch({ tailMin: event.target.value })}
                />
                <Input
                  label="최대(ms)"
                  variant="stacked"
                  type="number"
                  min={0}
                  max={MOCK_LATENCY_MAX_MS}
                  value={draft.tailMax}
                  onChange={(event) => patch({ tailMax: event.target.value })}
                />
              </div>
            )}
            {tailTooLong && (
              <InlineAlert status="warning">
                꼬리 최대 {formatSeconds(Number(draft.tailMax))}가 워커 읽기
                타임아웃 {formatSeconds(config.workerReadTimeoutMs)}보다 길어요.
                꼬리에 걸린 요청 일부는 타임아웃으로 처리돼 키 조회 후 다시
                보내요.
              </InlineAlert>
            )}
          </div>
        </div>

        <aside className={styles.preview} aria-labelledby="mock-preview">
          <div className={styles.previewHead}>
            <span id="mock-preview" className={styles.previewTitle}>
              저장하면 100건 중 대략
            </span>
            <span className={styles.hint}>
              입력한 값으로 바로 계산한 예상이에요
            </span>
          </div>
          {next ? (
            <StackedBar
              unit="건"
              segments={[
                {
                  key: 'normal',
                  label: '정상 응답',
                  value: next.normal,
                  caption: `꼬리 제외 평균 약 ${formatSeconds(next.bodyMs)}`,
                  tone: 'primary',
                },
                {
                  key: 'failed',
                  label: '일시 실패',
                  value: next.failed,
                  caption:
                    draft.mode === 'MIXED'
                      ? mockMixedResponses
                          .filter((item) => draft.mixed.has(item))
                          .map((item) => mockMixedResponseLabel[item])
                          .join(' · ')
                      : mockFailureModeLabel[draft.mode],
                  tone: 'danger',
                },
                ...(draft.tailOn
                  ? [
                      {
                        key: 'slow',
                        label: '느림',
                        value: next.slow,
                        caption: `${formatSeconds(Number(draft.tailMin))}~${formatSeconds(Number(draft.tailMax))}${tailTooLong ? ' · 일부 타임아웃' : ''}`,
                        tone: 'warning' as const,
                      },
                    ]
                  : []),
              ]}
            />
          ) : (
            <span className={styles.hint}>입력을 고치면 다시 계산해요.</span>
          )}
          <span className={styles.previewNow}>
            지금(버전 {config.configVersion})은 정상 {now.normal}건 · 실패{' '}
            {now.failed}건 · 평균 {formatSeconds(config.registerLatencyMs)}
            이에요.
          </span>
        </aside>
      </div>

      <ChangesBar
        changes={changes}
        note={`저장하면 버전 ${config.configVersion + 1}`}
        problem={problem}
        saveLabel="팀에 적용"
        saving={saving}
        onSave={() => onSave(updateOf(draft))}
        onRevert={() => setDraft(draftOf(config))}
      />
    </div>
  )
}
