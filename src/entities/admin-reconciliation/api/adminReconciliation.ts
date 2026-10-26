import { apiClient } from '@shared/api/client'
import { fetchConcatPage } from '@shared/api/fetchAllPages'
import { toQueryString } from '@shared/api/queryString'
import type {
  ReconciliationRunDiff,
  ExternalCancelBatchRequest,
  ExternalCancelBatchResponse,
  FindingCancelRequest,
  OffsetPage,
  ReconciliationFinding,
  ReconciliationFindingPage,
  ReconciliationFindingParams,
  ReconciliationRun,
  ReconciliationRunRequest,
} from '@shared/api/types'

const BASE = '/api/v1/admin/preorders/reconciliation'

// [preorder] GET /api/v1/admin/preorders/reconciliation/runs — 검사 실행 목록(최근 요청 순)
export const getReconciliationRuns = (
  size: number,
  signal?: AbortSignal,
  page = 0,
) =>
  apiClient.request<OffsetPage<ReconciliationRun>>(
    `${BASE}/runs${toQueryString({ page, size })}`,
    { signal },
  )

// [preorder] POST /api/v1/admin/preorders/reconciliation/runs — 검사 요청
/**
 * 202로 대기(REQUESTED) 실행을 준다. 이미 도는 검사가 있으면 409 RECONCILIATION_RUN_ACTIVE,
 * 오픈한 지 1시간이 안 된 상품이 있으면 409 RECONCILIATION_INTAKE_RUSH.
 */
export const startReconciliationRun = (body: ReconciliationRunRequest = {}) =>
  apiClient.request<ReconciliationRun>(`${BASE}/runs`, {
    method: 'POST',
    body,
  })

// [preorder] GET /api/v1/admin/preorders/reconciliation/runs/{runId}/diff — 두 검사 결과 비교
/** 직전 검사와 비교해 신규·잔여·해소로 나눈다. 두 검사가 완료·같은 범위여야 한다 */
export const getRunDiff = (
  runId: string,
  against: string,
  signal?: AbortSignal,
) =>
  apiClient.request<ReconciliationRunDiff>(
    `${BASE}/runs/${encodeURIComponent(runId)}/diff${toQueryString({ against })}`,
    { signal },
  )

// [preorder] GET /api/v1/admin/preorders/reconciliation/runs/{runId}/findings — 불일치 목록
const getFindings = (
  runId: string,
  params: ReconciliationFindingParams,
  signal?: AbortSignal,
) =>
  apiClient.request<ReconciliationFindingPage>(
    `${BASE}/runs/${encodeURIComponent(runId)}/findings${toQueryString(params)}`,
    { signal },
  )

export type FindingQuery = {
  /** 거를 검사 종류. 비우면 전부, 여럿이면 종류별 목록을 차례로 이어 붙인다 */
  checkCodes?: readonly string[]
  productId?: string
  page: number
  size: number
}

/**
 * 불일치 한 쪽. 서버는 검사 종류를 하나씩만 걸러서, 묶음 탭(종류 여럿)은 종류별 목록을
 * 이어 붙여 쪽을 나눈다.
 */
export const getReconciliationFindings = (
  runId: string,
  { checkCodes = [], productId, page, size }: FindingQuery,
  signal?: AbortSignal,
) =>
  checkCodes.length > 1
    ? fetchConcatPage(
        checkCodes.map(
          (checkCode) => (sourcePage: number, sourceSize: number) =>
            getFindings(
              runId,
              { checkCode, productId, page: sourcePage, size: sourceSize },
              signal,
            ),
        ),
        page,
        size,
      )
    : getFindings(
        runId,
        { checkCode: checkCodes[0], productId, page, size },
        signal,
      )

const findingAction = (findingId: string, action: string, body?: unknown) =>
  apiClient.request<ReconciliationFinding>(
    `${BASE}/findings/${encodeURIComponent(findingId)}/${action}`,
    { method: 'POST', body },
  )

// [preorder] POST /api/v1/admin/preorders/reconciliation/findings/{findingId}/external-cancel
/** 키로 외부 취소. 외부가 실패해도 200이고 결과는 actionStatus로 온다 */
export const externalCancelFinding = (findingId: string) =>
  findingAction(findingId, 'external-cancel')

// [preorder] POST /api/v1/admin/preorders/reconciliation/findings/external-cancel
/** 여러 건 외부 취소(1~100건). 건마다 따로 처리해 건별 결과를 준다 */
export const externalCancelFindings = (findingIds: string[]) =>
  apiClient.request<ExternalCancelBatchResponse>(
    `${BASE}/findings/external-cancel`,
    {
      method: 'POST',
      body: { findingIds } satisfies ExternalCancelBatchRequest,
    },
  )

// [preorder] POST /api/v1/admin/preorders/reconciliation/findings/{findingId}/reprocess
/** 등록 재처리 — 접수만 하고(REQUESTED) 실제 재등록은 서버가 이어서 한다 */
export const reprocessFinding = (findingId: string) =>
  findingAction(findingId, 'reprocess')

// [preorder] POST /api/v1/admin/preorders/reconciliation/findings/{findingId}/cancel
/** 우리 쪽 예약 취소 — 사유는 예약 이력에 남는다. 결제한 예약은 환불까지 이어진다 */
export const cancelFinding = (findingId: string, reason: string) =>
  findingAction(findingId, 'cancel', {
    reason,
  } satisfies FindingCancelRequest)
