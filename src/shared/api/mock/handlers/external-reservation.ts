import { HttpResponse, http, type JsonBodyType, RequestHandler } from 'msw'

import { reservationStore } from '../fixtures/admin-reservation'
import { url } from '../url'

import type {
  ExternalErrorResponse,
  ExternalLedgerPage,
  ExternalLedgerRow,
  MockConfig,
  MockConfigUpdate,
  MockFaultRequest,
  MockFaultResponse,
  MockResetResponse,
} from '../../types'

/*
 * 외부 예약 시스템(Mock 서버) 원장 목업. 우리 예약 목에서 만들되, 대조 화면에서 종류별
 * 어긋남이 하나씩 보이도록 일부러 틀어 둔다 — 실서버에서는 이런 건이 없어야 정상이다.
 */
const ORPHAN_KEY = '0f0e0d0c-4a5b-4c7d-8e9f-00000000dead'

// 성공·실패 응답 모양이 달라 핸들러의 응답 타입을 합쳐 둔다.
type Reply<TSuccess extends JsonBodyType> = TSuccess | ExternalErrorResponse

const invalid = <TSuccess extends JsonBodyType>(message: string) =>
  HttpResponse.json<Reply<TSuccess>>(
    { errorCode: 'INVALID_REQUEST', errorMessage: message },
    { status: 400 },
  )

// ponytail: 메모리 상태라 새로고침하면 설정·초기화가 처음으로 돌아간다(실서버는 재기동 때).
const DEFAULT_CONFIG: MockConfig = {
  registerLatencyMs: 500,
  latencyJitter: 0.4,
  latencyTailRate: 0,
  latencyTailMinMs: 0,
  latencyTailMaxMs: 0,
  bodyLatencyMs: 500,
  failureRate: 0.05,
  failureMode: 'HTTP_5XX',
  mixedResponses: [],
  configVersion: 0,
  appliedAt: new Date().toISOString(),
  timeoutHoldMs: 7000,
  workerReadTimeoutMs: 5000,
}
let config: MockConfig = DEFAULT_CONFIG
// 초기화하면 원장이 빈다 — 목은 우리 예약에서 원장을 만들어서, 초기화 뒤엔 비워 둔다.
let ledgerCleared = false

const UPDATABLE = new Set<string>([
  'registerLatencyMs',
  'failureRate',
  'failureMode',
  'latencyTailRate',
  'latencyTailMinMs',
  'latencyTailMaxMs',
  'mixedResponses',
])

const ALL_MIXED: MockConfig['mixedResponses'] = [
  'HTTP_500',
  'HTTP_500_NO_BODY',
  'HTTP_502',
  'HTTP_503',
  'HTTP_504',
]

const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * 명세의 입력 규칙 중 화면에서 걸릴 만한 것만 보고 적용할 값을 만든다. 어기면 이유(문자열)를
 * 돌려준다. 통째 교체라 보내지 않은 선택 칸은 꼬리 없음·HTTP_5XX가 된다.
 */
function parseConfigUpdate(
  body: Partial<MockConfigUpdate> & Record<string, unknown>,
):
  | (Omit<MockConfigUpdate, 'failureMode'> & Pick<MockConfig, 'failureMode'>)
  | string {
  const unknown = Object.keys(body).find((key) => !UPDATABLE.has(key))
  if (unknown) return `알 수 없는 필드입니다: ${unknown}`
  const { registerLatencyMs, failureRate, mixedResponses } = body
  if (
    !isNumber(registerLatencyMs) ||
    registerLatencyMs < 0 ||
    registerLatencyMs > 60000
  ) {
    return 'registerLatencyMs 는 0~60000 입니다.'
  }
  if (!isNumber(failureRate) || failureRate < 0 || failureRate > 1) {
    return 'failureRate 는 0~1 입니다.'
  }
  const {
    latencyTailRate: rate,
    latencyTailMinMs: min,
    latencyTailMaxMs: max,
  } = body
  const given = [rate, min, max].filter((value) => value !== undefined).length
  if (given !== 0 && given !== 3) return '꼬리 세 칸은 함께 보내야 합니다.'
  const tail = isNumber(rate) && isNumber(min) && isNumber(max) && rate > 0
  if (tail && min > max) return '꼬리 최소는 최대 이하입니다.'
  const failureMode = body.failureMode ?? 'HTTP_5XX'
  if (mixedResponses && failureMode !== 'MIXED') {
    return 'mixedResponses 는 MIXED 일 때만 보냅니다.'
  }
  if (mixedResponses?.length === 0) return 'mixedResponses 가 비었습니다.'
  return {
    registerLatencyMs,
    failureRate,
    failureMode,
    // 비율이 0이면 꼬리 없음으로 저장해 최소·최대도 0이다.
    latencyTailRate: tail ? rate : 0,
    latencyTailMinMs: tail ? min : 0,
    latencyTailMaxMs: tail ? max : 0,
    mixedResponses:
      failureMode === 'MIXED' ? (mixedResponses ?? ALL_MIXED) : [],
  }
}

