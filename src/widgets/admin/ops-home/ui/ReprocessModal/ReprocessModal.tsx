import type { ReactNode } from 'react'

import { ChevronRight, CircleCheck, Clock, TriangleAlert } from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { errorCodeMeaning } from '@entities/admin-reservation'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { adminReservationsPath } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { Button, InlineAlert, Modal } from '@shared/ui'

import * as styles from './ReprocessModal.css'

import type {
  ReprocessProgress,
  ReprocessRun,
} from '../../lib/reprocessProgress'

// 일괄 재처리의 서버 기본 속도(명세 ratePerSecond 기본 20) — 보내기 전 예상 시간에만 쓴다.
const REPROCESS_RATE = 20
// 실패 원인은 많은 순으로 이만큼만 보이고 나머지는 '그 외'로 묶는다.
const CAUSES_SHOWN = 4

type ReprocessCause = { errorCode: string; count: number }

export type ReprocessModalProps = {
  open: boolean
  onClose: () => void
  /** 고른 사전예약 이름. 전체면 null */
  scopeName: string | null
  /** 재처리할 외부 등록 실패 건수 */
  failures: number
  /** 사전예약별 실패 — 전체를 볼 때 두 곳 이상이면 나눠 보인다 */
  breakdown: readonly { name: string; count: number }[]
  /** 재처리할 실패(DEAD_LETTER)의 마지막 오류 코드별 수. 받는 중이면 undefined */
  causes: readonly ReprocessCause[] | undefined
  /** 실패 원인을 받지 못했다 — 재처리는 그대로 할 수 있다 */
  causesFailed: boolean
  run: ReprocessRun | null
  running: ReprocessProgress | null
  result: ReprocessProgress | null
  isPending: boolean
  error: unknown
  onConfirm: () => void
  /** 예약 현황의 재처리 필요 탭(고른 사전예약 그대로) */
  reservationsPath: string
}

const isNothingToReprocess = (error: unknown) =>
  error instanceof ApiRequestError &&
  error.error.code === 'NOTHING_TO_REPROCESS'

/**
 * 운영 대시보드에서 바로 하는 외부 등록 재처리 — 확인 → 진행 → 결과가 한 창에서 바뀐다.
 * 확인 단계에서 왜 실패했는지(마지막 오류 코드별 건수)를 같이 보여, 외부가 아직 내려가
 * 있는데 다시 보내는 일을 줄인다.
 */
