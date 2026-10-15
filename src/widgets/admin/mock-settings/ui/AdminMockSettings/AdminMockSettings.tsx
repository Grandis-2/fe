import { useState } from 'react'

import {
  MOCK_FAULT_DELAY_MAX_MS,
  mockFailureModeLabel,
  mockFaultTypeLabel,
  useInjectMockFault,
  useMockConfig,
  useResetMockLedger,
  useUpdateMockConfig,
  type MockConfigUpdate,
  type MockFaultType,
} from '@entities/external-reservation'
import { getErrorMessage } from '@shared/api/client'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import { Button, Dropdown, FormSection, InlineAlert, Input } from '@shared/ui'
import type { DropdownOption } from '@shared/ui'

import { MockConfigForm } from '../MockConfigForm'

import * as styles from './AdminMockSettings.css'

const RESET_WORD = 'RESET'

const faultOptions: DropdownOption<MockFaultType>[] = (
  Object.keys(mockFaultTypeLabel) as MockFaultType[]
).map((type) => ({ label: mockFaultTypeLabel[type], value: type }))

const percent = (rate: number) => `${Math.round(rate * 10_000) / 100}%`

/**
 * 외부 예약 시스템 Mock 설정(개발자용). 지연·실패를 바꾸고, 키 하나에 결함을 걸고, 원장을
 * 지운다. 팀이 같이 쓰는 서버라 모든 변경은 다른 사람의 시험에도 바로 영향이 간다.
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
      title: 'Mock 설정을 바꿀까요?',
      description:
        '팀이 같이 쓰는 서버라 다른 사람의 시험에도 바로 적용됩니다. 진행 중인 등록은 이전 설정으로 끝납니다.',
      confirmLabel: '저장',
      onConfirm: () => {
        closeModal()
        update.reset()
        update.mutate(body, {
          onSuccess: ({ configVersion }) =>
            showToast(`설정을 저장했습니다(버전 ${configVersion}).`),
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
      description:
        '등록 기록·취소 표식·걸린 결함이 전부 지워지고 되돌릴 수 없습니다. 팀이 같이 쓰는 서버이니 미리 알려 주세요. 본 서비스 쪽 외부 번호 기록도 함께 비워야 번호가 겹치지 않습니다.',
      confirmLabel: '모두 지우기',
      onConfirm: () => {
        closeModal()
        reset.reset()
        reset.mutate(undefined, {
          onSuccess: ({ deletedCount }) => {
            setResetWord('')
            showToast(`${deletedCount.toLocaleString('ko-KR')}행을 지웠습니다.`)
          },
        })
      },
    })

  const info = config.data && [
    { label: '설정 버전', value: String(config.data.configVersion) },
    { label: '마지막 적용', value: formatDotDateTime(config.data.appliedAt) },
    {
      label: '지금 적용 중',
      value: `평균 ${config.data.registerLatencyMs}ms · 실패 ${percent(config.data.failureRate)} · ${mockFailureModeLabel[config.data.failureMode]}`,
    },
    {
      label: '꼬리 제외 평균',
      value: `${config.data.bodyLatencyMs}ms (흔들림 ±${percent(config.data.latencyJitter)})`,
    },
    { label: '타임아웃 붙잡는 시간', value: `${config.data.timeoutHoldMs}ms` },
    {
      label: '워커 읽기 타임아웃',
      value: `${config.data.workerReadTimeoutMs}ms`,
    },
  ]

  return (
    <div className={styles.root}>
      <InlineAlert status="warning">
        팀이 같이 쓰는 Mock 서버입니다. 바꾸거나 지우기 전에 팀에 알려 주세요.
        서버가 재기동하면 설정은 기본값으로 돌아갑니다.
      </InlineAlert>

      <FormSection title="지연·실패 설정">
        <div className={styles.card}>
          {config.isPending && (
            <div className={styles.subText}>불러오는 중입니다.</div>
          )}
          {config.isError && (
            <InlineAlert status="error">
              {getErrorMessage(
                config.error,
                'Mock 설정을 불러오지 못했습니다.',
              )}
            </InlineAlert>
          )}
          {info && (
            <dl className={styles.info}>
              {info.map(({ label, value }) => (
                <div key={label} className={styles.row}>
                  <dt className={styles.term}>{label}</dt>
                  <dd className={styles.value}>{value}</dd>
                </div>
              ))}
            </dl>
          )}
          {config.data && (
            <MockConfigForm
              // 저장했거나 다른 사람이 바꿔 버전이 오르면 입력 칸을 새 값으로 맞춘다.
              key={config.data.configVersion}
              config={config.data}
              saving={update.isPending}
              onSave={confirmSave}
            />
          )}
          {update.isError && (
            <InlineAlert status="error">
              {getErrorMessage(update.error, '설정을 저장하지 못했습니다.')}
            </InlineAlert>
          )}
        </div>
      </FormSection>

      <FormSection
        title="결함 주입"
        description="지정한 키(예약 id)의 다음 등록에 결함을 한 번 겁니다. 확인할 땐 실패 확률을 0으로 내려 주세요."
      >
        <div className={styles.card}>
          <div className={styles.grid}>
            <Input
              label="외부 키(예약 id)"
              variant="stacked"
              value={faultKey}
              placeholder="9f1c2d3e-4a5b-6c7d-8e9f-0a1b2c3d4e5f"
              onChange={(event) => setFaultKey(event.target.value)}
            />
            <Dropdown
              label="결함 종류"
              size="medium"
              options={faultOptions}
              value={faultType}
              onSelect={setFaultType}
            />
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
          </div>
          <div className={styles.subText}>
            저장 뒤 응답 유실: 등록은 저장되고 응답만 끊깁니다. 늦게 성공: 정한
            시간만큼 기다린 뒤 정상 처리합니다.
          </div>
          {fault.isError && (
            <InlineAlert status="error">
              {getErrorMessage(fault.error, '결함을 걸지 못했습니다.')}
            </InlineAlert>
          )}
          <Button
            size="small"
            className={styles.action}
            disabled={!faultOk || fault.isPending}
            onClick={injectFault}
          >
            결함 걸기
          </Button>
        </div>
      </FormSection>

      <FormSection
        title="원장 초기화"
        description="부하 시험이나 시연을 다시 시작하기 전에 원장을 비웁니다. 설정은 그대로입니다."
      >
        <div className={styles.card}>
          <Input
            label={`확인을 위해 ${RESET_WORD}를 입력하세요`}
            variant="stacked"
            value={resetWord}
            onChange={(event) => setResetWord(event.target.value)}
          />
          {reset.isError && (
            <InlineAlert status="error">
              {getErrorMessage(reset.error, '원장을 지우지 못했습니다.')}
            </InlineAlert>
          )}
          <Button
            size="small"
            variant="outline"
            color="cancel"
            className={styles.action}
            disabled={resetWord !== RESET_WORD || reset.isPending}
            onClick={confirmReset}
          >
            원장 모두 지우기
          </Button>
        </div>
      </FormSection>
    </div>
  )
}
