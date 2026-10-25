// 관리자 대기열 API(waitingroom 서비스 — api-docs의 waitingroom.json, /api/v1/admin/waitingroom).
// 운영값을 바꾸면 1초 안에 실제 회원의 입장 속도에 반영된다.

/** 운영값 하나와 출처. DEFAULT는 기본값(설정 없음·잘못됨), OPERATIONAL은 관리자가 정한 값 */
export type WaitingroomSetting = {
  /** null이면 제한 없음 — 지금은 최대 대기 시간을 정하지 않았을 때만 null */
  value: number | null
  source: 'DEFAULT' | 'OPERATIONAL'
}

export type ProductRate = {
  productId: string
  /** 이 상품의 초당 입장 상한. 기본 15(서버가 150에서 낮춤, 명세는 아직 150) */
  cap: WaitingroomSetting
  /** 줄 최대 길이(명). 최대 대기 시간이 없으면 null */
  queueLimit: number | null
}

/**
 * 전역 속도를 정할 때 볼 기준(사전예약 서버 용량). 모르는 항목은 null이다. 숫자는 실측 전
 * 추정치라 화면은 "권장"·"위험"처럼 단정하지 않는 말로 보여 준다.
 */
export type CapacityGuide = {
  /** 바로 반영되는 전역 속도의 최댓값(초당 인원). 막 뜬 서버는 절반으로 센다 */
  recommendedMax: number | null
  /** 사전예약 서버를 최대로 늘리면 닿는 전역 속도. 넘겨 늘리면 400. recommendedMax 이상 */
  dangerLine: number | null
  /** 지금 실제로 쓰는 전역 초당 입장 = min(운영값, recommendedMax) × brakeFactor */
  appliedCredit: number | null
  /** 다 뜬 사전예약 서버 수 */
  readyTasks: number | null
  /** 막 떠서 준비 중인 사전예약 서버 수 */
  warmingTasks: number | null
  /** 감속 배율(0.1~1). 1이면 감속 없음 */
  brakeFactor: number | null
  /** 최근 접수 전달 중 실패·5xx·지연 비율(0~1). 최근 전달이 없으면 null */
  relayBadRatio: number | null
  /** 운영값이 recommendedMax보다 커서 서버가 늘어나기를 기다리는 중 */
  scalingPending: boolean | null
}

/** GET /admin/waitingroom/admission-rate — 바꾸는 API들도 바뀐 뒤의 이 값을 돌려준다 */
export type AdmissionRateView = {
  /** 전역 초당 입장 인원(브레이크 적용 전). 기본 15(서버가 150에서 낮춤, 명세는 아직 150) */
  globalCredit: WaitingroomSetting
  /** 전역 속도·상품 상한으로 정할 수 있는 최댓값(배포 설정, 기본 1500) */
  maxGlobalCredit: number
  /** 최대 대기 시간(초). value가 null이면 제한 없음(기본) */
  maxWaitSeconds: WaitingroomSetting
  /** 조회가 끊긴 대기자를 줄에 남겨 두는 시간(초). 기본 250, 250~1800 */
  leaveGraceSeconds: WaitingroomSetting
  products: ProductRate[]
  capacity: CapacityGuide | null
}

export type WaitingroomPhase = 'BEFORE_OPEN' | 'OPEN' | 'CLOSED'

export type WaitingroomRuntime =
  'IDLE' | 'QUEUEING' | 'DRAINING' | 'HIDDEN' | 'CLOSED'

export type ProductStatus = {
  productId: string
  phase: WaitingroomPhase
  runtime: WaitingroomRuntime
  /** 대기 인원(명) */
  waiting: number
  /** 이번에 배분된 초당 입장 인원. IDLE·HIDDEN·CLOSED면 0 */
  credit: number
  /**
   * 초당 입장 상한. 명세는 "운영값이 없으면 기본값"인 정수지만, 실서버가 운영값이 없을 때
   * null을 줄 수 있다(코드 리뷰 지적) — entities가 기본값으로 채운다.
   */
  cap: number | null
  /**
   * 지금 줄을 서면 기다릴 시간(초, 올림) — 대기 인원 ÷ 초당 입장(배분 전이면 전역 속도와 상한 중
   * 작은 값). 줄이 없으면 0. 접수 중이 아니거나, 비공개이거나, 입장을 멈췄으면 null
   */
  estimatedWaitSeconds: number | null
  opensAt: string
  closesAt: string
}

/**
 * GET /admin/waitingroom/status — 응답한 서버 기준이라 서버마다 조금 다를 수 있다. 서버가
 * 막 떠서 정보가 없으면 products는 빈 배열, 수치는 null. 1초 이상 간격으로 폴링한다.
 */
export type WaitingroomStatusView = {
  nodeId: string
  leaderNodeId: string | null
  /** true면 현황이 오래돼 새로 오는 사람이 모두 줄에 선다 */
  snapshotStale: boolean
  snapshotAgeSeconds: number | null
  /** 살아 있는 서버 수. 0이면 세지 못한 것 */
  gateways: number | null
  /** 실제 적용 중인 전역 초당 입장 인원(운영값 × brakeFactor) */
  globalCredit: number | null
  /** 0.1~1. 낮을수록 예약 서버 오류·지연 때문에 입장을 줄인 것 */
  brakeFactor: number | null
  maxWaitSeconds: number | null
  leaveGraceSeconds: number | null
  products: ProductStatus[]
}

/**
 * PUT /admin/waitingroom/admission-rate — 0..maxGlobalCredit, 0이면 입장을 멈춘다.
 * recommendedMax를 넘겨 늘리려면 confirm: true(없으면 409 ADMISSION_RATE_NEEDS_CONFIRM),
 * dangerLine을 넘기면 confirm과 상관없이 400 ADMISSION_RATE_UNREACHABLE.
 */
export type GlobalCreditRequest = { globalCredit: number; confirm?: boolean }

/** PUT /admin/waitingroom/products/{id}/admission-rate — 1..maxGlobalCredit */
export type ProductCapRequest = { cap: number }

/** PUT max-wait(1..86400) · leave-grace(250..1800) */
export type SecondsRequest = { seconds: number }