export function ReprocessModal({
  open,
  onClose,
  scopeName,
  failures,
  breakdown,
  causes,
  causesFailed,
  run,
  running,
  result,
  isPending,
  error,
  onConfirm,
  reservationsPath,
}: ReprocessModalProps) {
  const navigate = useNavigate()
  const modal = { open, onClose, theme: 'light' } as const

  if (run && result) {
    // 서버가 센 결과(outcome)가 있으면 그대로, 없으면 재처리 필요가 얼마나 줄었는지만 보여 준다.
    const {
      deadLetterAtStart: before,
      deadLetterNow: now,
      reduced,
      outcome,
      timedOut,
    } = result
    const reservationsOfScope = adminReservationsPath(
      'REPROCESS_NEEDED',
      run.scope ?? undefined,
    )
    const showResults = () => {
      onClose()
      navigate(reservationsOfScope)
    }
    const rows: (readonly [string, number | null])[] = outcome
      ? [
          ['요청한 건수', run.target],
          ['외부 등록 성공', outcome.succeeded],
          ['다시 실패', outcome.failed],
          ...(outcome.canceled + outcome.unsent > 0
            ? [
                [
                  '취소·상태 변경으로 빠짐',
                  outcome.canceled + outcome.unsent,
                ] as const,
              ]
            : []),
        ]
      : [
          ['요청한 건수', run.target],
          ['재처리 필요 (시작 전)', before],
          ['재처리 필요 (지금)', now],
          ['줄어든 건수', reduced],
        ]
    return (
      <Modal
        {...modal}
        title={
          timedOut ? (
            <Headline tone="warning">진행을 끝까지 확인하지 못했어요</Headline>
          ) : (
            <Headline tone="success">재처리 요청을 마쳤어요</Headline>
          )
        }
        description={
          timedOut
            ? '예상보다 오래 걸려 진행 확인을 멈췄어요. 서버는 계속 보내고 있을 수 있어요 — 결과는 예약 현황의 재처리 필요 탭에서 확인해 주세요.'
            : '외부 등록 결과는 예약 현황의 재처리 필요 탭에서 확인해 주세요.'
        }
      >
        <dl className={styles.box}>
          {rows.map(([label, value]) => (
            <div key={label} className={styles.row}>
              <dt>{label}</dt>
              <dd className={styles.value}>
                {value === null ? '—' : `${formatNumber(value)}건`}
              </dd>
            </div>
          ))}
        </dl>
        {outcome && outcome.failed > 0 && (
          <InlineAlert status="warning">
            다시 실패한 {formatNumber(outcome.failed)}건은 외부 예약 시스템이
            계속 거절하는 것일 수 있어요. 예약 현황에서 실패 사유를 확인해
            주세요.
          </InlineAlert>
        )}
        {!outcome && reduced === 0 && (
          <InlineAlert status="info">
            아직 줄지 않았어요. 외부 등록이 계속 실패하는 것일 수 있어요.
          </InlineAlert>
        )}
        <div className={styles.actions}>
          <Button onClick={onClose}>확인</Button>
          <Button variant="outline" color="cancel" onClick={showResults}>
            예약 현황에서 확인
          </Button>
        </div>
      </Modal>
    )
  }

  if (run && running) {
    const ratio = run.target > 0 ? running.sent / run.target : 1
    return (
      <Modal {...modal} title="재처리하는 중이에요">
        <div className={styles.big} role="status" aria-live="polite">
          <span className={styles.bigValue}>{formatNumber(running.sent)}</span>
          <span className={styles.bigTotal}>
            / {formatNumber(run.target)}건
          </span>
        </div>
        <div className={styles.progress}>
          <div
            className={styles.bar}
            role="progressbar"
            aria-label="재처리 진행"
            aria-valuemin={0}
            aria-valuemax={run.target}
            aria-valuenow={running.sent}
          >
            <span
              className={styles.barFill}
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
          <div className={styles.progressMeta}>
            <span>
              {run.skipped > 0
                ? `${formatNumber(run.skipped)}건은 이미 처리돼 건너뜀`
                : '차례로 보내는 중'}
            </span>
            <span>
              {running.remainingSeconds > 0
                ? `약 ${running.remainingSeconds}초 남음`
                : '결과 확인 중'}
            </span>
          </div>
        </div>
        <InlineAlert status="info">
          창을 닫아도 서버에서 계속 진행돼요. 진행 상황은 긴급 카드에서 볼 수
          있어요.
        </InlineAlert>
        <div className={styles.actions}>
          <Button variant="outline" color="cancel" onClick={onClose}>
            닫기
          </Button>
        </div>
      </Modal>
    )
  }

  // 다른 관리자가 먼저 재처리했다 — 오류가 아니라 안내로 보인다.
  if (isNothingToReprocess(error)) {
    return (
      <Modal
        {...modal}
        title="재처리할 예약이 없어요"
        description="그 사이 처리됐거나 상태가 바뀌었어요."
      >
        <div className={styles.actions}>
          <Button onClick={onClose}>확인</Button>
        </div>
      </Modal>
    )
  }

  const seconds = Math.max(1, Math.ceil(failures / REPROCESS_RATE))
  return (
    <Modal
      {...modal}
      title={`${scopeName ? `${scopeName} ` : ''}외부 등록 실패 ${formatNumber(failures)}건을 재처리할까요?`}
      description="결제를 못 하고 있는 예약을 외부 예약 시스템에 다시 등록합니다."
    >
      {breakdown.length > 1 && (
        <dl className={styles.box}>
          <span className={styles.boxTitle}>사전예약별</span>
          {breakdown.map(({ name, count }) => (
            <div key={name} className={styles.row}>
              <dt>{name}</dt>
              <dd className={styles.value}>{formatNumber(count)}건</dd>
            </div>
          ))}
        </dl>
      )}
      <ReprocessCauses
        causes={causes}
        failed={causesFailed}
        // 원인은 사전예약별로 나눠 받을 수 없다(서버 조건 없음) — 고른 사전예약이 있어도 전체다.
        scoped={scopeName !== null}
      />
      <div className={styles.meta}>
        <Clock className={styles.metaIcon} aria-hidden="true" />
        초당 {REPROCESS_RATE}건씩 차례로 보내요 · 약 {seconds}초
      </div>
      {error !== null && (
        // 자동으로 다시 보내지 않는다 — 같은 요청이 두 번 반영될 수 있다.
        <InlineAlert status="error">
          {getErrorMessage(error, '재처리를 요청하지 못했어요.')} 잠시 뒤 다시
          시도해 주세요.
        </InlineAlert>
      )}
      <div className={styles.actions}>
        <Button disabled={isPending || failures === 0} onClick={onConfirm}>
          {isPending
            ? '보내는 중…'
            : error !== null
              ? '다시 시도'
              : `${formatNumber(failures)}건 재처리`}
        </Button>
        <Button variant="outline" color="cancel" onClick={onClose}>
          취소
        </Button>
      </div>
      <Link to={reservationsPath} className={styles.link} onClick={onClose}>
        예약 현황에서 골라서 재처리
        <ChevronRight className={styles.linkIcon} aria-hidden="true" />
      </Link>
    </Modal>
  )
}