function buildLedger(): ExternalLedgerRow[] {
  if (ledgerCleared) return []
  const registered = reservationStore.filter(
    (item) => item.status === 'REGISTERED' || item.status === 'RESERVED',
  )
  // 누락: 확정된 예약 하나는 외부에 없다.
  const missing = registered[0]?.preorderId
  // 불일치: 다른 회원으로 등록돼 있다.
  const mismatched = registered[1]?.preorderId
  // 응답 유실: 우리는 아직 처리 중인데 외부는 등록을 마쳤다.
  const lostResponse = reservationStore.find(
    (item) => item.status === 'PENDING_SYNC',
  )?.preorderId
  // 취소 미반영: 우리는 취소를 마쳤는데 외부 취소가 닿지 않아 아직 등록돼 있다.
  const cancelMissed = reservationStore.find(
    (item) => item.status === 'CANCELED',
  )?.preorderId

  const rows: ExternalLedgerRow[] = reservationStore.flatMap((item) => {
    const row: ExternalLedgerRow = {
      externalKey: item.preorderId,
      externalNumber: item.externalReference,
      customerId: item.customerId,
      productId: item.productId,
      sku: item.optionTitle,
      status: 'ACTIVE',
      confirmedAt: item.payableFrom,
      canceledAt: null,
    }
    if (item.preorderId === lostResponse) {
      return [
        { ...row, externalNumber: 'R-LOST-0001', confirmedAt: item.createdAt },
      ]
    }
    if (item.preorderId === missing || item.status === 'PENDING_SYNC') {
      return []
    }
    if (item.preorderId === cancelMissed) return [row]
    if (item.status === 'CANCELED' || item.status === 'CANCELING') {
      return [{ ...row, status: 'CANCELED', canceledAt: item.createdAt }]
    }
    if (item.preorderId === mismatched) {
      return [{ ...row, customerId: '5d1c2e3f-4a5b-4c6d-8e7f-00000000ffff' }]
    }
    return [row]
  })

  // 유령: 우리 예약에 없는 등록.
  const sample = registered[2]
  if (sample) {
    rows.push({
      externalKey: ORPHAN_KEY,
      externalNumber: 'R-ORPHAN-0001',
      customerId: sample.customerId,
      productId: sample.productId,
      sku: sample.optionTitle,
      status: 'ACTIVE',
      confirmedAt: sample.createdAt,
      canceledAt: null,
    })
  }
  return rows.toSorted((a, b) => a.externalKey.localeCompare(b.externalKey))
}

export const externalReservationHandlers: RequestHandler[] = [
  // 외부 키 순서로 커서 페이지를 준다. 모르는 파라미터는 400(실서버와 같다).
  http.get(url('/external/reservations'), ({ request }) => {
    const query = new URL(request.url).searchParams
    const unknown = [...query.keys()].find(
      (key) => key !== 'cursor' && key !== 'size',
    )
    if (unknown)
      return invalid<ExternalLedgerPage>(
        `알 수 없는 파라미터입니다: ${unknown}`,
      )
    const size = Number(query.get('size') ?? 500)
    if (!Number.isInteger(size) || size < 1 || size > 1000) {
      return invalid<ExternalLedgerPage>('size 는 1~1000 정수입니다.')
    }

    const cursor = query.get('cursor')
    const rest = buildLedger().filter(
      (row) => !cursor || row.externalKey > cursor,
    )
    const items = rest.slice(0, size)
    return HttpResponse.json<Reply<ExternalLedgerPage>>({
      items,
      nextCursor:
        rest.length > size ? items[items.length - 1].externalKey : null,
    })
  }),

  http.get(url('/external/config'), () => HttpResponse.json(config)),

  // 통째 교체 — 보내지 않은 선택 칸은 꼬리 없음·HTTP_5XX로 돌아간다.
  http.put(url('/external/config'), async ({ request }) => {
    const body = (await request.json().catch(() => null)) as
      (Partial<MockConfigUpdate> & Record<string, unknown>) | null
    const update = body ? parseConfigUpdate(body) : '본문이 필요합니다.'
    if (typeof update === 'string') return invalid<MockConfig>(update)
    config = {
      ...config,
      ...update,
      bodyLatencyMs: update.registerLatencyMs,
      configVersion: config.configVersion + 1,
      appliedAt: new Date().toISOString(),
    }
    return HttpResponse.json<Reply<MockConfig>>(config)
  }),

  http.post(url('/external/reset'), async ({ request }) => {
    const body = (await request.json().catch(() => null)) as {
      confirm?: string
    } | null
    if (body?.confirm !== 'RESET') {
      return invalid<MockResetResponse>('confirm 에 RESET 을 넣어 주세요.')
    }
    const deletedCount = buildLedger().length
    ledgerCleared = true
    return HttpResponse.json<Reply<MockResetResponse>>({ deletedCount })
  }),

  http.post(url('/external/faults'), async ({ request }) => {
    const body = (await request
      .json()
      .catch(() => null)) as Partial<MockFaultRequest> | null
    if (!body?.externalKey || !/^[\w.-]{1,100}$/.test(body.externalKey)) {
      return invalid<MockFaultResponse>('externalKey 형식이 틀렸습니다.')
    }
    if (body.faultType === 'SLOW_SUCCESS') {
      if (!body.delayMs || body.delayMs < 1 || body.delayMs > 60000) {
        return invalid<MockFaultResponse>(
          'SLOW_SUCCESS 는 delayMs(1~60000)가 필요합니다.',
        )
      }
    } else if (body.faultType === 'RESPONSE_LOST_AFTER_COMMIT') {
      if (body.delayMs !== undefined) {
        return invalid<MockFaultResponse>(
          'RESPONSE_LOST_AFTER_COMMIT 에는 delayMs 를 보내지 않습니다.',
        )
      }
    } else {
      return invalid<MockFaultResponse>('faultType 이 틀렸습니다.')
    }
    return HttpResponse.json<Reply<MockFaultResponse>>(
      {
        externalKey: body.externalKey,
        faultType: body.faultType,
        delayMs: body.delayMs ?? null,
        createdAt: new Date().toISOString(),
      },
      { status: 201 },
    )
  }),
]
