import { Fragment } from 'react'

import {
  deadLetterEventLabel,
  useDeadLetters,
  useRedriveDeadLetter,
  type DeadLetter,
} from '@entities/admin-dead-letter'
import {
  actorLabel,
  formatShipPeriod,
  isPaymentDueSoon,
  isReprocessable,
  paymentDueLabel,
  paymentStateOf,
  RESERVATION_CANCEL_REASON_MAX,
  RESERVATION_CANCEL_REASON_MIN,
  RESERVATION_NOTE_MAX,
  reservationNo,
  reservationStateColor,
  reservationStateVariant,
  reservationStateLabel,
  reservationStateOf,
  useAdminMembers,
  useCancelReservation,
  useReprocessReservation,
  useSaveReservationNote,
  type AdminReservationDetail as Reservation,
} from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatWon } from '@shared/lib/formatNumber'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import { Button, InlineAlert, ReasonForm, Tag } from '@shared/ui'

import { historyEntries } from '../../lib/history'
import { progressSteps } from '../../lib/progress'
import { ReservationDeadLetters } from '../ReservationDeadLetters'
import { ReservationHistory } from '../ReservationHistory'
import { ReservationNoteForm } from '../ReservationNoteForm'
import { ReservationNotice } from '../ReservationNotice'
import { ReservationProgress } from '../ReservationProgress'

import * as styles from './AdminReservationDetail.css'

export type AdminReservationDetailProps = {
  reservation: Reservation
}

const dateTimeOrDash = (iso: string | null) =>
  iso ? formatDotDateTime(iso) : '—'

/**
 * 예약 한 건의 관리 화면. 맨 위에 지금 할 일(문제가 있을 때만)과 조치, 그 아래 어디까지
 * 왔는지, 아래 두 단에 이력(넓게)과 참고 정보·메모(좁게)를 둔다. 재처리·다시 처리는 원인
 * 바로 옆에, 되돌릴 수 없는 취소는 제목 줄에 둔다.
 */
