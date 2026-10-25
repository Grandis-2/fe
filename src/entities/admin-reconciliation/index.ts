// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수를 내보내면 signal 취소·
// 4xx 재시도 차단을 건너뛰는 길이 열린다.
export {
  useCancelFinding,
  useExternalCancelFinding,
  useExternalCancelFindings,
  useReconciliationFindings,
  useReconciliationRuns,
  useReprocessFinding,
  useStartReconciliationRun,
} from './api/useAdminReconciliation'
export {
  canAct,
  canBatchExternalCancel,
  codesOfGroup,
  countByGroup,
  EXTERNAL_CANCEL_BATCH_MAX,
  FINDING_CANCEL_REASON_MAX,
  findingDescription,
  findingGroupLabel,
  findingGroupOf,
  findingGroups,
  isRunActive,
} from './model/types'
export type {
  FindingGroup,
  ReconcileFinding,
  ReconcileRun,
} from './model/types'
