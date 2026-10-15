import type { Paged } from './common'
import type {
  PreorderDetail,
  PreorderStatus,
  PreorderSummary,
} from './preorder'

// 관리자 예약 API(preorder 서비스 — api-docs의 preorder.json, /api/v1/admin/preorders).
// 회원 예약 모양(preorder.ts)에 관리자용 필드가 더 붙는다.

/** 외부 예약 시스템 연동 작업 상태. PROCESSING은 서버가 쓰지 않는 값이다 */
export type SyncJobStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'RETRY_SCHEDULED'
  | 'SUCCEEDED'
  | 'DEAD_LETTER'
  | 'CANCELED'

/** REGISTER는 접수 때 외부 등록, CANCEL은 취소 때 외부 취소 */
export type SyncJobType = 'REGISTER' | 'CANCEL'

/** 관리자 목록 한 줄 */
export type AdminPreorderSummary = PreorderSummary & {
  customerId: string
  /** 외부 등록 작업 상태. DEAD_LETTER면 재처리가 필요하다. 작업이 없으면 null */
  registerJobStatus: SyncJobStatus | null
}

/** 오프셋 페이지 — 관리자 예약 목록은 totalPages·hasNext 없이 total만 준다 */
export type OffsetPage<TItem> = Pick<
  Paged<TItem>,
  'items' | 'page' | 'size' | 'total'
>

export type AdminPreorderListParams = {
  status?: PreorderStatus
  productId?: string
  registerJobStatus?: SyncJobStatus
  page?: number
  /** 1~100(기본 20) */
  size?: number
}

/** 동기화 작업. 상세에만 시도 기록(attempts)이 붙지만 화면은 쓰지 않는다 */
export type SyncJobSummary = {
  syncJobId: string
  preorderId: string
  jobType: SyncJobType
  status: SyncJobStatus
  /** 외부 호출 시도 횟수. 재처리해도 이어서 센다 */
  attemptCount: number
  lastErrorCode: string | null
  deadLetteredAt: string | null
  createdAt: string
  updatedAt: string
}

/** 관리자 예약 상세. 화면은 재처리할 REGISTER 작업을 찾는 데만 쓴다 */
export type AdminPreorderDetail = PreorderDetail & {
  customerId: string
  internalNote: string | null
  syncJobs: SyncJobSummary[]
}

/** 진행 중인 동기화 작업 수 — 종류 아래 상태별로 온다 */
type OpenSyncJobCounts = Record<
  'PENDING' | 'PROCESSING' | 'RETRY_SCHEDULED' | 'DEAD_LETTER',
  number
>

/**
 * GET /admin/preorders/stats — 운영 현황. 최대 5초 늦을 수 있고, 0인 칸도 빠지지
 * 않고 온다.
 */
export type PreorderStats = {
  productId: string | null
  /** 원장 상태별 예약 수 */
  preorders: Record<PreorderStatus, number>
  syncJobs: Record<SyncJobType, OpenSyncJobCounts>
  /** 결제 기한이 지났는데 아직 만료 처리 전인 예약 수 */
  paymentOverdue: number
  countedAt: string
}

/**
 * 예약 응답엔 회원 id만 있어 이름을 따로 받는다. 가입 때 입력한 실명이고, 비어 있으면
 * 카카오 표시 이름이다(명세 예시는 '김**'처럼 가린 값이라 백엔드에 확인 중).
 */
export type AdminMember = {
  memberId: string
  name: string
}

export type AdminMemberListResponse = {
  items: AdminMember[]
}
