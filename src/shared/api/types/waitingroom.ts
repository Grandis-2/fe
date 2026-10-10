// 대기열 API(waitingroom 서비스 — api-docs의 waitingroom.json) 모양. 운영(ADMIN) API는 다루지 않는다.
// 진입(POST)과 조회(GET) 모두 data.status로 결과를 구분한다.

// 차례가 왔다 — 입장권으로 expiresIn초 안에 접수한다. 다시 조회해도 같은 입장권이다.
export type QueueAdmitted = {
  status: 'ADMITTED'
  // 'et_'로 시작. 접수 요청의 X-Admission-Ticket 헤더에 담는다(한 번만 쓸 수 있다).
  admissionTicket: string
  // 입장권 남은 수명(초). 처음엔 90~120.
  expiresIn: number
}

// 줄에서 기다리는 중. 값이 없는 칸은 null이 아니라 아예 빠진다 —
// 진입 응답엔 queueToken·rejoined만, 조회 응답엔 totalWaiting·behind만 있다.
export type QueueWaiting = {
  status: 'WAITING'
  // 1이 맨 앞. 뒤로 밀리지 않는다.
  position: number
  // 예상 대기(초). 계산할 수 없으면 450 — 450 이상은 "오래 걸림"으로 보여 준다.
  etaSeconds: number
  // 'qt_'로 시작. 조회 때 Queue-Token 헤더에 담는다(50~60분 유효).
  queueToken?: string
  // true면 기존 자리를 돌려받았다.
  rejoined?: boolean
  // 나를 포함해 아직 입장하지 않은 인원.
  totalWaiting?: number
  // 내 뒤 인원.
  behind?: number
}

// 조회에서만 온다. NOT_IN_QUEUE면 다시 진입하고, SALE_CLOSED면 멈춘다.
export type QueueClosed = {
  status: 'CLOSED'
  reason: 'NOT_IN_QUEUE' | 'SALE_CLOSED'
}

// POST /api/v1/preorders/queue — 200 ADMITTED 또는 202 WAITING.
export type QueueEnterResponse = QueueAdmitted | QueueWaiting

// GET /api/v1/preorders/queue — 모두 200.
export type QueueStatusResponse = QueueAdmitted | QueueWaiting | QueueClosed

// 접수(POST /api/v1/preorders)는 대기열을 거쳐 preorder로 넘어간다 — 본문·응답 타입은 preorder.ts에 있다.
