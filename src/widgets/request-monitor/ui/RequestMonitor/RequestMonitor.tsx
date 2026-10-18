import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

import { isMockEnabled } from '@shared/api/mock'
import {
  MOCK_FAULTS,
  readMockFault,
  setMockFault,
  type MockFault,
} from '@shared/api/mock/fault'
import {
  requestLog,
  type LogEntry,
  type LoggedRequest,
  type LoggedWait,
} from '@shared/api/requestLog'
import { breakpoint } from '@shared/config/theme'

import * as styles from './RequestMonitor.css'

// 타임라인이 그리는 구간.
const WINDOW_MS = 60_000
const TICK_MS = 250
const OPEN_KEY = 'request-monitor-open'

const seconds = (ms: number) => `${(ms / 1000).toFixed(1)}초`
// 12:03:11 — toTimeString은 "12:03:11 GMT+0900 …"이다.
const clock = (at: number) => new Date(at).toTimeString().slice(0, 8)
// 같은 접두어와 쿼리는 빼고 UUID는 끝 네 자리만 둔다 — 주소가 길면 상태가 밀려난다.
const shortPath = (path: string) =>
  path
    .replace(/^\/api\/v1/, '')
    .split('?')[0]
    .replace(
      /[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}/gi,
      (id) => `…${id.slice(-4)}`,
    )

const statusText = (entry: LoggedRequest) =>
  entry.outcome === 'pending'
    ? '보내는 중'
    : entry.outcome === 'canceled'
      ? '취소'
      : entry.status === 0
        ? '응답 없음'
        : entry.sse && entry.outcome === 'ok'
          ? '연결됨'
          : String(entry.status)

// 기다린 시간이 정책의 어느 항에서 나왔는지 — 폴링은 queryPolicy.backoffDelay,
// SSE 재연결은 useUnreadNotificationCount(0~상한 사이 무작위).
const waitReason = ({
  sse,
  baseMs,
  failureCount,
  retryAfterMs,
  minMs,
  maxMs,
}: LoggedWait) => {
  if (sse)
    return `SSE 끊김 ${failureCount + 1}번째 · ${seconds(baseMs)} × 2^${failureCount + 1}(최대 1분) → 0~${seconds(maxMs)} 사이 무작위`
  const doubled = baseMs * 2 ** failureCount
  const from =
    retryAfterMs >= minMs && retryAfterMs > 0
      ? `서버가 정한 Retry-After ${seconds(retryAfterMs)}`
      : doubled > minMs
        ? `${seconds(baseMs)} × 2^${failureCount} → 상한 ${seconds(minMs)}`
        : `${seconds(baseMs)} × 2^${failureCount} = ${seconds(minMs)}`
  return `연속 실패 ${failureCount + 1}번째 · ${from} · 무작위로 최대 1.5배 → ${seconds(minMs)}~${seconds(maxMs)}`
}

const readOpen = () => {
  try {
    const saved = localStorage.getItem(OPEN_KEY)
    if (saved !== null) return saved === 'true'
  } catch {
    // 저장소를 못 쓰면 화면 크기로 정한다.
  }
  // 모바일은 화면을 많이 가려 접어 둔 채 시작한다.
  return window.matchMedia(breakpoint.desktop).matches
}

// 렌더 중에 Date.now()를 읽지 않으려고 타이머로 지금 시각을 받는다. 처음 한 틱 전엔 0이다.
function useNow(active: boolean) {
  const [now, setNow] = useState(0)
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), TICK_MS)
    return () => clearInterval(id)
  }, [active])
  return now
}

/**
 * 대기열·사전예약·결제·알림 요청을 화면 옆에 그대로 보여 주는 창 — 백오프(실패하면 간격을 늘림),
 * 재전송(같은 내용으로 다시 보냄), SSE 재연결이 실제로 어떻게 일어나는지 개발자 도구 없이 본다.
 * 목 서버면 [장애 내기]로 고른 요청을 503으로 실패시킬 수 있다.
 */
