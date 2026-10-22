import { http } from 'msw'

import { reservationStore } from '../fixtures/admin-reservation'
import { isOpenScenarioRunning, scenarioQueue } from '../openScenario'
import { invalid, ok } from '../response'
import { url } from '../url'

import type {
  AdmissionRateView,
  GlobalCreditRequest,
  ProductCapRequest,
  ProductStatus,
  SecondsRequest,
  WaitingroomSetting,
  WaitingroomStatusView,
} from '../../types'
import type { RequestHandler } from 'msw'

// ponytail: 메모리 상태라 새로고침하면 운영값이 기본값으로 돌아간다.
// ponytail: 현황 숫자는 시간으로 흔들어 만든 가짜다 — 부하 검증 화면의 그래프가 움직이게 하려고.

const BASE = '/api/v1/admin/waitingroom'
const MAX_GLOBAL_CREDIT = 1500
// 서버가 2026-10-21에 기본값을 150에서 15로 낮췄다.
const DEFAULT_GLOBAL = 15
const DEFAULT_CAP = 15
const DEFAULT_GRACE = 250

const state: {
  globalCredit: number | null
  maxWait: number | null
  leaveGrace: number | null
  caps: Map<string, number>
} = { globalCredit: null, maxWait: null, leaveGrace: null, caps: new Map() }

// 대기열에 올라온 상품 — 예약 목에 나오는 사전예약 상품들.
const productIds = [
  ...new Set(reservationStore.map((item) => item.productId)),
].toSorted()

const setting = (
  value: number | null,
  fallback: number | null,
): WaitingroomSetting =>
  value === null
    ? { value: fallback, source: 'DEFAULT' }
    : { value, source: 'OPERATIONAL' }

const capOf = (productId: string) => state.caps.get(productId) ?? DEFAULT_CAP

function view(): AdmissionRateView {
  const ids = [...new Set([...productIds, ...state.caps.keys()])].toSorted()
  return {
    globalCredit: setting(state.globalCredit, DEFAULT_GLOBAL),
    maxGlobalCredit: MAX_GLOBAL_CREDIT,
    maxWaitSeconds: setting(state.maxWait, null),
    leaveGraceSeconds: setting(state.leaveGrace, DEFAULT_GRACE),
    products: ids.map((productId) => ({
      productId,
      cap: setting(state.caps.get(productId) ?? null, DEFAULT_CAP),
      queueLimit:
        state.maxWait === null
          ? null
          : Math.max(1, Math.min(capOf(productId), DEFAULT_GLOBAL)) *
            state.maxWait,
    })),
  }
}

type Snapshot = Pick<
  WaitingroomStatusView,
  'globalCredit' | 'brakeFactor' | 'products'
>

// 1분 주기로 오르내리는 대기 인원과, 가끔 걸리는 브레이크.
function waveSnapshot(now: number): Snapshot {
  const wave = (offset: number) =>
    (Math.sin((now / 60_000 + offset) * Math.PI * 2) + 1) / 2
  const brakeFactor = wave(0.3) > 0.85 ? 0.6 : 1
  const global = Math.round(
    (state.globalCredit ?? DEFAULT_GLOBAL) * brakeFactor,
  )
  const share = Math.floor(global / Math.max(productIds.length, 1))
  const products: ProductStatus[] = productIds.map((productId, index) => {
    const waiting = Math.round(wave(index / 3) * 1200)
    return {
      productId,
      phase: 'OPEN',
      runtime:
        waiting === 0 ? 'IDLE' : waiting < share ? 'DRAINING' : 'QUEUEING',
      waiting,
      credit: waiting === 0 ? 0 : Math.min(share, capOf(productId)),
      cap: capOf(productId),
      opensAt: new Date(now - 30 * 60_000).toISOString(),
      closesAt: new Date(now + 90 * 60_000).toISOString(),
    }
  })
  return { globalCredit: global, brakeFactor, products }
}

