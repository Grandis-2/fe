// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수(getAdminReservations 등)를
// 내보내면 signal 취소·폴링 백오프·4xx 재시도 차단을 건너뛰는 길이 열린다.
export {
  useAdminMembers,
  useAdminReservation,
  useAdminReservations,
  useCancelReservation,
  useReprocessFailedRegistrations,
  useReprocessReservation,
  useReprocessReservations,
  useReservationStats,
  useReservationStatsByProduct,
  useSaveReservationNote,
  useSyncJobErrorGroups,
} from './api/useAdminReservations'
export { useReservationStatsHistory } from './api/useReservationStatsHistory'
export { PartialReprocessError } from './api/adminReservation'
export { errorCodeMeaning } from './model/errorCodes'
export {
  actorLabel,
  countByStage,
  formatShipPeriod,
  preorderStatusLabel,
  RESERVATION_CANCEL_REASON_MAX,
  RESERVATION_CANCEL_REASON_MIN,
  RESERVATION_NOTE_MAX,
  syncJobStatusLabel,
  syncJobTypeLabel,
  isReprocessable,
  isPaymentDueSoon,
  paymentDueLabel,
  paymentStateColor,
  paymentStateLabel,
  paymentStateOf,
  paymentStateVariant,
  reservationNo,
  reservationStageLabel,
  reservationStateColor,
  reservationStateVariant,
  reservationStateLabel,
  reservationStateOf,
} from './model/types'
export type {
  AdminReservation,
  AdminReservationDetail,
  ReservationEvent,
  ReservationState,
  ReservationSyncJob,
} from './model/types'