export function RequestMonitor() {
  const entries = useSyncExternalStore(
    requestLog.subscribe,
    requestLog.getSnapshot,
  )
  const [open, setOpen] = useState(readOpen)
  const [fault, setFault] = useState(readMockFault)
  const [modalOpen, setModalOpen] = useState(false)
  const now = useNow(open)
  const rootRef = useRef<HTMLElement>(null)

  // 모달(<dialog>)이 열리면 그 모달이 top layer 맨 위로 올라와 이 창을 덮는다 — 다시 맨 위로 올린다.
  useEffect(() => {
    const root = rootRef.current
    // Popover API가 없는 브라우저(Safari 16 이하 등)에선 :popover-open·showPopover가 던져 앱이 깨진다 —
    // 맨 위로 올리지 않고 그냥 둔다.
    if (!root || typeof root.showPopover !== 'function') return
    const raise = () => {
      if (root.matches(':popover-open')) root.hidePopover()
      root.showPopover()
      setModalOpen(document.querySelector('dialog:modal') !== null)
    }
    raise()
    const observer = new MutationObserver(raise)
    observer.observe(document.body, {
      subtree: true,
      attributeFilter: ['open'],
    })
    return () => {
      observer.disconnect()
      if (root.matches(':popover-open')) root.hidePopover()
    }
  }, [])

  const toggle = (next: boolean) => {
    setOpen(next)
    try {
      localStorage.setItem(OPEN_KEY, String(next))
    } catch {
      // 기억하지 못해도 지금 화면에서는 바뀐다.
    }
  }

  const chooseFault = (next: MockFault | null) => {
    setMockFault(next)
    setFault(next)
  }

  const failures = entries.filter(
    (entry) => entry.kind === 'request' && entry.outcome === 'fail',
  ).length

  return (
    <section
      ref={rootRef}
      popover="manual"
      className={styles.root}
      aria-label="요청 모니터"
    >
      {open ? (
        <RequestMonitorPanel
          entries={entries}
          now={now}
          fault={isMockEnabled ? fault : undefined}
          blocked={modalOpen}
          onFault={chooseFault}
          onClear={requestLog.clear}
          onClose={() => toggle(false)}
        />
      ) : (
        <button
          type="button"
          className={styles.pill}
          onClick={() => toggle(true)}
        >
          <span className={styles.liveDot} aria-hidden="true" />
          요청 모니터
          {failures > 0 && (
            <span className={styles.failCount}>실패 {failures}</span>
          )}
          {fault && <span className={styles.failCount}>장애 중</span>}
        </button>
      )}
    </section>
  )
}

export type RequestMonitorPanelProps = {
  entries: LogEntry[]
  // 지금 시각(ms). 0이면 아직 모른다 — 타임라인을 그리지 않는다.
  now: number
  // 목 서버가 아니면 undefined — [장애 내기]를 그리지 않는다.
  fault: MockFault | null | undefined
  // 모달이 열려 있다 — 브라우저가 모달 바깥을 막아 이 창의 버튼이 눌리지 않는다.
  blocked?: boolean
  onFault: (fault: MockFault | null) => void
  onClear: () => void
  onClose: () => void
}

