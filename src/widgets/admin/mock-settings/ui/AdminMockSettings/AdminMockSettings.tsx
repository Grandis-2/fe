import { useState } from 'react'

import {
  MOCK_FAULT_DELAY_MAX_MS,
  mockFailureModeLabel,
  mockFaultTypeLabel,
  mockMixedResponseLabel,
  useInjectMockFault,
  useMockConfig,
  useResetMockLedger,
  useUpdateMockConfig,
  type MockConfig,
  type MockConfigUpdate,
  type MockFaultType,
} from '@entities/external-reservation'
import { getErrorMessage } from '@shared/api/client'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatNumber } from '@shared/lib/formatNumber'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  FormSection,
  InlineAlert,
  Input,
  RadioCards,
  RefreshStatus,
  StatCard,
  Tag,
} from '@shared/ui'

import { formatSeconds } from '../../lib/configDraft'
import { MockConfigForm } from '../MockConfigForm'

import * as styles from './AdminMockSettings.css'

const RESET_WORD = 'RESET'

/** 원장 비우기로 지워지는 것 — 설정과 버전은 남는다 */
const RESET_TARGETS = [
  '등록 기록',
  '취소 표식',
  '럭키드로우 회차·응모',
  '걸어 둔 결함',
]

const percent = (rate: number) => `${Math.round(rate * 10_000) / 100}%`

const failureText = (config: MockConfig) =>
  config.failureMode === 'MIXED'
    ? config.mixedResponses
        .map((item) => mockMixedResponseLabel[item])
        .join(' · ')
    : mockFailureModeLabel[config.failureMode]

/**
 * 외부 예약 시스템 Mock 설정(개발자용). 맨 위에 지금 적용 중인 값, 그 아래 응답 속도·실패를
 * 바꾸고, 키 하나에 결함을 걸고, 원장을 비운다(위험 구역). 팀이 같이 쓰는 서버라 모든 변경은
 * 다른 사람의 시험에도 바로 영향이 간다.
 */
