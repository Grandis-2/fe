/** 예약 상태. 화면의 '처리 중'이 ACCEPTED다 */
export type ReservationStatus = 'ACCEPTED' | 'CONFIRMED' | 'FAILED' | 'CANCELED'

/**
 * 명세의 실패 사유 enum. 다만 운영 규칙상 실제로 발생하지 않는 값이 섞여 있다 —
 * 예약 접수는 재고로 막지 않으므로 STOCK_EXHAUSTED는 나오지 않고, 등록 실패는
 * 자동 재시도 후 관리자 재처리로 풀리므로 DEADLINE_EXCEEDED도 쓰이지 않을 것으로
 * 보인다. 서버가 보낼 수 있는 값은 그대로 받아둔다.
 */
export type ReservationFailureCode =
  | 'BUSINESS_REJECTED'
  | 'STOCK_EXHAUSTED'
  | 'RETRY_EXHAUSTED'
  | 'DEADLINE_EXCEEDED'
  | 'INTEGRATION_ERROR'

export type CommandKind =
  'REGISTER' | 'CANCEL_COMPENSATION' | 'REFUND' | 'NOTIFY'

export type CommandStatus =
  'PENDING' | 'IN_PROGRESS' | 'DONE' | 'DEAD' | 'SKIPPED'

// ponytail: 명세 예시에 NOT_REQUIRED만 등장한다. 나머지 값은 추정이라
// 실제 enum을 받으면 여기부터 고친다(뱃지 색이 이 값에 달려 있다).
export type CleanupState = 'NOT_REQUIRED' | 'PENDING' | 'DONE' | 'FAILED'

export type ActorType = 'USER' | 'ADMIN' | 'SYSTEM'

// ponytail: 명세 예시에 TRANSIENT_FAILURE만 등장한다. 나머지는 추정이다.
export type AttemptOutcome =
  'SUCCESS' | 'TRANSIENT_FAILURE' | 'PERMANENT_FAILURE'

/**
 * ponytail: 명세가 payment를 내려주는데 예시가 전부 null이라 스키마를 모른다.
 * "예약하면 예약은 확정되지만 24시간 안에 결제해야 하고, 미결제는 자동취소"라는
 * 운영 규칙을 운영자가 화면에서 보려면 상태와 기한이 필요해서 최소 필드만 임시로
 * 정했다. 실제 스키마가 나오면 여기와 목 픽스처를 함께 고친다.
 */
export type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED'

export type ReservationPayment = {
  status: PaymentStatus
  /** 결제 기한 — 접수 시점 + 24시간 */
  dueAt: string
  paidAt: string | null
  amount: number
}

/** 종단 상태 이후 남은 뒷정리 — 셋 다 NOT_REQUIRED여야 완전히 끝난 것이다 */
export type ReservationCleanup = {
  externalCancel: CleanupState
  refund: CleanupState
  stockRestore: CleanupState
}

/** 목록과 상세가 공통으로 내려주는 예약 본문 */
type ReservationBase = {
  reservationId: string
  productId: string
  productName: string
  optionCode: string
  optionName: string
  quantity: number
  status: ReservationStatus
  acceptSeq: number
  // ponytail: 명세 예시가 null뿐이라 모양을 알 수 없다. 배송 차수 번호로 가정한다.
  dispatch: number | null
  externalReservationNo: string | null
  acceptedAt: string
  deadlineAt: string
  finalizedAt: string | null
  version: number
  memberId: string
  runId: string | null
  cleanup: ReservationCleanup
  /**
   * ponytail: 명세는 상세에만 payment를 준다. 목록 표에 결제 상태 열이 필요해서
   * 공통 본문으로 올렸다 — 목록 응답에도 내려달라고 백엔드에 요청해야 한다.
   */
  payment: ReservationPayment | null
}

