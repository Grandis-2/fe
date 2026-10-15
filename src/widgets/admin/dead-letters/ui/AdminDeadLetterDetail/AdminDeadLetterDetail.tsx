import type { ReactNode } from 'react'

import { Link, useLocation } from 'react-router'

import {
  DEAD_LETTER_DISCARD_NOTE_MAX,
  deadLetterEventLabel,
  deadLetterFailureReasonLabel,
  deadLetterStatusColor,
  deadLetterStatusLabel,
  useDiscardDeadLetter,
  useRedriveDeadLetter,
  type DeadLetterRecord,
} from '@entities/admin-dead-letter'
import { reservationNo } from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import {
  adminDeadLetterPath,
  adminReservationPath,
  type BackTo,
} from '@shared/config/routes'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import { Button, FormSection, InlineAlert, ReasonForm, Tag } from '@shared/ui'

import * as styles from './AdminDeadLetterDetail.css'

export type AdminDeadLetterDetailProps = {
  deadLetter: DeadLetterRecord
}

const timeOrDash = (iso: string | null) => (iso ? formatDotDateTime(iso) : '—')

/** 원문은 보통 JSON이라 읽기 좋게 펼친다. 깨진 원문은 그대로 보인다 */
function formatBody(body: string): { text: string; parsed: boolean } {
  try {
    return { text: JSON.stringify(JSON.parse(body), null, 2), parsed: true }
  } catch {
    return { text: body, parsed: false }
  }
}

/**
 * 이벤트 DLQ 메시지 한 건(개발자용). 원인은 messageId로 서버 로그에서 찾고, 고친 뒤
 * 되돌리거나, 다시 처리하면 안 되는 메시지면 사유를 남기고 버린다.
 */
