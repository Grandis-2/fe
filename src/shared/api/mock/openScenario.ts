import { reservationStore } from './fixtures/admin-reservation'
import { receive, settle } from './loadSimulation'

import type { AdminPreorderDetail, SyncJob } from '../types'

// 오픈 시나리오 — 주소에 ?mockScenario=open 을 붙여 열면 돈다(MSW일 때만). 운영 홈·장애
// 대응을 실제 오픈처럼 보려고 만든 가짜 흐름이다.
//   사전예약 3개에 5,000명이 30초 안에 대기열에 몰림 → 대기열 입장 속도(대기열 관리의 전역 값 × 브레이크)
//   만큼 예약 접수 → 외부 등록은 초당 처리 한도까지만 → 5%는 재시도 끝에 실패.
// 접수가 처리 한도보다 빨라 적체가 쌓이면 대기열 브레이크가 걸려 입장이 줄어든다.
// 운영 대시보드에서 다시 보내면 서버처럼 초당 정해진 건수씩 다시 처리하고, 일부는 또 실패한다.
const TICK_MS = 1000
const TOTAL_ARRIVALS = 5000
const ARRIVAL_SECONDS = 30
/** 외부 등록 처리 한도(초당) — 입장보다 작아야 적체가 생긴다 */
const PROCESS_PER_TICK = 25
const REGISTER_LATENCY_MS = 1000
const FAILURE_RATE = 0.05
/** 실패 원인 비율 — 대부분 외부 시스템 일시 장애, 일부는 거절 */
const FAILURE_MIX: readonly [string, number][] = [
  ['HTTP_503', 0.7],
  ['TIMEOUT', 0.2],
  ['MOCK_REJECTED', 0.1],
]
/** 다시 보낸 일시 장애가 또 실패할 확률(거절은 언제나 또 실패한다) */
const REFAIL_RATE = 0.1
/** 적체가 이보다 많으면 대기열이 입장을 줄인다(브레이크) */
const BRAKE_BACKLOG = 1500
const BRAKE_FACTOR = 0.5
const DEFAULT_GLOBAL_CREDIT = 150
const PRODUCT_CAP = 150

type InFlight = { detail: AdminPreorderDetail; readyAt: number }

let timer: ReturnType<typeof setInterval> | null = null
let arrived = 0
/** 대기열 관리에서 정한 전역 입장 속도 — 대기열 현황 응답을 만들 때마다 받아 둔다 */
let globalCredit = DEFAULT_GLOBAL_CREDIT
const waiting = new Map<string, number>()
const credits = new Map<string, number>()
const inFlight: InFlight[] = []
const reprocessQueue: { detail: AdminPreorderDetail; job: SyncJob }[] = []
let reprocessPerTick = 20

/** 동시에 여는 사전예약 수 — 목의 사전예약 3개를 모두 연다 */
const OPEN_PRODUCTS = 3

// 상품마다 몰리는 정도가 다르다 — 앞 상품일수록 인기.
const productIds = [...new Set(reservationStore.map((item) => item.productId))]
  .toSorted()
  .slice(0, OPEN_PRODUCTS)
const weights = productIds.map((_, index) => 1 / (index + 1))
const weightSum = weights.reduce((total, weight) => total + weight, 0)
const templates = new Map(
  productIds.map((productId) => [
    productId,
    reservationStore.filter((item) => item.productId === productId),
  ]),
)

const brakeFactor = () => (inFlight.length > BRAKE_BACKLOG ? BRAKE_FACTOR : 1)

function pickFailure() {
  if (Math.random() >= FAILURE_RATE) return null
  let roll = Math.random()
  for (const [code, share] of FAILURE_MIX) {
    roll -= share
    if (roll < 0) return code
  }
  return FAILURE_MIX[0][0]
}