// 오픈 시나리오의 대기열 — 몰린 사람이 입장 속도만큼 빠지고, 적체가 쌓이면 브레이크가 걸린다.
function scenarioSnapshot(now: number): Snapshot {
  const queue = scenarioQueue(state.globalCredit ?? DEFAULT_GLOBAL, capOf)
  return {
    globalCredit: Math.round(
      (state.globalCredit ?? DEFAULT_GLOBAL) * queue.brakeFactor,
    ),
    brakeFactor: queue.brakeFactor,
    products: queue.products.map((product) => ({
      productId: product.productId,
      phase: 'OPEN',
      runtime:
        product.waiting === 0
          ? 'IDLE'
          : product.waiting <= product.credit
            ? 'DRAINING'
            : 'QUEUEING',
      waiting: product.waiting,
      credit: product.credit,
      cap: capOf(product.productId),
      opensAt: new Date(now - 30 * 60_000).toISOString(),
      closesAt: new Date(now + 90 * 60_000).toISOString(),
    })),
  }
}

function status(): WaitingroomStatusView {
  const now = Date.now()
  return {
    nodeId: '5d1c2e7a-0b9f-4c3e-8a21-7f6e5d4c3b2a',
    leaderNodeId: '9c8b7a6d-1e2f-4a3b-9c4d-5e6f7a8b9c0d',
    snapshotStale: false,
    snapshotAgeSeconds: 0,
    gateways: 2,
    maxWaitSeconds: state.maxWait,
    leaveGraceSeconds: state.leaveGrace ?? DEFAULT_GRACE,
    ...(isOpenScenarioRunning() ? scenarioSnapshot(now) : waveSnapshot(now)),
  }
}

// 정수 범위를 벗어나면 서버처럼 400(field로 문제 칸을 알린다).
const readInt = async (
  request: Request,
  field: string,
  min: number,
  max: number,
) => {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null
  const value = body?.[field]
  return typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
    ? value
    : null
}

const outOfRange = (field: string, min: number, max: number) =>
  invalid([{ field, message: `${min}..${max} 범위의 정수여야 합니다.` }])

export const adminWaitingroomHandlers: RequestHandler[] = [
  http.get(url(`${BASE}/status`), () => ok(status())),
  http.get(url(`${BASE}/admission-rate`), () => ok(view())),

  http.put(url(`${BASE}/admission-rate`), async ({ request }) => {
    const field: keyof GlobalCreditRequest = 'globalCredit'
    const value = await readInt(request, field, 0, MAX_GLOBAL_CREDIT)
    if (value === null) return outOfRange(field, 0, MAX_GLOBAL_CREDIT)
    state.globalCredit = value
    return ok(view())
  }),
  http.delete(url(`${BASE}/admission-rate`), () => {
    state.globalCredit = null
    return ok(view())
  }),

  http.put(
    url(`${BASE}/products/:productId/admission-rate`),
    async ({ request, params }) => {
      const field: keyof ProductCapRequest = 'cap'
      const value = await readInt(request, field, 1, MAX_GLOBAL_CREDIT)
      if (value === null) return outOfRange(field, 1, MAX_GLOBAL_CREDIT)
      state.caps.set(String(params.productId), value)
      return ok(view())
    },
  ),
  http.delete(
    url(`${BASE}/products/:productId/admission-rate`),
    ({ params }) => {
      state.caps.delete(String(params.productId))
      return ok(view())
    },
  ),

  http.put(url(`${BASE}/max-wait`), async ({ request }) => {
    const field: keyof SecondsRequest = 'seconds'
    const value = await readInt(request, field, 1, 86_400)
    if (value === null) return outOfRange(field, 1, 86_400)
    state.maxWait = value
    return ok(view())
  }),
  http.delete(url(`${BASE}/max-wait`), () => {
    state.maxWait = null
    return ok(view())
  }),

  http.put(url(`${BASE}/leave-grace`), async ({ request }) => {
    const field: keyof SecondsRequest = 'seconds'
    const value = await readInt(request, field, 250, 1_800)
    if (value === null) return outOfRange(field, 250, 1_800)
    state.leaveGrace = value
    return ok(view())
  }),
  http.delete(url(`${BASE}/leave-grace`), () => {
    state.leaveGrace = null
    return ok(view())
  }),
]
