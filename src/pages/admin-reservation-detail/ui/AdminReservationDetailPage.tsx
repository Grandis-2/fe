import { useCallback, useEffect, useRef, useState } from 'react'

import { useParams } from 'react-router'

import {
  failureLabelOf,
  forceFinalizeAdminReservation,
  getAdminMembers,
  getAdminReservation,
  isDeadLettered,
  putAdminReservationMemo,
  registerAttemptCountOf,
  reprocessAdminReservation,
  reservationNo,
  reservationStatusColor,
  reservationStatusLabel,
  type AdminReservationDetail,
  type AdminReservationHistoryEntry,
} from '@/entities/admin-reservation'
import { Button, InlineAlert, Table, Tag, Textarea } from '@/shared/ui'
import type { TableColumn } from '@/shared/ui'
import { AdminBreadcrumb } from '@/widgets/admin-breadcrumb'

import * as styles from './AdminReservationDetailPage.css'

const dateTimeFormatter = new Intl.DateTimeFormat('ko-KR', {
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const timeFormatter = new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
})

const actorLabel: Record<AdminReservationHistoryEntry['actorType'], string> = {
  SYSTEM: '시스템',
  ADMIN: '관리자',
  USER: '회원',
}

type MemoStatus = 'idle' | 'saving' | 'saved' | 'error'

const memoStatusLabel: Record<MemoStatus, string> = {
  idle: '',
  saving: '저장 중…',
  saved: '저장됨',
  error: '저장하지 못했습니다. 잠시 후 다시 입력해 주세요.',
}

// 타이핑이 멈추고 이만큼 지나면 저장한다. 글자마다 보내면 요청이 너무 잦고,
// 너무 길면 화면을 떠날 때 못 보낸 내용이 많아진다.
const MEMO_SAVE_DELAY_MS = 800

