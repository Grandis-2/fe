// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수를 내보내면 signal 취소·
// 4xx 재시도 차단을 건너뛰는 길이 열린다.
export {
  useDeadLetter,
  useDeadLetters,
  useDiscardDeadLetter,
  useRedriveDeadLetter,
  useRedriveDeadLetters,
} from './api/useAdminDeadLetters'
export {
  DEAD_LETTER_DISCARD_NOTE_MAX,
  deadLetterEventLabel,
  deadLetterEventTypes,
  deadLetterFailureReasonLabel,
  deadLetterFailureReasons,
  deadLetterStatusColor,
  deadLetterStatuses,
  deadLetterStatusLabel,
  deadLetterStatusLabels,
  isRedriveInFlight,
} from './model/types'
export type {
  DeadLetter,
  DeadLetterFailureReason,
  DeadLetterRecord,
  DeadLetterStatus,
} from './model/types'