export function AdminMockSettings() {
  const config = useMockConfig()
  const update = useUpdateMockConfig()
  const fault = useInjectMockFault()
  const reset = useResetMockLedger()

  const [faultKey, setFaultKey] = useState('')
  const [faultType, setFaultType] = useState<MockFaultType>(
    'RESPONSE_LOST_AFTER_COMMIT',
  )
  const [faultDelay, setFaultDelay] = useState('6000')
  const [resetWord, setResetWord] = useState('')

  const delay = Number(faultDelay)
  const delayOk =
    faultType !== 'SLOW_SUCCESS' ||
    (Number.isInteger(delay) && delay >= 1 && delay <= MOCK_FAULT_DELAY_MAX_MS)
  const faultOk = /^[\w.-]{1,100}$/.test(faultKey.trim()) && delayOk

  const confirmSave = (body: MockConfigUpdate) =>
    openModal({
      theme: 'light',
      title: 'Mock 설정을 팀에 적용할까요?',
      description:
        '팀이 같이 쓰는 서버라 다른 사람의 시험에도 바로 적용됩니다. 진행 중인 등록은 이전 설정으로 끝납니다.',
      confirmLabel: '적용',
      onConfirm: () => {
        closeModal()
        update.reset()
        update.mutate(body, {
          onSuccess: ({ configVersion }) =>
            showToast(`설정을 적용했습니다(버전 ${configVersion}).`),
        })
      },
    })

  const injectFault = () => {
    fault.reset()
    fault.mutate(
      {
        externalKey: faultKey.trim(),
        faultType,
        ...(faultType === 'SLOW_SUCCESS' && { delayMs: delay }),
      },
      {
        onSuccess: (result) =>
          showToast(
            `${result.externalKey}의 다음 등록에 '${mockFaultTypeLabel[result.faultType]}'을(를) 걸었습니다.`,
          ),
      },
    )
  }

  const confirmReset = () =>
    openModal({
      theme: 'light',
      title: '외부 원장을 모두 지울까요?',
      description: `${RESET_TARGETS.join('·')}이 전부 지워지고 되돌릴 수 없습니다. 팀이 같이 쓰는 서버이니 미리 알려 주세요.`,
      confirmLabel: '모두 지우기',
      onConfirm: () => {
        closeModal()
        reset.reset()
        reset.mutate(undefined, {
          onSuccess: ({ deletedCount, deletedDraws, deletedDrawEntries }) => {
            setResetWord('')
            showToast(
              `등록 ${formatNumber(deletedCount)}행, 럭키드로우 회차 ${formatNumber(deletedDraws)}개·응모 ${formatNumber(deletedDrawEntries)}건을 지웠습니다.`,
            )
          },
        })
      },
    })

  const hold = config.data ? formatSeconds(config.data.timeoutHoldMs) : '—'
  const faultItems: {
    value: MockFaultType
    label: string
    description: { when: string; result: string; check: string }
  }[] = [
    {
      value: 'RESPONSE_LOST_AFTER_COMMIT',
      label: mockFaultTypeLabel.RESPONSE_LOST_AFTER_COMMIT,
      description: {
        when: '그 키로 새로 등록한 직후',
        result: `등록은 저장되고 응답만 ${hold} 끊긴 뒤 본문 없는 500`,
        check: '워커가 키 조회로 등록을 찾아 확정하는지',
      },
    },
    {
      value: 'SLOW_SUCCESS',
      label: mockFaultTypeLabel.SLOW_SUCCESS,
      description: {
        when: '그 키의 다음 등록, 저장 전',
        result: '정한 시간만큼 기다린 뒤 정상 처리',
        check: '늦은 커밋을 다시 보내도 한 건만 남는지',
      },
    },
  ]

  const data = config.data

  return (
    <div className={styles.root}>
      <section className={styles.status} aria-labelledby="mock-now">
        <div className={styles.statusHead}>
          <h2 id="mock-now" className={styles.statusTitle}>
            지금 적용 중
            {data && (
              <span className={styles.version}>
                버전 {data.configVersion} · {formatDotDateTime(data.appliedAt)}{' '}
                적용
              </span>
            )}
          </h2>
          <RefreshStatus
            updatedAt={config.dataUpdatedAt}
            onRefresh={() => void config.refetch()}
          />
        </div>

        {config.isError && (
          <InlineAlert status="error">
            {getErrorMessage(config.error, 'Mock 설정을 불러오지 못했습니다.')}
          </InlineAlert>
        )}

        <div className={styles.stats}>
          <StatCard
            label="응답 속도"
            loading={config.isPending}
            value={data ? `평균 ${formatSeconds(data.registerLatencyMs)}` : '—'}
            muted={!data}
            caption={
              data &&
              `${formatNumber(data.registerLatencyMs)}ms · 요청마다 ±${percent(data.latencyJitter)} 흔들림`
            }
          />
          <StatCard
            label="일시 실패"
            loading={config.isPending}
            value={data ? percent(data.failureRate) : '—'}
            muted={!data}
            caption={data && `${failureText(data)}로 실패`}
          />
          <StatCard
            label="느린 꼬리"
            loading={config.isPending}
            value={
              data && data.latencyTailRate > 0
                ? percent(data.latencyTailRate)
                : data
                  ? '꺼짐'
                  : '—'
            }
            muted={!data || data.latencyTailRate === 0}
            caption={
              data &&
              (data.latencyTailRate > 0
                ? `${formatSeconds(data.latencyTailMinMs)}~${formatSeconds(data.latencyTailMaxMs)} · 꼬리 제외 평균 ${formatSeconds(data.bodyLatencyMs)}`
                : '모든 요청이 평균 근처로 응답')
            }
          />
        </div>

        {data && (
          <div className={styles.reference}>
            <span>참고(바꿀 수 없음)</span>
            <span>
              워커 읽기 타임아웃{' '}
              <b className={styles.strong}>
                {formatSeconds(data.workerReadTimeoutMs)}
              </b>
            </span>
            <span>
              타임아웃·응답 유실이 붙잡는 시간{' '}
              <b className={styles.strong}>
                {formatSeconds(data.timeoutHoldMs)}
              </b>
            </span>
            <span>재기동하면 기본값으로 돌아가요</span>
          </div>
        )}
      </section>

      <FormSection
        title="응답 속도·실패"
        description="한 번에 통째로 바뀌어요. 진행 중인 등록은 이전 설정으로 끝나요."
      >
        <div className={styles.card}>
          {data ? (
            <MockConfigForm
              // 적용했거나 다른 사람이 바꿔 버전이 오르면 입력 칸을 새 값으로 맞춘다.
              key={data.configVersion}
              config={data}
              saving={update.isPending}
              onSave={confirmSave}
            />
          ) : (
            <span className={styles.subText}>
              {config.isPending
                ? '설정을 불러오는 중이에요.'
                : '설정을 불러오면 바꿀 수 있어요.'}
            </span>
          )}
          {update.isError && (
            <InlineAlert status="error">
              {getErrorMessage(update.error, '설정을 적용하지 못했습니다.')}
            </InlineAlert>
          )}
        </div>
      </FormSection>

      <FormSection
        title="결함 한 건 걸기"
        description="확률에 기대지 않고, 정한 예약 한 건의 다음 등록에만 정확히 한 번 일어나요. 발동하면 저절로 풀려요."
      >
        <div className={styles.card}>
          <RadioCards
            label="결함 종류"
            value={faultType}
            onChange={setFaultType}
            items={faultItems.map(({ value, label, description }) => ({
              value,
              label,
              description: (
                <span className={styles.faultFacts}>
                  <span>언제 · {description.when}</span>
                  <span>결과 · {description.result}</span>
                  <span>확인 · {description.check}</span>
                </span>
              ),
            }))}
          />
          <div className={styles.faultRow}>
            <div className={styles.grow}>
              <Input
                label="예약 id(외부 키)"
                variant="stacked"
                value={faultKey}
                placeholder="9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f"
                onChange={(event) => setFaultKey(event.target.value)}
              />
            </div>
            {faultType === 'SLOW_SUCCESS' && (
              <Input
                label="기다릴 시간(ms)"
                variant="stacked"
                type="number"
                min={1}
                max={MOCK_FAULT_DELAY_MAX_MS}
                value={faultDelay}
                onChange={(event) => setFaultDelay(event.target.value)}
                error={
                  delayOk
                    ? undefined
                    : `1~${MOCK_FAULT_DELAY_MAX_MS} 정수입니다.`
                }
              />
            )}
            <Button
              size="small"
              className={styles.faultButton}
              disabled={!faultOk || fault.isPending}
              onClick={injectFault}
            >
              결함 걸기
            </Button>
          </div>
          {/* 서버는 실패 판정을 결함보다 먼저 한다 — 확률 실패가 결함을 덮을 수 있다. */}
          {data && data.failureRate > 0 && (
            <InlineAlert status="warning">
              지금 일시 실패가 {percent(data.failureRate)}라 결함보다 실패가
              먼저 날 수 있어요. 정확히 보려면 실패 확률을 0%로 내리고 걸어
              주세요.
            </InlineAlert>
          )}
          {fault.isError && (
            <InlineAlert status="error">
              {getErrorMessage(fault.error, '결함을 걸지 못했습니다.')}
            </InlineAlert>
          )}
        </div>
      </FormSection>

      <FormSection
        title="원장 비우기"
        description="부하 시험이나 시연을 다시 시작하기 전에 써요. 설정과 버전은 그대로이고, 되돌릴 수 없어요."
      >
        <div className={styles.dangerCard}>
          <div className={styles.targets}>
            <span className={styles.targetsLabel}>지워지는 것</span>
            <div className={styles.tags}>
              {RESET_TARGETS.map((target) => (
                <Tag
                  key={target}
                  variant="subtle"
                  color="red"
                  size="medium"
                  rounded={false}
                >
                  {target}
                </Tag>
              ))}
            </div>
          </div>
          <InlineAlert status="info">
            본 서비스 쪽 외부 번호 기록도 같이 비워야 예약번호가 겹치지 않아요.
            진행 중인 등록·응모가 있으면 아무것도 지우지 않고 거절돼요 — 지연을
            0으로 내리고{' '}
            {data ? `${formatSeconds(data.timeoutHoldMs)}쯤 뒤` : '잠시 뒤'}{' '}
            다시 해 주세요.
          </InlineAlert>
          <div className={styles.faultRow}>
            <Input
              label={`확인을 위해 ${RESET_WORD} 입력`}
              variant="stacked"
              value={resetWord}
              placeholder={RESET_WORD}
              onChange={(event) => setResetWord(event.target.value)}
            />
            <Button
              size="small"
              variant="outline"
              color="cancel"
              className={styles.faultButton}
              disabled={resetWord !== RESET_WORD || reset.isPending}
              onClick={confirmReset}
            >
              원장 모두 지우기
            </Button>
          </div>
          {reset.isError && (
            <InlineAlert status="error">
              {getErrorMessage(reset.error, '원장을 지우지 못했습니다.')}
            </InlineAlert>
          )}
        </div>
      </FormSection>
    </div>
  )
}
