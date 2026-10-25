import type { DeadLetter } from './types'

/** 같은 원인(이벤트 종류 × 실패 이유)으로 멈춘 메시지 묶음 */
export type DeadLetterGroup = {
  key: string
  eventType: DeadLetter['eventType']
  failureReason: DeadLetter['failureReason']
  items: DeadLetter[]
  /** 가장 오래 멈춘 메시지가 쌓인 시각 */
  oldestAt: string
  /** 한 번 되돌렸다가 또 멈춘 메시지가 섞였는지 — 원인이 남아 있을 수 있다 */
  hasRetried: boolean
}

/**
 * 메시지를 같은 원인끼리 묶는다. 원인을 하나 고치면 그 묶음이 한꺼번에 풀리므로, 관리자는
 * 한 건씩이 아니라 묶음으로 판단한다. 오래 멈춘 묶음이 먼저다.
 */
export function groupDeadLetters(items: DeadLetter[]): DeadLetterGroup[] {
  const groups = new Map<string, DeadLetterGroup>()
  for (const item of items) {
    const key = `${item.eventType ?? ''}|${item.failureReason}`
    const group = groups.get(key)
    if (!group) {
      groups.set(key, {
        key,
        eventType: item.eventType,
        failureReason: item.failureReason,
        items: [item],
        oldestAt: item.createdAt,
        hasRetried: item.redrivenFromId !== null,
      })
      continue
    }
    group.items.push(item)
    if (item.createdAt < group.oldestAt) group.oldestAt = item.createdAt
    if (item.redrivenFromId !== null) group.hasRetried = true
  }
  return [...groups.values()].sort((a, b) =>
    a.oldestAt.localeCompare(b.oldestAt),
  )
}
