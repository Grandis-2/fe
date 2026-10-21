import {
  deadLetterEventLabel,
  useDeadLetters,
  useRedriveDeadLetter,
  type DeadLetter,
} from '@entities/admin-dead-letter'
import {
  formatShipPeriod,
  isReprocessable,
  paymentDueLabel,
  paymentStateColor,
  paymentStateLabel,
  paymentStateOf,
  paymentStateVariant,
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
import { Button, FormSection, InlineAlert, ReasonForm, Tag } from '@shared/ui'

import { ReservationDeadLetters } from '../ReservationDeadLetters'
import { ReservationNoteForm } from '../ReservationNoteForm'
import { ReservationSyncJobs } from '../ReservationSyncJobs'
import { ReservationTimeline } from '../ReservationTimeline'

import * as styles from './AdminReservationDetail.css'

export type AdminReservationDetailProps = {
  reservation: Reservation
}

const dateTimeOrDash = (iso: string | null) =>
  iso ? formatDotDateTime(iso) : '—'

/**
 * 예약 한 건의 관리 화면. 재처리·취소는 누르면 바로 서버에 반영되는 조치라 제목 줄에
 * 두고, 메모는 저장 버튼으로 따로 보낸다.
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
    { label: '모델', value: reservation.productTitle },
    { label: '옵션', value: reservation.optionTitle },
    { label: '단가', value: formatWon(reservation.unitPrice) },
    { label: '순번', value: reservation.queuePosition.toLocaleString('ko-KR') },
    {
      label: '배송 차수',
      value: `${reservation.shipmentBatch.batchNumber}차 · ${formatShipPeriod(reservation.shipmentBatch)}`,
    },
    { label: '접수 시각', value: formatDotDateTime(reservation.createdAt) },
    { label: '결제 기한', value: dateTimeOrDash(reservation.paymentDueAt) },
    { label: '예약 확정', value: dateTimeOrDash(reservation.reservedAt) },
    { label: '외부 예약번호', value: reservation.externalReference ?? '—' },
  ]

  const busy = reprocess.isPending || cancel.isPending || redrive.isPending
  // 0건과 조회 실패를 구분한다 — 실패를 '없음'으로 보이면 멈춘 결제를 놓친다.
  const deadLetterItems = deadLetters.data?.items ?? []

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
        {payment && (
          <Tag
            variant={paymentStateVariant[payment]}
            size="medium"
            rounded={false}
            color={paymentStateColor[payment]}
          >
            {paymentStateLabel[payment]}
          </Tag>
        )}
        {due && <span className={styles.due}>{due}</span>}

        <div className={styles.actions}>
          {isReprocessable(reservation) && (
            <Button size="small" disabled={busy} onClick={confirmReprocess}>
              재처리
            </Button>
          )}
          {reservation.cancelable && (
            <Button
              size="small"
              variant="outline"
              color="cancel"
              disabled={busy}
              onClick={confirmCancel}
            >
              예약 취소
            </Button>
          )}
        </div>
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

      {/* 결제했는데 반영이 안 된 것 같은 건이라 예약 정보보다 먼저 보인다. 없으면 숨긴다. */}
      {(deadLetterItems.length > 0 || pollingError(deadLetters) !== null) && (
        <FormSection
          title="상태 반영 실패"
          description="결제·기한 만료 같은 처리가 이 예약에 반영되지 않은 기록입니다. 다시 처리를 누르면 같은 처리를 한 번 더 시도합니다."
        >
          <div className={styles.card}>
            {pollingError(deadLetters) !== null && (
              <InlineAlert status="warning">
                {getErrorMessage(
                  pollingError(deadLetters),
                  '상태 반영 실패 기록을 불러오지 못했습니다.',
                )}
              </InlineAlert>
            )}
            {redrive.isError && (
              <InlineAlert status="error">
                {getErrorMessage(redrive.error, '다시 처리하지 못했습니다.')}
              </InlineAlert>
            )}
            {deadLetterItems.length > 0 && (
              <ReservationDeadLetters
                items={deadLetterItems}
                onRedrive={confirmRedrive}
                busy={busy}
              />
            )}
          </div>
        </FormSection>
      )}

      <div className={styles.cards}>
        <FormSection title="예약 정보">
          <dl className={styles.card}>
            {rows.map(({ label, value }) => (
              <div key={label} className={styles.row}>
                <dt className={styles.term}>{label}</dt>
                <dd className={styles.value}>{value}</dd>
              </div>
            ))}
          </dl>
        </FormSection>

        <FormSection title="회원">
          <dl className={styles.card}>
            <div className={styles.row}>
              <dt className={styles.term}>이름</dt>
              <dd className={styles.value}>{memberName ?? '—'}</dd>
            </div>
            <div className={styles.row}>
              <dt className={styles.term}>회원 id</dt>
              <dd className={styles.value}>{reservation.customerId}</dd>
            </div>
          </dl>
        </FormSection>
      </div>

      <FormSection
        title="내부 메모"
        description="회원에게는 보이지 않습니다. 저장해도 상태 이력에는 남지 않습니다."
      >
        <div className={styles.card}>
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
        </div>
      </FormSection>

      <FormSection title="상태 이력">
        <div className={styles.card}>
          <ReservationTimeline events={reservation.events} />
        </div>
      </FormSection>

      <FormSection
        title="외부 연동 기록"
        description="외부 예약 시스템에 등록·취소를 보낸 기록입니다."
      >
        <div className={styles.card}>
          <ReservationSyncJobs jobs={reservation.syncJobs} />
        </div>
      </FormSection>
    </div>
  )
}