export function AdminReservationDetailPage() {
  const { reservationId = '' } = useParams()

  const [detail, setDetail] = useState<AdminReservationDetail>()
  const [memberName, setMemberName] = useState<string>()
  const [memo, setMemo] = useState('')
  const [memoStatus, setMemoStatus] = useState<MemoStatus>('idle')
  const [error, setError] = useState<string>()

  // 저장 판단은 렌더와 무관하게 최신 값으로 해야 해서 ref로 들고 간다 —
  // 특히 화면을 떠날 때(cleanup)는 state가 이미 과거 값일 수 있다.
  const memoRef = useRef('')
  const savedMemoRef = useRef('')

  useEffect(() => {
    let cancelled = false

    Promise.all([getAdminReservation(reservationId), getAdminMembers()])
      .then(([loaded, members]) => {
        if (cancelled) return
        setDetail(loaded)
        setMemo(loaded.memo ?? '')
        memoRef.current = loaded.memo ?? ''
        savedMemoRef.current = loaded.memo ?? ''
        setMemoStatus('idle')
        setMemberName(
          members.items.find((member) => member.memberId === loaded.memberId)
            ?.name,
        )
        setError(undefined)
      })
      .catch((cause: Error) => {
        if (!cancelled) setError(cause.message)
      })

    return () => {
      cancelled = true
    }
  }, [reservationId])

  const applyResult = (updated: AdminReservationDetail) => {
    setDetail(updated)
    setError(undefined)
  }

  const runAction = (action: (id: string) => Promise<AdminReservationDetail>) =>
    void action(reservationId)
      .then(applyResult)
      .catch((cause: Error) => setError(cause.message))

  /** 마지막으로 저장된 값과 다를 때만 보낸다 */
  const saveMemo = useCallback(() => {
    const next = memoRef.current.trim()
    if (next === savedMemoRef.current.trim()) return

    setMemoStatus('saving')
    return putAdminReservationMemo(reservationId, next || null)
      .then((updated) => {
        savedMemoRef.current = next
        setDetail(updated)
        setMemoStatus('saved')
      })
      .catch(() => setMemoStatus('error'))
  }, [reservationId])

  // 타이핑이 멈추면 저장한다.
  useEffect(() => {
    if (memo === savedMemoRef.current) return
    const timer = setTimeout(saveMemo, MEMO_SAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [memo, saveMemo])

  // 화면을 떠날 때 아직 못 보낸 내용이 있으면 마지막으로 한 번 더 보낸다.
  // 이때는 결과를 보여줄 화면이 없으므로, 포커스가 빠질 때도 같이 저장해서
  // 실패를 알아차릴 기회를 먼저 준다.
  useEffect(() => () => void saveMemo(), [saveMemo])

  if (!detail) {
    return (
      <div className={styles.notFound}>
        <div>{error ?? '예약을 불러오는 중입니다.'}</div>
        <AdminBreadcrumb
          items={[{ label: '예약 현황으로 돌아가기', to: '/admin/orders' }]}
        />
      </div>
    )
  }

  const displayNo = reservationNo(detail.reservationId)
  // 명세에 재처리/강제 종결 조건이 따로 없어, 확정 실패이거나 지시가 DLQ로
  // 떨어진 경우에만 연다(와이어프레임의 안내 문구와 같은 기준).
  const actionable = detail.status === 'FAILED' || isDeadLettered(detail)

  const summaryItems = [
    { label: '신청자', value: memberName ?? detail.memberId },
    {
      label: '모델 / 옵션',
      value: `${detail.productName} / ${detail.optionName}`,
    },
    {
      label: '접수 순번',
      value: `${detail.acceptSeq.toLocaleString('ko-KR')}번`,
    },
    {
      label: '접수 시각',
      value: dateTimeFormatter.format(new Date(detail.acceptedAt)),
    },
    { label: '실패 사유', value: failureLabelOf(detail) ?? '—' },
    { label: '시도 횟수', value: `${registerAttemptCountOf(detail)}회` },
  ]

  const historyColumns: TableColumn<AdminReservationHistoryEntry>[] = [
    {
      key: 'at',
      header: '시각',
      align: 'center',
      render: (entry) => timeFormatter.format(new Date(entry.committedAt)),
    },
    {
      key: 'transition',
      header: '전이',
      align: 'center',
      render: (entry) =>
        entry.note ??
        `${entry.fromStatus ? reservationStatusLabel[entry.fromStatus] : '접수'} → ${reservationStatusLabel[entry.toStatus]}`,
    },
    {
      key: 'actor',
      header: '수행 주체',
      align: 'center',
      render: (entry) => actorLabel[entry.actorType],
    },
  ]

  return (
    <div className={styles.root}>
      <AdminBreadcrumb
        items={[
          { label: '예약 현황', to: '/admin/orders' },
          { label: displayNo },
        ]}
      />

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{displayNo}</h1>
        <Tag
          variant="outline"
          size="medium"
          rounded={false}
          color={reservationStatusColor[detail.status]}
        >
          {reservationStatusLabel[detail.status]}
        </Tag>
      </div>

      {error && <InlineAlert status="error">{error}</InlineAlert>}

      <div className={styles.card}>
        <div className={styles.summaryGrid}>
          {summaryItems.map(({ label, value }) => (
            <div key={label} className={styles.summaryItem}>
              <div className={styles.summaryLabel}>{label}</div>
              <div className={styles.summaryValue}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actionsCard}>
        <div>
          <div className={styles.sectionTitle}>허용된 작업</div>
          <div className={styles.sectionDescription}>
            확정 실패 / DLQ 상태에서만 아래 조치를 실행할 수 있습니다.
          </div>
        </div>
        <div className={styles.actionButtons}>
          <Button
            size="medium"
            disabled={!actionable}
            onClick={() => runAction(reprocessAdminReservation)}
          >
            재처리 시도
          </Button>
          <Button
            size="medium"
            variant="outline"
            color="cancel"
            disabled={!actionable}
            onClick={() => runAction(forceFinalizeAdminReservation)}
          >
            강제 종결
          </Button>
        </div>
      </div>

      <div className={styles.memoSection}>
        <div className={styles.memoHeader}>
          <div className={styles.sectionTitle}>내부 메모</div>
          <span
            className={
              memoStatus === 'error' ? styles.memoError : styles.memoStatus
            }
            // 저장 상태가 바뀔 때만 읽어준다 — 타이핑 중에는 방해하지 않는다.
            role="status"
          >
            {memoStatusLabel[memoStatus]}
          </span>
        </div>
        <Textarea
          label="내부 메모"
          rows={2}
          placeholder="입력하면 자동으로 저장됩니다. 예약 내용 자체는 수정할 수 없습니다."
          value={memo}
          onChange={(event) => {
            setMemo(event.target.value)
            memoRef.current = event.target.value
          }}
          onBlur={() => void saveMemo()}
        />
      </div>

      <div className={styles.historySection}>
        <div className={styles.sectionTitle}>상태 전이 이력</div>
        <Table
          columns={historyColumns}
          rows={detail.history}
          rowKey={(entry) => String(entry.historySeq)}
          emptyMessage="기록된 전이가 없습니다."
        />
      </div>
    </div>
  )
}
