/**
 * 화면 옆 요청 모니터(@widgets/request-monitor)가 그리는 기록. apiClient가 보내는 폴링·SSE 요청과
 * 실패 뒤 기다린 시간을 일어난 순서대로 쌓는다. 최근 MAX_ENTRIES개만 둔다.
 * 기록만 하고 요청 흐름에는 끼어들지 않는다.
 */
// 폴링이면 'poll', SSE 연결이면 'sse'.
export type Channel = 'poll' | 'sse'

export type LoggedRequest = {
  kind: 'request'
  id: number
  channel: Channel
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
  channel: Channel
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

// 폴링 쿼리는 queryFn의 signal을 pollingSignal로 감싸 넘긴다 — 그 signal로 보낸 요청만 기록한다.
// 폴링 여부는 API 함수가 아니라 쿼리가 정해서(같은 주문 상세도 결제 확인 중일 때만 폴링) 여기서 고른다.
const pollingSignals = new WeakSet<AbortSignal>()

export const pollingSignal = (signal: AbortSignal) => {
  pollingSignals.add(signal)
  return signal
}

const noop = () => {}

const bodyKey = (body: unknown) =>
  body instanceof FormData ? `form-${nextId}` : JSON.stringify(body ?? null)

// 요청을 보내기 직전에 부르고, 끝나면 돌려받은 함수에 결과를 넘긴다. 폴링·SSE가 아니면 남기지 않는다.
export function logRequest(request: {
  method: string
  path: string
  body?: unknown
  idempotencyKey?: string
  signal?: AbortSignal
  sse?: boolean
}): (result: { status: number | null; retryAfter?: number }) => void {
  const channel: Channel | null = request.sse
    ? 'sse'
    : request.signal && pollingSignals.has(request.signal)
      ? 'poll'
      : null
  if (!channel) return noop
  const signature = `${request.method} ${request.path} ${request.idempotencyKey ?? bodyKey(request.body)}`
  const previous = entries.findLast(
    (entry): entry is LoggedRequest =>
      entry.kind === 'request' && entry.signature === signature,
  )
  const id = nextId++
  commit([
    ...entries,
    {
      kind: 'request',
      id,
      channel,
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

export function logWait(
  wait: Omit<LoggedWait, 'kind' | 'id' | 'startedAt' | 'channel'> & {
    channel?: Channel
  },
) {
  commit([
    ...entries,
    {
      kind: 'wait',
      id: nextId++,
      startedAt: Date.now(),
      channel: 'poll',
      ...wait,
    },
  ])
}