export function AdminDeadLetterDetail({
  deadLetter,
}: AdminDeadLetterDetailProps) {
  const location = useLocation()
  const redrive = useRedriveDeadLetter()
  const discard = useDiscardDeadLetter()
  const busy = redrive.isPending || discard.isPending
  const body = formatBody(deadLetter.body)

  // 지난 실패 문구가 남아 있으면 이번 시도의 결과처럼 보인다.
  const resetErrors = () => {
    redrive.reset()
    discard.reset()
  }

  const confirmRedrive = () => {
    resetErrors()
    openModal({
      theme: 'light',
      title: '원래 큐로 되돌릴까요?',
      description:
        '이 메시지를 다시 처리하게 합니다. 원인을 고친 뒤에 보내야 다시 실패하지 않습니다.',
      confirmLabel: '되돌리기',
      onConfirm: () => {
        closeModal()
        redrive.mutate(deadLetter.deadLetterId, {
          onSuccess: () => showToast('원래 큐로 보냈습니다.'),
        })
      },
    })
  }

  // 되돌릴 수 없는 조치라 사유를 받는다(기록에 남는다).
  const confirmDiscard = () => {
    resetErrors()
    openModal({
      theme: 'light',
      title: '메시지를 버릴까요?',
      description:
        '버리면 이 메시지가 하려던 처리는 일어나지 않고, 되돌릴 수 없습니다. 내용이 잘못됐다면 보낸 쪽에 다시 발행을 요청해 주세요.',
      children: (
        <ReasonForm
          label="버리는 이유"
          placeholder="예: 원문 손상 — 결제 서버에 재발행 요청함(#1234)"
          maxLength={DEAD_LETTER_DISCARD_NOTE_MAX}
          confirmLabel="버리기"
          onCancel={closeModal}
          onConfirm={(note) => {
            closeModal()
            discard.mutate(
              { deadLetterId: deadLetter.deadLetterId, note },
              { onSuccess: () => showToast('메시지를 버렸습니다.') },
            )
          }}
        />
      ),
    })
  }

  // 예약 상세의 '돌아가기'가 이 메시지로 오게 한다.
  const backTo: BackTo = {
    label: '이벤트 DLQ 메시지',
    to: location.pathname,
  }

  const info: { label: string; value: ReactNode }[] = [
    { label: '이벤트 종류', value: deadLetter.eventType ?? '—' },
    {
      label: '실패 이유',
      value: deadLetterFailureReasonLabel[deadLetter.failureReason],
    },
    { label: '받은 횟수', value: `${deadLetter.receiveCount}회` },
    {
      label: '예약',
      value: deadLetter.preorderId ? (
        <Link
          className={styles.link}
          to={adminReservationPath(deadLetter.preorderId)}
          state={{ backTo }}
        >
          {reservationNo(deadLetter.preorderId)}
        </Link>
      ) : (
        '—'
      ),
    },
    { label: '회원 id', value: deadLetter.customerId ?? '—' },
    { label: '보낸 시각', value: timeOrDash(deadLetter.sentAt) },
    { label: '쌓인 시각', value: formatDotDateTime(deadLetter.createdAt) },
    {
      label: '이전 실패',
      value: deadLetter.redrivenFromId ? (
        <Link
          className={styles.link}
          to={adminDeadLetterPath(deadLetter.redrivenFromId)}
        >
          이전 메시지 보기
        </Link>
      ) : (
        '—'
      ),
    },
  ]

  // 서버 로그에서 찾을 때 쓰는 값들.
  const trace: { label: string; value: string }[] = [
    { label: 'messageId', value: deadLetter.messageId },
    { label: 'eventId', value: deadLetter.eventId ?? '—' },
    { label: 'sourceQueue', value: deadLetter.sourceQueue },
    {
      label: 'aggregate',
      value: deadLetter.aggregateType
        ? `${deadLetter.aggregateType} · ${deadLetter.aggregateId ?? '—'}`
        : '—',
    },
  ]

  const history: { label: string; value: string }[] = [
    {
      label: '되돌리기 요청',
      value: deadLetter.redriveRequestedBy
        ? `${deadLetter.redriveRequestedBy} · ${timeOrDash(deadLetter.redriveStartedAt)}`
        : '—',
    },
    { label: '큐로 보냄', value: timeOrDash(deadLetter.redrivenAt) },
    { label: '처리 결과', value: timeOrDash(deadLetter.outcomeAt) },
    {
      label: '버림',
      value: deadLetter.discardedBy
        ? `${deadLetter.discardedBy} · ${timeOrDash(deadLetter.discardedAt)}`
        : '—',
    },
    { label: '버린 이유', value: deadLetter.discardNote ?? '—' },
  ]

  const rows = (items: { label: string; value: ReactNode }[]) =>
    items.map(({ label, value }) => (
      <div key={label} className={styles.row}>
        <dt className={styles.term}>{label}</dt>
        <dd className={styles.value}>{value}</dd>
      </div>
    ))

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>
          {deadLetterEventLabel(deadLetter.eventType)}
        </h1>
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={deadLetterStatusColor[deadLetter.status]}
        >
          {deadLetterStatusLabel[deadLetter.status]}
        </Tag>

        <div className={styles.actions}>
          {deadLetter.redrivable && (
            <Button size="small" disabled={busy} onClick={confirmRedrive}>
              되돌리기
            </Button>
          )}
          {deadLetter.status === 'OPEN' && (
            <Button
              size="small"
              variant="outline"
              color="cancel"
              disabled={busy}
              onClick={confirmDiscard}
            >
              버리기
            </Button>
          )}
        </div>
      </div>

      {redrive.isError && (
        <InlineAlert status="error">
          {getErrorMessage(redrive.error, '되돌리지 못했습니다.')}
        </InlineAlert>
      )}
      {discard.isError && (
        <InlineAlert status="error">
          {getErrorMessage(discard.error, '버리지 못했습니다.')}
        </InlineAlert>
      )}

      <div className={styles.cards}>
        <FormSection title="메시지 정보">
          <dl className={styles.card}>{rows(info)}</dl>
        </FormSection>
        <FormSection
          title="추적 정보"
          description="서버 로그에서 실제 오류를 찾을 때 씁니다."
        >
          <dl className={styles.card}>{rows(trace)}</dl>
        </FormSection>
      </div>

      <FormSection title="처리 기록">
        <dl className={styles.card}>{rows(history)}</dl>
      </FormSection>

      <FormSection
        title="원문"
        description={
          body.parsed
            ? undefined
            : 'JSON으로 읽을 수 없는 원문이라 그대로 보여줍니다.'
        }
      >
        <pre className={styles.body}>{body.text}</pre>
      </FormSection>
    </div>
  )
}
