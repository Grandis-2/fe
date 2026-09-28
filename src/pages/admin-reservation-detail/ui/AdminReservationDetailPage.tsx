import { useEffect, useState } from 'react'

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

export function AdminReservationDetailPage() {
  const { reservationId = '' } = useParams()

  const [detail, setDetail] = useState<AdminReservationDetail>()
  const [memberName, setMemberName] = useState<string>()
  const [memo, setMemo] = useState('')
  const [memoSaved, setMemoSaved] = useState(true)
  const [error, setError] = useState<string>()

  useEffect(() => {
    let cancelled = false

    Promise.all([getAdminReservation(reservationId), getAdminMembers()])
      .then(([loaded, members]) => {
        if (cancelled) return
        setDetail(loaded)
        setMemo(loaded.memo ?? '')
        setMemoSaved(true)
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

  const saveMemo = () =>
    void putAdminReservationMemo(reservationId, memo.trim() || null)
      .then((updated) => {
        applyResult(updated)
        setMemoSaved(true)
      })
      .catch((cause: Error) => setError(cause.message))

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
        <div className={styles.sectionTitle}>허용된 작업</div>
        <div className={styles.sectionDescription}>
          확정 실패 / DLQ 상태에서만 아래 조치를 실행할 수 있습니다.
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
        <div className={styles.sectionTitle}>내부 메모</div>
        <div className={styles.memoRow}>
          <Textarea
            className={styles.memoInput}
            label="내부 메모"
            rows={2}
            placeholder="이 예약에 대한 처리 메모를 남겨주세요. 예약 내용 자체는 수정할 수 없습니다."
            value={memo}
            onChange={(event) => {
              setMemo(event.target.value)
              setMemoSaved(false)
            }}
          />
          <Button size="medium" disabled={memoSaved} onClick={saveMemo}>
            저장
          </Button>
        </div>
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