export function RequestMonitorPanel({
  entries,
  now,
  fault,
  blocked = false,
  onFault,
  onClear,
  onClose,
}: RequestMonitorPanelProps) {
  const start = now - WINDOW_MS
  const at = (time: number) => `${((time - start) / WINDOW_MS) * 100}%`
  const visible = entries.filter(
    (entry) =>
      (entry.kind === 'wait'
        ? entry.startedAt + entry.waitMs
        : (entry.endedAt ?? now)) >= start,
  )
  // 아직 끝나지 않은 대기 중 가장 최근 것 — "다음 요청까지".
  const waiting = entries.findLast(
    (entry): entry is LoggedWait =>
      entry.kind === 'wait' && entry.startedAt + entry.waitMs > now,
  )
  const requests = entries.filter(
    (entry): entry is LoggedRequest => entry.kind === 'request',
  )
  // 같은 주소로 보낸 바로 앞 요청이 끝난 뒤 얼마 만에 보냈는지.
  const gapOf = (entry: LoggedRequest) => {
    const index = requests.indexOf(entry)
    const previous = requests
      .slice(0, index)
      .findLast(
        (other) =>
          other.method === entry.method &&
          shortPath(other.path) === shortPath(entry.path) &&
          other.outcome !== 'canceled' &&
          other.endedAt !== null,
      )
    // 앞 요청이 끝나기 전에 보낸 것(다른 화면이 같이 부름)은 간격이 아니다.
    const gap =
      previous?.endedAt != null ? entry.startedAt - previous.endedAt : null
    return gap !== null && gap >= 0 ? gap : null
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>
          <span className={styles.liveDot} aria-hidden="true" />
          요청 모니터
        </span>
        <button type="button" className={styles.textButton} onClick={onClear}>
          지우기
        </button>
        <button type="button" className={styles.textButton} onClick={onClose}>
          접기
        </button>
      </div>

      <p className={styles.policy}>
        대기열·사전예약·결제·알림 요청만 보여요. 계속 묻는 요청이 실패하면 두
        배씩 늘려 기다리고(최대 30초, 무작위로 최대 1.5배), 4xx는 다시 묻지
        않아요. 결제 승인은 응답을 못 받으면 같은 내용으로 한 번만 다시 보내고,
        알림 SSE가 끊기면 0초~상한(두 배씩, 최대 1분) 사이 무작위로 기다렸다
        다시 연결해요.
      </p>

      {blocked && (
        <p className={styles.blocked}>
          모달이 열려 있는 동안엔 브라우저가 이 창의 버튼을 막아요. 창을 누르면
          모달이 닫히고, 대기열은 닫아도 계속 순번을 물어요.
        </p>
      )}

      {fault !== undefined && (
        <div className={styles.faultRow} role="group" aria-label="장애 내기">
          <span className={styles.faultLabel}>장애 내기</span>
          <button
            type="button"
            className={styles.faultButton[fault === null ? 'selected' : 'off']}
            aria-pressed={fault === null}
            onClick={() => onFault(null)}
          >
            끔
          </button>
          {(Object.keys(MOCK_FAULTS) as MockFault[]).map((key) => (
            <button
              key={key}
              type="button"
              className={styles.faultButton[fault === key ? 'on' : 'off']}
              aria-pressed={fault === key}
              onClick={() => onFault(key)}
            >
              {MOCK_FAULTS[key].label} 503
            </button>
          ))}
        </div>
      )}

      {now > 0 && (
        <div className={styles.timeline}>
          <div className={styles.track} aria-hidden="true">
            {visible.map((entry) =>
              entry.kind === 'wait' ? (
                <span
                  key={entry.id}
                  className={styles.waitBar}
                  style={{
                    left: at(entry.startedAt),
                    width: `${(Math.min(entry.waitMs, now - entry.startedAt) / WINDOW_MS) * 100}%`,
                  }}
                />
              ) : (
                <span
                  key={entry.id}
                  className={styles.dot[entry.outcome]}
                  style={{ left: at(entry.startedAt) }}
                />
              ),
            )}
          </div>
          <div className={styles.axis}>
            <span>60초 전</span>
            <span>30초 전</span>
            <span>지금</span>
          </div>
        </div>
      )}

      {waiting && (
        <div className={styles.countdown} role="status">
          <span className={styles.countdownText}>
            다음 요청까지 {seconds(waiting.startedAt + waiting.waitMs - now)}
          </span>
          <div className={styles.countdownTrack}>
            <div
              className={styles.countdownFill}
              style={{
                width: `${((now - waiting.startedAt) / waiting.waitMs) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      <ol className={styles.list}>
        {entries.length === 0 && (
          <li className={styles.empty}>
            아직 대기열·사전예약·결제·알림 요청이 없어요. 그 화면에 들어가면
            여기에 쌓여요.
          </li>
        )}
        {entries.toReversed().map((entry) =>
          entry.kind === 'wait' ? (
            <li key={entry.id} className={styles.row}>
              <span className={styles.time}>{clock(entry.startedAt)}</span>
              <span className={styles.line}>
                <span className={styles.topic}>{entry.topic}</span>
                <span className={styles.status.wait}>
                  {seconds(entry.waitMs)} 기다림
                </span>
              </span>
              <span className={styles.detail}>{waitReason(entry)}</span>
            </li>
          ) : (
            <RequestRow key={entry.id} entry={entry} gap={gapOf(entry)} />
          ),
        )}
      </ol>
    </div>
  )
}

function RequestRow({
  entry,
  gap,
}: {
  entry: LoggedRequest
  gap: number | null
}) {
  const details = [
    gap !== null && `앞 요청 뒤 ${seconds(gap)}`,
    entry.endedAt !== null &&
      `응답 ${seconds(entry.endedAt - entry.startedAt)}`,
    entry.retryAfter > 0 && `서버: ${entry.retryAfter}초 뒤 다시`,
  ].filter(Boolean)

  return (
    <li className={styles.row}>
      <span className={styles.time}>{clock(entry.startedAt)}</span>
      <span className={styles.line}>
        <span className={styles.topic}>{entry.topic}</span>
        <span className={styles.method}>
          {entry.sse ? 'SSE' : entry.method}
        </span>
        <span className={styles.path}>{shortPath(entry.path)}</span>
        <span className={styles.status[entry.outcome]}>
          {statusText(entry)}
        </span>
        {entry.repeat && (
          <span className={styles.tag}>
            {entry.sse
              ? '다시 연결'
              : entry.method === 'GET'
                ? '다시 물음'
                : '같은 내용 재전송'}
          </span>
        )}
      </span>
      {details.length > 0 && (
        <span className={styles.detail}>{details.join(' · ')}</span>
      )}
    </li>
  )
}