function ReprocessCauses({
  causes,
  failed,
  scoped,
}: {
  causes: readonly ReprocessCause[] | undefined
  failed: boolean
  scoped: boolean
}) {
  const sorted = (causes ?? []).toSorted((a, b) => b.count - a.count)
  const shown = sorted.slice(0, CAUSES_SHOWN)
  const rest = sorted
    .slice(CAUSES_SHOWN)
    .reduce((sum, cause) => sum + cause.count, 0)
  const status = failed
    ? '실패 원인을 불러오지 못했어요.'
    : causes === undefined
      ? '실패 원인을 불러오는 중…'
      : sorted.length === 0
        ? '기록된 오류 코드가 없어요.'
        : null

  return (
    <dl className={styles.box}>
      <span className={styles.boxTitle}>
        실패 원인{scoped && ' · 전체 사전예약 기준'}
      </span>
      {status ? (
        <span className={styles.boxNote}>{status}</span>
      ) : (
        <>
          {shown.map(({ errorCode, count }) => (
            <div key={errorCode} className={styles.row}>
              <dt className={styles.cause}>
                {errorCodeMeaning[errorCode] ?? '알 수 없는 오류'}
                <span className={styles.causeCode}>{errorCode}</span>
              </dt>
              <dd className={styles.dangerValue}>{formatNumber(count)}건</dd>
            </div>
          ))}
          {rest > 0 && (
            <div className={styles.row}>
              <dt>그 외</dt>
              <dd className={styles.dangerValue}>{formatNumber(rest)}건</dd>
            </div>
          )}
        </>
      )}
    </dl>
  )
}

const badgeIcon = {
  success: CircleCheck,
  warning: TriangleAlert,
}

// 결과 제목 — 위에 상태 아이콘을 얹는다(Modal은 제목이 맨 위라 제목 안에 둔다).
function Headline({
  tone,
  children,
}: {
  tone: keyof typeof badgeIcon
  children: ReactNode
}) {
  const Icon = badgeIcon[tone]
  return (
    <>
      <span className={styles.badge[tone]} aria-hidden="true">
        <Icon />
      </span>
      {children}
    </>
  )
}
