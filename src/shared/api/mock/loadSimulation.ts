import { reservationStore } from './fixtures/admin-reservation'
import { currentMockConfig } from './handlers/external-reservation'

import type { AdminPreorderDetail } from '../types'

// 부하 검증 [시험 시작] 동안만 도는 가짜 부하. 목 예약은 원래 고정이라 처리량 그래프가 0에
// 붙는다. 접수는 물결처럼 늘었다 줄고, 외부 등록은 초당 처리 한도와 Mock 설정(지연·실패율)을
// 따른다 — 접수가 한도를 넘는 동안 적체가 쌓였다가 줄면서 풀린다.
const TICK_MS = 1000
const PROCESS_PER_TICK = 10
// 한도보다 크게 잡아야 적체가 생겼다 풀리는 모습이 보인다.
const PEAK_INTAKE_PER_TICK = 18
const WAVE_MS = 120_000
const PAYMENT_WINDOW_MS = 24 * 60 * 60 * 1000

type InFlight = { detail: AdminPreorderDetail; readyAt: number }

let timer: ReturnType<typeof setInterval> | null = null
let accepting = false
let startedAt = 0
let sequence = 0
const inFlight: InFlight[] = []

const iso = (ms: number) => new Date(ms).toISOString()

/** 기존 예약을 본떠 방금 접수된 예약을 만든다(상품·옵션·회원은 돌아가며 쓴다) */
function receive(now: number): AdminPreorderDetail {
  const template = reservationStore[sequence % reservationStore.length]
  sequence += 1
  const queuePosition =
    Math.max(
      0,
      ...reservationStore
        .filter((item) => item.productId === template.productId)
        .map((item) => item.queuePosition),
    ) + 1
  const preorderId = crypto.randomUUID()
  return {
    ...template,
    preorderId,
    status: 'PENDING_SYNC',
    displayStatus: 'PROCESSING',
    queuePosition,
    createdAt: iso(now),
    payableFrom: null,
    paymentDueAt: null,
    reservedAt: null,
    version: 1,
    externalReference: null,
    cancelable: true,
    internalNote: null,
    syncJobs: [
      {
        syncJobId: crypto.randomUUID(),
        preorderId,
        jobType: 'REGISTER',
        status: 'PENDING',
        attemptCount: 0,
        lastErrorCode: null,
        deadLetteredAt: null,
        createdAt: iso(now),
        updatedAt: iso(now),
        attempts: [],
      },
    ],
    events: [
      {
        eventSequence: 1,
        fromStatus: null,
        toStatus: 'PENDING_SYNC',
        actor: 'USER',
        reason: null,
        createdAt: iso(now),
      },
    ],
  }
}

/** 외부 등록을 마친다 — Mock 실패율만큼은 재시도 끝에 실패(DEAD_LETTER)로 남는다 */
function settle(detail: AdminPreorderDetail, now: number) {
  const config = currentMockConfig()
  const [job] = detail.syncJobs
  const failed = Math.random() < config.failureRate
  const errorCode = config.failureMode === 'TIMEOUT' ? 'TIMEOUT' : 'HTTP_503'
  job.attemptCount = 1
  job.updatedAt = iso(now)
  job.attempts = [
    {
      attemptNumber: 1,
      actor: 'SYSTEM',
      result: failed ? 'FAILED' : 'SUCCEEDED',
      httpStatus: failed ? 503 : 200,
      errorCode: failed ? errorCode : null,
      errorMessage: failed ? 'Service Unavailable' : null,
      startedAt: detail.createdAt,
      finishedAt: iso(now),
    },
  ]
  if (failed) {
    job.status = 'DEAD_LETTER'
    job.lastErrorCode = errorCode
    job.deadLetteredAt = iso(now)
    return
  }
  job.status = 'SUCCEEDED'
  detail.status = 'REGISTERED'
  detail.displayStatus = 'PAYABLE'
  detail.payableFrom = iso(now)
  detail.paymentDueAt = iso(now + PAYMENT_WINDOW_MS)
  detail.version = 2
  detail.externalReference = `R-L${sequence}`
  detail.events.push({
    eventSequence: 2,
    fromStatus: 'PENDING_SYNC',
    toStatus: 'REGISTERED',
    actor: 'SYSTEM',
    reason: null,
    createdAt: iso(now),
  })
}

function tick() {
  const now = Date.now()
  const config = currentMockConfig()

  if (accepting) {
    // 0 → 최고 → 0을 WAVE_MS마다 반복한다.
    const phase = ((now - startedAt) % WAVE_MS) / WAVE_MS
    const intake = Math.round(
      PEAK_INTAKE_PER_TICK * (0.5 - 0.5 * Math.cos(2 * Math.PI * phase)),
    )
    for (let index = 0; index < intake; index += 1) {
      const detail = receive(now)
      reservationStore.push(detail)
      const jitter = 1 + (Math.random() * 2 - 1) * config.latencyJitter
      inFlight.push({
        detail,
        readyAt: now + config.registerLatencyMs * jitter,
      })
    }
  }

  // 지연이 지난 것부터 한도만큼만 처리한다.
  for (let processed = 0; processed < PROCESS_PER_TICK; processed += 1) {
    if (!inFlight[0] || inFlight[0].readyAt > now) break
    const next = inFlight.shift()
    if (next) settle(next.detail, now)
  }

  // 시험이 끝났고 남은 접수도 다 처리했으면 멈춘다.
  if (!accepting && inFlight.length === 0 && timer) {
    clearInterval(timer)
    timer = null
  }
}

/**
 * 켜면 매초 예약을 받고 처리한다. 끄면 새 접수만 멈추고 이미 받은 것은 마저 처리한다 —
 * 시험이 끝났는데 적체가 영원히 남지 않게.
 */
export function setLoadSimulation(running: boolean) {
  accepting = running
  if (running) startedAt = Date.now()
  if (running && !timer) timer = setInterval(tick, TICK_MS)
}
