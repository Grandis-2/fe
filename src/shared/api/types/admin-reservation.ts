import type { Paged } from './common'
import type {
  PreorderDetail,
  PreorderEvent,
  PreorderStatus,
  PreorderSummary,
} from './preorder'

// 관리자 예약 API(preorder 서비스 — api-docs의 preorder.json, /api/v1/admin/preorders).
// 회원 예약 모양(preorder.ts)에 관리자용 필드가 더 붙는다. 사진(imageUrl)은 회원 응답에만 온다.

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
export type AdminPreorderSummary = Omit<PreorderSummary, 'imageUrl'> & {
  customerId: string
  /** 가린 회원 이름(첫 글자와 **). 회원 정보를 받지 못하면 null */
  customerName: string | null
  /** 외부 등록(REGISTER) 작업 id — 일괄 재처리의 syncJobIds에 그대로 쓴다. 작업이 없으면 null */
  registerSyncJobId: string | null
  /** 외부 등록 작업 상태. DEAD_LETTER면 재처리가 필요하다. 작업이 없으면 null */
  registerJobStatus: SyncJobStatus | null
}

/** 오프셋 페이지 — 관리자 예약 목록은 totalPages·hasNext 없이 total만 준다 */
export type OffsetPage<TItem> = Pick<
  Paged<TItem>,
  'items' | 'page' | 'size' | 'total'
>

/**
 * 목록 순서. NEWEST(기본) 최신 접수순, OLDEST 오래된 접수순, QUEUE_POSITION 순번순(productId
 * 필수), PAYMENT_DUE 결제 기한이 가까운 REGISTERED를 앞에 두고 나머지는 뒤에
 */
export type AdminPreorderSort =
  'NEWEST' | 'OLDEST' | 'QUEUE_POSITION' | 'PAYMENT_DUE'

export type AdminPreorderListParams = {
  status?: PreorderStatus
  sort?: AdminPreorderSort
  productId?: string
  registerJobStatus?: SyncJobStatus
  /** 배송 차수 — 차수 번호는 상품마다 따로라 productId와 같이 보낸다 */
  batchNumber?: number
  /** 외부 예약 번호(정확히 같은 것만) */
  externalReference?: string
  /** 접수 시각 [from, to), ISO date-time */
  from?: string
  to?: string
  /** 회원 id — 한 회원의 예약만 */
  customerId?: string
  page?: number
  /** 1~100(기본 20) */
  size?: number
}

/** 외부 호출 한 번의 기록 */
export type SyncAttempt = {
  attemptNumber: number
  /** SYSTEM은 자동 시도, ADMIN은 관리자 재처리 뒤의 시도 */
  actor: 'SYSTEM' | 'ADMIN'
  /** UNKNOWN은 응답을 못 받은 경우 */
  result: string
  httpStatus: number | null
  errorCode: string | null
  errorMessage: string | null
  startedAt: string
  finishedAt: string | null
}

/** 동기화 작업 요약(재처리 응답) */
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

/** GET /admin/preorders/sync-jobs — 1~100건씩, 최신순 */
export type AdminSyncJobListParams = {
  jobType?: SyncJobType
  status?: SyncJobStatus
  preorderId?: string
  groupByError?: boolean
  page?: number
  size?: number
}

/** 마지막 시도 오류 코드별 작업 수(groupByError=true). 시도가 없거나 성공이면 errorCode가 null */
export type SyncJobErrorGroup = { errorCode: string | null; count: number }

/** GET /admin/preorders/sync-jobs — groupByError=true일 때만 errorGroups가 배열이다 */
export type SyncJobListResponse = OffsetPage<SyncJobSummary> & {
  errorGroups: SyncJobErrorGroup[] | null
}

/** POST /admin/preorders/sync-jobs/reprocess-batch — 비우면 재처리할 수 있는 DEAD_LETTER 전체 */
export type ReprocessBatchRequest = {
  /** 최대 1000건 */
  syncJobIds?: string[]
  errorCodeFilter?: string
  /** 초당 요청 건수 1~200(기본 20) */
  ratePerSecond?: number
}