export function AdminReservationDetail({
  reservation,
}: AdminReservationDetailProps) {
  const reprocess = useReprocessReservation()
  const cancel = useCancelReservation()
  const saveNote = useSaveReservationNote()
  const { data: members } = useAdminMembers([reservation.customerId])
  // 이 예약에 반영되지 못한 처리(이벤트 DLQ). 한 예약에 몇 건 안 돼 한 번에 받는다.
  const deadLetters = useDeadLetters({
    preorderId: reservation.preorderId,
    size: 100,
  })
  const redrive = useRedriveDeadLetter()

  const state = reservationStateOf(reservation)
  const payment = paymentStateOf(reservation)
  const due =
    payment === 'PENDING' ? paymentDueLabel(reservation.paymentDueAt) : null
  const number = reservationNo(reservation.preorderId)
  const memberName = members?.find(
    (member) => member.memberId === reservation.customerId,
  )?.name
  const registerJob = reservation.syncJobs.find(
    (job) => job.jobType === 'REGISTER',
  )
  const cancelEvent = reservation.events.findLast(
    (event) => event.toStatus === 'CANCELING' || event.toStatus === 'CANCELED',
  )

  // 지난 실패 문구가 남아 있으면 이번 시도의 결과처럼 보인다.
  const resetErrors = () => {
    reprocess.reset()
    cancel.reset()
    redrive.reset()
  }

  const confirmRedrive = (item: DeadLetter) => {
    resetErrors()
    openModal({
      theme: 'light',
      title: '다시 처리할까요?',
      description: `${number}의 '${deadLetterEventLabel(item.eventType)}'을(를) 한 번 더 처리합니다. 결과는 조금 뒤에 반영됩니다.`,
      confirmLabel: '다시 처리',
      onConfirm: () => {
        closeModal()
        redrive.mutate(item.deadLetterId, {
          onSuccess: () => showToast('다시 처리를 요청했습니다.'),
        })
      },
    })
  }

  const confirmReprocess = () => {
    resetErrors()
    openModal({
      theme: 'light',
      title: '재처리를 시도할까요?',
      description: `${number}의 외부 등록을 다시 시도합니다. 결과는 조금 뒤에 반영됩니다.`,
      confirmLabel: '재처리',
      onConfirm: () => {
        closeModal()
        reprocess.mutate(reservation.preorderId, {
          onSuccess: () => showToast('외부 등록을 다시 보냈습니다.'),
        })
      },
    })
  }

  // 되돌릴 수 없고 회원에게 바로 보이는 조치라 사유를 받는다(이력에 남는다).
  const confirmCancel = () => {
    resetErrors()
    openModal({
      theme: 'light',
      title: '예약을 취소할까요?',
      description: `${number}을(를) 취소합니다. 순번에서 빠지고 되돌릴 수 없습니다.
결제를 마친 예약이면 환불이 이어서 처리됩니다.`,
      children: (
        <ReasonForm
          label="취소 사유"
          placeholder="예: 고객 요청 — 콜센터 접수 #20261008-17"
          minLength={RESERVATION_CANCEL_REASON_MIN}
          maxLength={RESERVATION_CANCEL_REASON_MAX}
          confirmLabel="예약 취소"
          onCancel={closeModal}
          onConfirm={(reason) => {
            closeModal()
            cancel.mutate(
              { preorderId: reservation.preorderId, reason },
              { onSuccess: () => showToast('예약 취소를 요청했습니다.') },
            )
          }}
        />
      ),
    })
  }

  const rows: { label: string; value: string }[] = [
    { label: '상품', value: reservation.productTitle },
    { label: '옵션', value: reservation.optionTitle },
    { label: '단가', value: formatWon(reservation.unitPrice) },
    { label: '순번', value: reservation.queuePosition.toLocaleString('ko-KR') },
    {
      label: '배송 차수',
      value: `${reservation.shipmentBatch.batchNumber}차 · ${formatShipPeriod(reservation.shipmentBatch)}`,
    },
    { label: '결제 기한', value: dateTimeOrDash(reservation.paymentDueAt) },
    { label: '외부 번호', value: reservation.externalReference ?? '—' },
  ]

  const busy = reprocess.isPending || cancel.isPending || redrive.isPending
  // 0건과 조회 실패를 구분한다 — 실패를 '없음'으로 보이면 멈춘 결제를 놓친다.
  const deadLetterItems = deadLetters.data?.items ?? []
  const deadLetterError = pollingError(deadLetters)

  return (
    <div className={styles.root}>
      <div className={styles.titleRow}>
        <h1 className={styles.title}>{number}</h1>
        <Tag
          variant={reservationStateVariant[state]}
          size="medium"
          rounded={false}
          color={reservationStateColor[state]}
        >
          {reservationStateLabel[state]}
        </Tag>
        <span className={styles.summary}>
          {[
            memberName,
            `${reservation.productTitle} ${reservation.optionTitle}`,
            `순번 ${reservation.queuePosition.toLocaleString('ko-KR')}`,
          ]
            .filter(Boolean)
            .join(' · ')}
        </span>

        {reservation.cancelable && (
          <div className={styles.actions}>
            <Button
              size="small"
              variant="outline"
              color="cancel"
              disabled={busy}
              onClick={confirmCancel}
            >
              예약 취소
            </Button>
          </div>
        )}
      </div>

      {reprocess.isError && (
        <InlineAlert status="error">
          {getErrorMessage(reprocess.error, '재처리에 실패했습니다.')}
        </InlineAlert>
      )}
      {cancel.isError && (
        <InlineAlert status="error">
          {getErrorMessage(cancel.error, '예약을 취소하지 못했습니다.')}
        </InlineAlert>
      )}

      {/* 지금 할 일 — 문제가 있을 때만 나온다. 빨강은 눌러야 하는 것, 주황은 알아 둘 것,
          회색은 상황 설명이다. */}
      {isReprocessable(reservation) && (
        <ReservationNotice
          tone="danger"
          title="외부 등록에 실패해 결제로 넘어가지 못하고 있어요"
          description={[
            `시도 ${registerJob?.attemptCount ?? 0}회 모두 실패`,
            registerJob?.lastErrorCode &&
              `마지막 오류 ${registerJob.lastErrorCode}`,
            registerJob?.deadLetteredAt &&
              formatDotDateTime(registerJob.deadLetteredAt),
          ]
            .filter(Boolean)
            .join(' · ')}
          action={
            <Button size="small" disabled={busy} onClick={confirmReprocess}>
              재처리
            </Button>
          }
        />
      )}

      {/* 결제했는데 반영이 안 된 것 같은 건이라 예약 정보보다 먼저 보인다. */}
      {deadLetterItems.length > 0 && (
        <ReservationNotice
          tone="danger"
          title="결제·기한 만료 같은 처리가 이 예약에 반영되지 않았어요"
          description="다시 처리를 누르면 같은 처리를 한 번 더 시도해요."
        >
          {redrive.isError && (
            <InlineAlert status="error">
              {getErrorMessage(redrive.error, '다시 처리하지 못했습니다.')}
            </InlineAlert>
          )}
          <ReservationDeadLetters
            items={deadLetterItems}
            onRedrive={confirmRedrive}
            busy={busy}
          />
        </ReservationNotice>
      )}
      {deadLetterError !== null && (
        <InlineAlert status="warning">
          {getErrorMessage(
            deadLetterError,
            '상태 반영 실패 기록을 불러오지 못했습니다.',
          )}
        </InlineAlert>
      )}

      {due && isPaymentDueSoon(reservation.paymentDueAt) && (
        <ReservationNotice
          tone="warning"
          title={`결제 기한이 ${due.replace(' 남음', '')} 남았어요`}
          description={`${dateTimeOrDash(reservation.paymentDueAt)}까지 결제하지 않으면 자동으로 취소돼요. 관리자가 할 일은 없어요.`}
        />
      )}

      {reservation.status === 'CANCELING' && (
        <ReservationNotice
          tone="info"
          title="외부 예약 시스템에 취소를 보내고 있어요"
          description="끝나면 취소로 바뀌어요. 결제를 마친 예약이면 환불이 이어서 처리돼요."
        />
      )}
      {reservation.status === 'CANCELED' && (
        <ReservationNotice
          tone="info"
          title="취소된 예약이에요"
          description={
            cancelEvent
              ? [
                  `${formatDotDateTime(cancelEvent.createdAt)} ${actorLabel[cancelEvent.actor]} 취소`,
                  cancelEvent.reason && `사유: ${cancelEvent.reason}`,
                ]
                  .filter(Boolean)
                  .join(' · ')
              : undefined
          }
        />
      )}

      <section className={styles.panel} aria-labelledby="reservation-progress">
        <h2 id="reservation-progress" className={styles.panelTitle}>
          진행
        </h2>
        <ReservationProgress steps={progressSteps(reservation)} />
      </section>

      <div className={styles.columns}>
        <section
          className={[styles.panel, styles.main].join(' ')}
          aria-labelledby="reservation-history"
        >
          <h2 id="reservation-history" className={styles.panelTitle}>
            이력
          </h2>
          <ReservationHistory
            entries={historyEntries(reservation.events, reservation.syncJobs)}
          />
        </section>

        <div className={styles.side}>
          <section className={styles.panel} aria-labelledby="reservation-info">
            <h2 id="reservation-info" className={styles.panelTitle}>
              예약 정보
            </h2>
            <dl className={styles.list}>
              {rows.map(({ label, value }) => (
                <Fragment key={label}>
                  <dt className={styles.term}>{label}</dt>
                  <dd className={styles.value}>{value}</dd>
                </Fragment>
              ))}
            </dl>
          </section>

          <section
            className={styles.panel}
            aria-labelledby="reservation-member"
          >
            <h2 id="reservation-member" className={styles.panelTitle}>
              회원
            </h2>
            <dl className={styles.list}>
              <dt className={styles.term}>이름</dt>
              <dd className={styles.value}>{memberName ?? '—'}</dd>
              <dt className={styles.term}>회원 id</dt>
              <dd className={styles.value}>{reservation.customerId}</dd>
            </dl>
          </section>

          <section className={styles.panel} aria-labelledby="reservation-note">
            <div className={styles.panelHeader}>
              <h2 id="reservation-note" className={styles.panelTitle}>
                내부 메모
              </h2>
              <span className={styles.panelNote}>
                회원에게 보이지 않아요 · 이력에 남지 않아요
              </span>
            </div>
            <ReservationNoteForm
              // 저장된 값이 바뀌면(저장 성공·다른 관리자의 수정) 입력칸을 새로 맞춘다.
              key={reservation.internalNote ?? ''}
              value={reservation.internalNote}
              maxLength={RESERVATION_NOTE_MAX}
              saving={saveNote.isPending}
              onSave={(internalNote) =>
                saveNote.mutate(
                  { preorderId: reservation.preorderId, internalNote },
                  { onSuccess: () => showToast('메모를 저장했습니다.') },
                )
              }
            />
            {saveNote.isError && (
              <InlineAlert status="error">
                {getErrorMessage(saveNote.error, '메모를 저장하지 못했습니다.')}
              </InlineAlert>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