function arrive() {
  const count = Math.min(
    TOTAL_ARRIVALS - arrived,
    Math.ceil(TOTAL_ARRIVALS / ARRIVAL_SECONDS),
  )
  arrived += count
  productIds.forEach((productId, index) => {
    const share = Math.round((count * weights[index]) / weightSum)
    waiting.set(productId, (waiting.get(productId) ?? 0) + share)
  })
}

/** 대기열에서 입장시켜 예약을 받는다. 줄이 있는 상품끼리 입장 속도를 나눈다 */
function admit(now: number) {
  const active = productIds.filter((id) => (waiting.get(id) ?? 0) > 0)
  const share = Math.floor(
    (globalCredit * brakeFactor()) / Math.max(active.length, 1),
  )
  credits.clear()
  for (const productId of active) {
    const admitted = Math.min(
      waiting.get(productId) ?? 0,
      Math.min(share, PRODUCT_CAP),
    )
    waiting.set(productId, (waiting.get(productId) ?? 0) - admitted)
    credits.set(productId, admitted)
    const pool = templates.get(productId) ?? reservationStore
    for (let index = 0; index < admitted; index += 1) {
      const detail = receive(now, pool[index % pool.length])
      reservationStore.push(detail)
      inFlight.push({ detail, readyAt: now + REGISTER_LATENCY_MS })
    }
  }
}

function tick() {
  const now = Date.now()
  if (arrived < TOTAL_ARRIVALS) arrive()
  admit(now)

  for (let processed = 0; processed < PROCESS_PER_TICK; processed += 1) {
    if (!inFlight[0] || inFlight[0].readyAt > now) break
    const next = inFlight.shift()
    if (next) settle(next.detail, now, pickFailure())
  }

  for (let processed = 0; processed < reprocessPerTick; processed += 1) {
    const next = reprocessQueue.shift()
    if (!next) break
    const code = next.job.lastErrorCode ?? 'HTTP_503'
    const refailed = code.endsWith('REJECTED') || Math.random() < REFAIL_RATE
    settle(next.detail, now, refailed ? code : null)
  }
}

/** 시나리오를 시작한다. 이미 돌고 있으면 그대로 둔다 */
export function startOpenScenario() {
  if (timer) return
  // 고정 목 예약 중 외부 등록 대기로 멈춰 있는 것(며칠 전 접수)을 처리된 것으로 돌린다 —
  // 남겨 두면 '가장 오래 기다린 외부 등록'이 그걸 가리켜 오픈 직후부터 몇 시간째 밀린 것처럼 보인다.
  const now = Date.now()
  for (const detail of reservationStore) {
    const [job] = detail.syncJobs
    if (
      detail.status === 'PENDING_SYNC' &&
      job &&
      job.status !== 'DEAD_LETTER'
    ) {
      settle(detail, now, null)
    }
  }
  timer = setInterval(tick, TICK_MS)
}

export const isOpenScenarioRunning = () => timer !== null

/**
 * 운영 대시보드의 다시 보내기 — 작업을 대기로 돌리고 초당 ratePerSecond건씩 다시 처리한다.
 * 마지막 오류 코드는 다음 시도가 끝날 때까지 남는다(실서버와 같다).
 */
export function requeueForReprocess(
  detail: AdminPreorderDetail,
  job: SyncJob,
  ratePerSecond: number,
) {
  job.status = 'PENDING'
  job.deadLetteredAt = null
  job.updatedAt = new Date().toISOString()
  reprocessPerTick = ratePerSecond
  reprocessQueue.push({ detail, job })
}

/** 대기열 현황 — 상품별 대기·입장과 브레이크. 대기열 관리의 전역 값을 받아 다음 입장에 쓴다 */
export function scenarioQueue(currentGlobalCredit: number) {
  globalCredit = currentGlobalCredit
  return {
    brakeFactor: brakeFactor(),
    products: productIds.map((productId) => ({
      productId,
      waiting: waiting.get(productId) ?? 0,
      credit: credits.get(productId) ?? 0,
      cap: PRODUCT_CAP,
    })),
  }
}