export type ReservationSummary = ReservationBase & {
  failureCode: ReservationFailureCode | null
  /** ACCEPTED인데 deadlineAt을 넘긴 건 */
  overdue: boolean
  registerAttemptCount: number
}

// ponytail: 명세 예시가 null뿐이라 필드를 알 수 없다. 목록의 failureCode와
// 이어지도록 code만 필수로 두고 나머지는 옵셔널로 받는다.
export type ReservationFailure = {
  code: ReservationFailureCode
  message?: string | null
  occurredAt?: string | null
}

export type ReservationCommand = {
  commandId: number
  kind: CommandKind
  status: CommandStatus
  reservationId: string
  businessKey: string
  targetExternalKey: string | null
  targetExternalReservationNo: string | null
  attemptCount: number
  manualReprocessCount: number
  nextAttemptAt: string | null
  leaseUntil: string | null
  leaseOwner: string | null
  leaseToken: string | null
  reclaimCount: number
  lastErrorCode: string | null
  lastError: string | null
  createdAt: string
  updatedAt: string
}

export type ReservationHistoryEntry = {
  historySeq: number
  /** 'T1' 같은 전이 코드. 전체 목록이 명세에 없어 문자열로 받는다 */
  transition: string
  fromStatus: ReservationStatus | null
  toStatus: ReservationStatus
  actorType: ActorType
  actorId: string | null
  reasonCode: string | null
  note: string | null
  decidedAt: string
  committedAt: string
}

export type ReservationDetail = ReservationBase & {
  failure: ReservationFailure | null
  cancelable: boolean
  externalKey: string
  memo: string | null
  createdByActorType: ActorType
  createdByActorId: string
  commands: ReservationCommand[]
  // ponytail: 명세 예시가 null뿐이라 스키마를 모른다.
  stockReservation: unknown | null
  history: ReservationHistoryEntry[]
}

export type AdminReservationListParams = {
  status?: ReservationStatus
  failureCode?: ReservationFailureCode
  memberId?: string
  productId?: string
  from?: string
  to?: string
  overdueOnly?: boolean
  cleanupPendingOnly?: boolean
  runId?: string
  page?: number
  size?: number
}

export type AdminStatsResponse = {
  asOf: string
  runId: string | null
  /** true면 지표를 0으로 보여주면 안 된다 — 0건과 조회 실패는 다른 상황이다 */
  queryFailed: boolean
  accept: {
    httpRequestCount: number
    uniqueAcceptedCount: number
    idempotentReplayCount: number
    rejectedByReason: Record<string, number>
  }
  registration: {
    acceptedBacklogCount: number
    oldestAcceptedAgeSeconds: number
    overdueAcceptedCount: number
    confirmedCount: number
    failedByReason: Partial<Record<ReservationFailureCode, number>>
  }
  commands: {
    byKind: Record<
      CommandKind,
      {
        pendingCount: number
        inProgressCount: number
        retryingCount: number
        deadCount: number
      }
    >
    leaseReclaimCount: number
    pendingCompensationCount: number
  }
  reconciliation: {
    lastSuccessfulRunAt: string | null
    lastRunStatus: string
    lastTypeCounts: Record<string, number>
  }
  convergence: {
    acceptedBacklogZero: boolean
    pendingCompensationZero: boolean
    lastReconciliationClean: boolean
    notificationDeadZero: boolean
    allChecksPassed: boolean
  }
}

// ponytail: 재처리 엔드포인트는 명세에 없다. 와이어프레임의 '재처리 시도'를
// 만들려면 필요해서 같은 작명 규칙으로 임시 정의했다(handlers/admin-reservation.ts
// 의 같은 주석 참고). 백엔드 계약이 나오면 함께 고친다.

/** 예약 응답에 회원 이름이 없어서, 표의 '예약자' 열이 memberId를 이름으로 바꿀 때 쓴다 */
export type AdminMember = {
  memberId: string
  name: string
}

export type AdminMemberListResponse = {
  items: AdminMember[]
}
