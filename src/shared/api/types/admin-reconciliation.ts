import type { OffsetPage } from './admin-reservation'

// 외부 예약 대조(preorder 서비스 — api-docs의 preorder.json, /api/v1/admin/preorders/reconciliation).
// 서버가 우리 예약과 외부 예약 시스템 기록을 맞춰 보는 검사(실행)를 돌리고, 어긋난 건(불일치)을
// 검사 종류(checkCode)별로 남긴다. 매일 정기 검사가 돌고 관리자가 따로 요청할 수도 있다.

/** REQUESTED 대기 · RUNNING 검사 중 · COMPLETED 완료 · FAILED 실패 */
export type ReconciliationRunStatus =
  'REQUESTED' | 'RUNNING' | 'COMPLETED' | 'FAILED'

/** 대기·검사 중이면 null. FAILED는 UNDETERMINED(판정 불가) */
export type ReconciliationVerdict = 'MATCHED' | 'MISMATCHED' | 'UNDETERMINED'

export type ProductFindingCount = {
  /** 상품을 알 수 없는 건(외부에만 있는 키 등)은 null */
  productId: string | null
  productName: string | null
  count: number
}

/** GET/POST /admin/preorders/reconciliation/runs — 검사 실행 하나 */
export type ReconciliationRun = {
  runId: string
  status: ReconciliationRunStatus
  verdict: ReconciliationVerdict | null
  /** 요청한 관리자. 정기 검사면 null */
  requestedBy: string | null
  /** 검사 범위. null이면 전체 */
  productId: string | null
  productName: string | null
  createdAt: string
  startedAt: string | null
  /** 판정 기준 시각 — 이 뒤에 바뀐 건은 판정하지 않는다(heldCount) */
  cutoffAt: string | null
  finishedAt: string | null
  errorMessage: string | null
  findingCount: number
  /** checkCode별 건수. 0인 종류는 빠진다 */
  findingCounts: Record<string, number>
  /** 상품별 건수, 많은 순 */
  findingCountsByProduct: ProductFindingCount[]
  /** 이 아래는 완료된 검사에만 온다 */
  heldCount: number | null
  pendingSyncCount: number | null
  cancelingCount: number | null
  deadLetterCount: number | null
}

/** POST /runs — productId를 빼면 전체를 검사한다 */
export type ReconciliationRunRequest = { productId?: string }

/** 조치 상태. FAILED는 키로 외부 취소에만 있고 다시 누를 수 있다 */
export type FindingActionStatus =
  'NOT_STARTED' | 'REQUESTED' | 'SUCCEEDED' | 'ALREADY_RESOLVED' | 'FAILED'

/** STOCK_ADJUST는 아직 쓰지 않는다 */
export type FindingActionType =
  'EXTERNAL_CANCEL' | 'REPROCESS' | 'ADMIN_CANCEL' | 'STOCK_ADJUST'

/** 불일치 한 건 */
export type ReconciliationFinding = {
  findingId: string
  runId: string
  /** 검사 종류. 모르는 값이 오면 수동 조사로 본다 */
  checkCode: string
  /** 대부분 예약 id. QUEUE_GAP은 상품 id */
  targetKey: string
  productId: string | null
  productName: string | null
  /** 검사 때 본 우리 예약 값 — 검사 종류마다 모양이 다르다. 외부에만 있는 건은 null */
  beSnapshot: Record<string, unknown> | null
  /** 검사 때 본 외부 기록. 외부에 없거나 우리 안의 검사면 null */
  mockSnapshot: Record<string, unknown> | null
  /** 같은 종류·대상을 처음 발견한 시각 — 오래됐으면 일시적인 건이 아니다 */
  firstDetectedAt: string
  actionStatus: FindingActionStatus
  actionType: FindingActionType | null
  actionRequestedBy: string | null
  actionRequestedAt: string | null
  /** 키로 외부 취소의 결과 메모 — 화면에 그대로 보여도 된다 */
  actionNote: string | null
}

export type ReconciliationFindingPage = OffsetPage<ReconciliationFinding>

/** GET /runs/{runId}/findings — checkCode·productId는 하나씩만 거른다 */
export type ReconciliationFindingParams = {
  checkCode?: string
  productId?: string
  page?: number
  size?: number
}

/** POST /findings/{findingId}/cancel — 예약 이력에 남는 사유(1~500자) */
export type FindingCancelRequest = { reason: string }

/** POST /findings/external-cancel — 1~100건. MOCK_ONLY는 받지 않는다 */
export type ExternalCancelBatchRequest = { findingIds: string[] }

/** 처리한 건은 finding에 결과가 오고, 시작하지 못한 건은 finding이 null이고 오류가 온다 */
export type ExternalCancelBatchItem = {
  findingId: string
  finding: ReconciliationFinding | null
  errorCode: string | null
  errorMessage: string | null
}

export type ExternalCancelBatchResponse = { items: ExternalCancelBatchItem[] }

/** 불일치를 가르는 검사 종류와 대상 — 두 검사의 같은 불일치를 짝짓는 열쇠 */
export type FindingKey = { checkCode: string; targetKey: string }

/**
 * GET /runs/{runId}/diff?against= — 두 완료된 검사(같은 범위)의 비교. 다르면 409
 * RECONCILIATION_NOT_COMPARABLE
 */
export type ReconciliationRunDiff = {
  runId: string
  againstRunId: string
  /** 신규 — 기준 검사에만 있다 */
  introduced: FindingKey[]
  /** 잔여 — 두 검사에 모두 있다 */
  persisting: FindingKey[]
  /** 해소 — 비교한 검사에만 있다(조치로 고쳐졌는지는 예약 이력에서 확인) */
  resolved: FindingKey[]
}
