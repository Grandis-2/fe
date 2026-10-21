import {
  actorLabel,
  isPaymentDueSoon,
  isReprocessable,
  paymentDueLabel,
  paymentStateOf,
  type AdminReservationDetail,
  type ReservationSyncJob,
} from '@entities/admin-reservation'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import type { ProgressStep } from '@shared/ui'

/** 작업이 마지막으로 움직인 시각 — 끝난 시도가 있으면 그 시각 */
const lastAt = (job: ReservationSyncJob) => {
  const last = job.attempts.at(-1)
  return last?.finishedAt ?? last?.startedAt ?? job.updatedAt
}

const registerStep = (reservation: AdminReservationDetail): ProgressStep => {
  const job = reservation.syncJobs.find((item) => item.jobType === 'REGISTER')
  const attempts = job?.attemptCount ?? 0
  if (reservation.status !== 'PENDING_SYNC') {
    return {
      key: 'register',
      label: '외부 등록',
      detail: job ? formatDotDateTime(lastAt(job)) : '—',
      tone: 'done',
    }
  }
  return isReprocessable(reservation)
    ? {
        key: 'register',
        label: '외부 등록 · 실패',
        detail: `시도 ${attempts}회 · 재처리 필요`,
        tone: 'stuck',
      }
    : {
        key: 'register',
        label: '외부 등록 · 진행 중',
        detail: attempts > 0 ? `시도 ${attempts}회째` : '곧 보내요',
        tone: 'now',
      }
}

const paymentStep = (
  reservation: AdminReservationDetail,
  now: number,
): ProgressStep => {
  const payment = paymentStateOf(reservation)
  const key = 'payment'
  if (payment === 'PAID') {
    return { key, label: '결제 완료', detail: '—', tone: 'done' }
  }
  if (payment === 'IN_PROGRESS') {
    return { key, label: '결제 중', detail: '회원이 결제하는 중', tone: 'now' }
  }
  if (payment === 'PENDING' && reservation.paymentDueAt) {
    const left = paymentDueLabel(reservation.paymentDueAt, now) ?? '기한 지남'
    return {
      key,
      label: '결제 대기',
      detail: `${left} · ${formatDotDateTime(reservation.paymentDueAt)}까지`,
      tone: isPaymentDueSoon(reservation.paymentDueAt, now) ? 'warn' : 'now',
    }
  }
  return { key, label: '결제', detail: '등록 뒤 24시간 안', tone: 'todo' }
}

/**
 * 예약이 어디까지 왔는지 네 칸으로. 취소된(취소 중인) 예약은 결제·확정 대신 취소 흐름을
 * 보여준다 — 오지 않을 결제 칸을 남기면 앞으로 결제될 예약처럼 읽힌다.
 */
export function progressSteps(
  reservation: AdminReservationDetail,
  now = Date.now(),
): ProgressStep[] {
  const received: ProgressStep = {
    key: 'received',
    label: '접수',
    detail: formatDotDateTime(reservation.createdAt),
    tone: 'done',
  }

  if (reservation.status === 'CANCELING' || reservation.status === 'CANCELED') {
    const request = reservation.events.findLast(
      (event) =>
        event.toStatus === 'CANCELING' || event.toStatus === 'CANCELED',
    )
    const job = reservation.syncJobs.find((item) => item.jobType === 'CANCEL')
    const canceled = reservation.status === 'CANCELED'
    // 외부에 등록되기 전에 취소됐으면 외부에 보낼 취소가 없다.
    const externalCancel: ProgressStep = !job
      ? {
          key: 'cancel',
          label: '외부 취소',
          detail: '보낼 필요 없음',
          tone: 'done',
        }
      : canceled || job.status === 'SUCCEEDED'
        ? {
            key: 'cancel',
            label: '외부 취소',
            detail: formatDotDateTime(lastAt(job)),
            tone: 'done',
          }
        : job.status === 'DEAD_LETTER'
          ? {
              key: 'cancel',
              label: '외부 취소 · 실패',
              detail: `시도 ${job.attemptCount}회 · 개발팀 문의`,
              tone: 'stuck',
            }
          : {
              key: 'cancel',
              label: '외부 취소 · 진행 중',
              detail: `시도 ${job.attemptCount}회째`,
              tone: 'now',
            }
    return [
      received,
      {
        key: 'register',
        label: '외부 등록',
        detail: reservation.externalReference ? '완료' : '등록 전 취소',
        tone: 'done',
      },
      {
        key: 'request',
        label: '취소 요청',
        detail: request
          ? `${formatDotDateTime(request.createdAt)} · ${actorLabel[request.actor]}`
          : '—',
        tone: 'done',
      },
      externalCancel,
    ]
  }

  return [
    received,
    registerStep(reservation),
    paymentStep(reservation, now),
    reservation.reservedAt
      ? {
          key: 'reserved',
          label: '예약 확정',
          detail: formatDotDateTime(reservation.reservedAt),
          tone: 'done',
        }
      : { key: 'reserved', label: '예약 확정', detail: '—', tone: 'todo' },
  ]
}
