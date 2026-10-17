/**
 * 화면 옆 요청 모니터(@widgets/request-monitor)가 그리는 기록. apiClient가 보내는 대기열·사전예약·결제·알림
 * 요청과 실패 뒤 기다린 시간을 일어난 순서대로 쌓는다. 최근 MAX_ENTRIES개만 둔다.
 * 기록만 하고 요청 흐름에는 끼어들지 않는다.
 */
export type Topic = '대기열' | '사전예약' | '결제' | '알림'

export type LoggedRequest = {
  kind: 'request'
  id: number
  topic: Topic
  // SSE 연결이면 true.
  sse: boolean
  startedAt: number
  endedAt: number | null
  method: string
  path: string
  // 응답 상태. 응답이 없었으면(타임아웃·네트워크) 0, 아직 진행 중이거나 취소됐으면 null.
  status: number | null
  outcome: 'pending' | 'ok' | 'fail' | 'canceled'
  // 응답의 Retry-After(초). 없으면 0.
  retryAfter: number
  // 바로 앞의 같은 요청(같은 메서드·주소·본문)이 실패한 뒤 다시 보낸 것.
  repeat: boolean
  signature: string
}

export type LoggedWait = {
  kind: 'wait'
  id: number
  topic: Topic
  // SSE 재연결 대기면 true.
  sse: boolean
  startedAt: number
  waitMs: number
  baseMs: number
  // 연속 실패(SSE는 끊긴) 횟수 — TanStack retryDelay처럼 첫 실패 뒤 0이다.
  failureCount: number
  retryAfterMs: number
  // 지터를 붙이기 전 값과 붙일 수 있는 최댓값.
  minMs: number
  maxMs: number
}

export type LogEntry = LoggedRequest | LoggedWait

const MAX_ENTRIES = 60

let entries: LogEntry[] = []
let nextId = 0
const listeners = new Set<() => void>()

const commit = (next: LogEntry[]) => {
  entries = next.slice(-MAX_ENTRIES)
  listeners.forEach((listener) => listener())
}

// useSyncExternalStore에 그대로 넘긴다.
export const requestLog = {
  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  getSnapshot: () => entries,
  clear: () => commit([]),
}

// 결제 결과를 기다리며 주문·응모 상태를 다시 묻는 요청은 주소만으로는 주문 상세 조회와 구분되지 않는다 —
// 그 조회는 signal을 이걸로 감싸 넘긴다.
const paymentCheckSignals = new WeakSet<AbortSignal>()

export const paymentCheckSignal = (signal: AbortSignal) => {
  paymentCheckSignals.add(signal)
  return signal
}

// 모니터에 보일 흐름. 관리자 API(/api/v1/admin/…)와 상품·장바구니 같은 나머지는 null — 남기지 않는다.
const topicOf = (path: string, signal?: AbortSignal): Topic | null => {
  if (path.startsWith('/api/v1/preorders/queue')) return '대기열'
  if (path.includes('/payment-attempts')) return '결제'
  if (signal && paymentCheckSignals.has(signal)) return '결제'
  if (path.startsWith('/api/v1/preorders')) return '사전예약'
  if (path.startsWith('/api/v1/notifications')) return '알림'
  return null
}

const noop = () => {}

const bodyKey = (body: unknown) =>
  body instanceof FormData ? `form-${nextId}` : JSON.stringify(body ?? null)

const isRequest = (entry: LogEntry): entry is LoggedRequest =>
  entry.kind === 'request'

// 요청을 보내기 직전에 부르고, 끝나면 돌려받은 함수에 결과를 넘긴다. 모니터에 보일 흐름이 아니면 남기지 않는다.
export function logRequest(request: {
  method: string
  path: string
  body?: unknown
  idempotencyKey?: string
  signal?: AbortSignal
  sse?: boolean
}): (result: { status: number | null; retryAfter?: number }) => void {
  const topic = topicOf(request.path, request.signal)
  if (!topic) return noop
  const signature = `${request.method} ${request.path} ${request.idempotencyKey ?? bodyKey(request.body)}`
  const previous = entries
    .filter(isRequest)
    .findLast((entry) => entry.signature === signature)
  const id = nextId++
  commit([
    ...entries,
    {
      kind: 'request',
      id,
      topic,
      sse: request.sse ?? false,
      startedAt: Date.now(),
      endedAt: null,
      method: request.method,
      path: request.path,
      status: null,
      outcome: 'pending',
      retryAfter: 0,
      repeat: previous?.outcome === 'fail',
      signature,
    },
  ])

  return ({ status, retryAfter = 0 }) =>
    commit(
      entries.map((entry) =>
        entry.id === id && entry.kind === 'request'
          ? {
              ...entry,
              endedAt: Date.now(),
              status,
              retryAfter,
              outcome:
                status === null
                  ? 'canceled'
                  : status > 0 && status < 400
                    ? 'ok'
                    : 'fail',
            }
          : entry,
      ),
    )
}

type WaitInput = Omit<LoggedWait, 'kind' | 'id' | 'startedAt' | 'topic' | 'sse'>

// 실패 뒤 기다리기 시작할 때 부른다. 폴링 대기는 방금 끝난 요청(실패 직후에 불리므로 가장 늦게 끝난 것)의
// 흐름을 따르고, 그 요청이 기록에 없거나 실패가 아니면(관리자 화면 폴링 등) 남기지 않는다.
// 같은 ms에 끝났으면 뒤에 남긴 쪽이 더 늦은 것이다(>=).
export function logWait(wait: WaitInput & { sse?: boolean }) {
  const failed = wait.sse
    ? null
    : entries
        .filter(isRequest)
        .reduce<LoggedRequest | null>(
          (latest, entry) =>
            (entry.endedAt ?? 0) >= (latest?.endedAt ?? 0) ? entry : latest,
          null,
        )
  if (!wait.sse && failed?.outcome !== 'fail') return
  commit([
    ...entries,
    {
      kind: 'wait',
      id: nextId++,
      topic: failed?.topic ?? '알림',
      startedAt: Date.now(),
      ...wait,
      sse: wait.sse ?? false,
    },
  ])
}
