import type { ReactNode } from 'react'

import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Clock,
  TriangleAlert,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router'

import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { formatNumber } from '@shared/lib/formatNumber'
import { Button, InlineAlert, Modal } from '@shared/ui'

import * as styles from './ReprocessModal.css'

import type {
  ReprocessProgress,
  ReprocessRun,
} from '../../lib/reprocessProgress'

// 일괄 재처리의 서버 기본 속도(명세 ratePerSecond 기본 20) — 보내기 전 예상 시간에만 쓴다.
const REPROCESS_RATE = 20

export type ReprocessModalProps = {
  open: boolean
  onClose: () => void
  /** 고른 사전예약 이름. 전체면 null */
  scopeName: string | null
  /** 재처리할 외부 등록 실패 건수 */
  failures: number
  /** 사전예약별 실패 — 전체를 볼 때 두 곳 이상이면 나눠 보인다 */
  breakdown: readonly { name: string; count: number }[]
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
 * 실패 원인(오류 코드)은 보이지 않는다 — 외부 시스템이 준 코드라 관리자가 읽을 수 없고,
 * 다시 보낼지는 결과(또 실패한 비율)로 안내한다.
 */
export function ReprocessModal({
  open,
  onClose,
  scopeName,
  failures,
  breakdown,
  run,
  running,
  result,
  isPending,
  error,
  onConfirm,
  reservationsPath,
}: ReprocessModalProps) {
  const navigate = useNavigate()
  const showFailed = () => {
    onClose()
    navigate(reservationsPath)
  }
  const modal = { open, onClose, theme: 'light' } as const

  if (run && result) {
    if (result.failed === 0) {
      return (
        <Modal
          {...modal}
          title={
            <Headline tone="success">
              {formatNumber(run.target)}건을 모두 다시 등록했어요
            </Headline>
          }
          description="이제 회원이 결제할 수 있어요."
        >
          <div className={styles.actions}>
            <Button onClick={onClose}>확인</Button>
          </div>
        </Modal>
      )
    }
    if (result.mostlyFailed) {
      return (
        <Modal
          {...modal}
          title={
            <Headline tone="danger">
              {formatNumber(run.target)}건 중 {formatNumber(result.failed)}건이
              또 실패했어요
            </Headline>
          }
          description={
            '외부 예약 시스템에 문제가 있을 수 있어요.\n지금 다시 보내도 같은 결과일 가능성이 커요.'
          }
        >
          <dl className={styles.box}>
            <div className={styles.row}>
              <dt>다시 등록됨</dt>
              <dd className={styles.value}>
                {formatNumber(result.succeeded)}건
              </dd>
            </div>
            <div className={styles.row}>
              <dt>또 실패</dt>
              <dd className={styles.dangerValue}>
                {formatNumber(result.failed)}건
              </dd>
            </div>
          </dl>
          <InlineAlert status="info">
            개발팀에 알려 주세요. 외부 시스템이 복구되면 그때 다시 재처리하면
            돼요.
          </InlineAlert>
          {/* 주된 버튼은 닫기 — 바로 다시 재처리하도록 이끌지 않는다. */}
          <div className={styles.actions}>
            <Button onClick={onClose}>확인</Button>
            <Button variant="outline" color="cancel" onClick={showFailed}>
              실패한 {formatNumber(result.failed)}건 보기
            </Button>
          </div>
        </Modal>
      )
    }
    return (
      <Modal
        {...modal}
        title={
          <Headline tone="warning">
            {formatNumber(result.succeeded)}건을 다시 등록했어요
          </Headline>
        }
        description={`${formatNumber(result.failed)}건은 또 실패했어요.\n예약 현황에서 하나씩 확인해 주세요.`}
        confirmLabel={`실패한 ${formatNumber(result.failed)}건 보기`}
        onConfirm={showFailed}
        cancelLabel="닫기"
      />
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
            ? '요청 중…'
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

const badgeIcon = {
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
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