/** 일괄 재처리 시작 결과. 실제 재처리는 서버가 초당 ratePerSecond건씩 이어서 한다 */
export type BatchReprocess = {
  targetCount: number
  /** 지정한 id 중 없거나 재처리 조건 밖이라 건너뛴 수 */
  skippedCount: number
  estimatedSeconds: number
}

/** 동기화 작업 상세 — 상세 응답에는 시도 기록이 붙는다 */
export type SyncJob = SyncJobSummary & { attempts: SyncAttempt[] }

/** 관리자 예약 상세. 회원용 상세에 회원 id, 내부 메모, 동기화 작업, 상태 이력이 붙는다 */
export type AdminPreorderDetail = Omit<PreorderDetail, 'imageUrl'> & {
  customerId: string
  /** 가린 회원 이름(첫 글자와 **). 회원 정보를 받지 못하면 null */
  customerName: string | null
  /** 회원에게 보이지 않는 관리자 메모(최대 1000자). 없으면 null */
  internalNote: string | null
  syncJobs: SyncJob[]
  /** 상태 이력(번호 순) */
  events: PreorderEvent[]
}

/** POST /admin/preorders/{id}/cancel — 사유 5~500자(앞뒤 공백 제외) */
export type AdminCancelRequest = { reason: string }

/** PATCH /admin/preorders/{id} — 메모만 바꾼다. null이면 지운다 */
export type AdminNoteRequest = { internalNote: string | null }

/** 진행 중인 동기화 작업 수 — 종류 아래 상태별로 온다 */
type OpenSyncJobCounts = Record<
  'PENDING' | 'PROCESSING' | 'RETRY_SCHEDULED' | 'DEAD_LETTER',
  number
>

/**
 * GET /admin/preorders/stats — 운영 현황. 최대 5초 늦을 수 있고, 0인 칸도 빠지지
 * 않고 온다.
 */
/** 서버가 10초마다 남긴 기록의 처음·끝 차이로 잰 최근 1분 속도 */
export type StatsRates = {
  /** 초당 접수 */
  receivedPerSec: number
  /** 초당 외부 등록 대기에서 빠져나간 수(등록 완료 + 등록 전 취소) */
  registeredPerSec: number
  /** 분당 외부 등록 대기 증감. 양수면 밀린다 */
  backlogPerMin: number
  /** 실제로 잰 구간(초). 기록이 빠지면 60보다 짧다 */
  windowSeconds: number
}

export type PreorderStats = {
  productId: string | null
  /** 원장 상태별 예약 수 */
  preorders: Record<PreorderStatus, number>
  syncJobs: Record<SyncJobType, OpenSyncJobCounts>
  /** 되돌리기를 기다리는 이벤트 DLQ 메시지 */
  deadLetters: { waiting: number; oldestWaitingAt: string | null }
  /** 결제 기한이 지났는데 아직 만료 처리 전인 예약 수 */
  paymentOverdue: number
  /** 외부 등록을 기다리는 예약 중 가장 오래된 접수 시각. 재처리 필요(DEAD_LETTER)도 센다. 없으면 null */
  oldestPendingSyncAt: string | null
  /** 그중 등록 작업이 아직 도는(PENDING·PROCESSING·RETRY_SCHEDULED) 예약만의 가장 오래된 접수 시각 */
  oldestInFlightSyncAt: string | null
  /** 최근 1분 속도. 서버가 막 떴거나 접수 중이 아닌 상품이면 null */
  rates: StatsRates | null
  countedAt: string
}

/** GET /admin/preorders/stats/products 한 줄 — 운영 현황과 같은 칸에 회차 일정이 붙는다(속도는 없다) */
export type ProductStatsItem = Omit<
  PreorderStats,
  'productId' | 'countedAt' | 'rates'
> & {
  productId: string
  opensAt: string
  closesAt: string
}

/** OPEN은 접수 중 회차를 마감이 가까운 순으로, CLOSED는 마감된 회차를 최근 마감순으로 */
export type ProductStatsPhase = 'OPEN' | 'CLOSED'

export type ProductStatsPage = {
  items: ProductStatsItem[]
  /** 마지막 쪽이면 null */
  nextCursor: string | null
  countedAt: string
}
