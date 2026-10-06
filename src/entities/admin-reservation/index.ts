// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수(getAdminReservations 등)를
// 내보내면 signal 취소·폴링 백오프·4xx 재시도 차단을 건너뛰는 길이 열린다.
export {
  useAdminMembers,
  useAdminReservations,
  useReprocessReservation,
} from './api/useAdminReservations'
export {
  countByStage,
  failureLabelOf,
  isReprocessable,
  paymentDueLabel,
  paymentStatusColor,
  paymentStatusLabel,
  paymentStatusLabels,
  paymentStatusVariant,
  reservationNo,
  reservationStageLabel,
  reservationStages,
  reservationStatusColor,
  reservationStatusLabel,
  reservationStatusLabels,
} from './model/types'
export type { AdminReservation, AdminReservationStatus } from './model/types'
