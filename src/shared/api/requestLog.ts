/**
 * 화면 옆 요청 모니터(@widgets/request-monitor)가 그리는 기록. apiClient가 보내는 요청과
 * backoffDelay가 정한 대기를 일어난 순서대로 쌓는다. 최근 MAX_ENTRIES개만 둔다.
 * 기록만 하고 요청 흐름에는 끼어들지 않는다.
 */
export type LoggedRequest = {
  kind: 'request'
  id: number
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
  startedAt: number
  waitMs: number
  baseMs: number
  // 연속 실패 횟수 — TanStack retryDelay처럼 첫 실패 뒤 0이다.
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

const bodyKey = (body: unknown) =>
  body instanceof FormData ? `form-${nextId}` : JSON.stringify(body ?? null)

// 요청을 보내기 직전에 부르고, 끝나면 돌려받은 함수에 결과를 넘긴다.
export function logRequest(request: {
  method: string
  path: string
  body?: unknown
  idempotencyKey?: string
}): (result: { status: number | null; retryAfter?: number }) => void {
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

export function logWait(wait: Omit<LoggedWait, 'kind' | 'id' | 'startedAt'>) {
  commit([
    ...entries,
    { kind: 'wait', id: nextId++, startedAt: Date.now(), ...wait },
  ])
}
