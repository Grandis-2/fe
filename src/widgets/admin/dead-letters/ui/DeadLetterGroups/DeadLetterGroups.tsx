import {
  deadLetterEventLabel,
  deadLetterFailureReasonLabel,
  isRedrivableReason,
  type DeadLetter,
  type DeadLetterGroup,
} from '@entities/admin-dead-letter'
import { formatDistance } from '@shared/lib/formatDistance'
import { Button } from '@shared/ui'

import * as styles from './DeadLetterGroups.css'

export type DeadLetterGroupsProps = {
  groups: DeadLetterGroup[]
  /** 지금 시각(ms) — '얼마나 멈췄나'를 부모와 같은 기준으로 센다 */
  now: number
  busy: boolean
  onRedrive: (ids: string[]) => void
  onOpen: (item: DeadLetter) => void
}

const titleOf = (group: DeadLetterGroup) =>
  // 원문을 못 읽었거나 서버가 모르는 종류면 이벤트 이름이 의미가 없다 — 이유만 쓴다.
  group.failureReason === 'PROCESSING_FAILED'
    ? `${deadLetterEventLabel(group.eventType)} · ${deadLetterFailureReasonLabel[group.failureReason]}`
    : deadLetterFailureReasonLabel[group.failureReason]

function describe(group: DeadLetterGroup, now: number) {
  const since = `가장 오래된 것 ${formatDistance(now - Date.parse(group.oldestAt))} 전`
  switch (group.failureReason) {
    case 'UNREADABLE_BODY':
      return '되돌려도 또 실패해요 · 원문을 보고 보낸 쪽에 재발행을 요청한 뒤 버려요'
    case 'UNKNOWN_EVENT_TYPE':
      return `${group.eventType ?? '종류 없음'} · 받는 서버를 배포한 뒤 되돌려요`
    default:
      return group.hasRetried
        ? `${since} · 한 번 되돌렸는데 또 멈춘 메시지가 있어요 — 원인부터 확인해요`
        : since
  }
}

/**
 * 처리 대기 메시지를 같은 원인끼리 묶은 카드. 원인 하나를 고치면 그 묶음이 한꺼번에
 * 풀리므로 묶음째 되돌린다. 원문을 읽을 수 없거나 받는 서버가 모르는 종류는 바로
 * 되돌리지 않고 상세에서 판단하게 한다.
 */
export function DeadLetterGroups({
  groups,
  now,
  busy,
  onRedrive,
  onOpen,
}: DeadLetterGroupsProps) {
  return (
    <ul className={styles.list}>
      {groups.map((group) => {
        const count = group.items.length
        const redrivable = group.items.filter((item) => item.redrivable)
        const direct =
          group.failureReason === 'PROCESSING_FAILED' && redrivable.length > 0
        return (
          <li key={group.key} className={styles.item}>
            <div className={styles.text}>
              <span className={styles.title}>
                {titleOf(group)}{' '}
                <span className={styles.count[group.failureReason]}>
                  {count}건
                </span>
              </span>
              <span className={styles.description}>{describe(group, now)}</span>
            </div>
            {direct ? (
              <Button
                size="small"
                variant={count > 1 ? 'solid' : 'outline'}
                disabled={busy}
                onClick={() =>
                  onRedrive(redrivable.map((item) => item.deadLetterId))
                }
              >
                {redrivable.length > 1
                  ? `묶음 되돌리기 ${redrivable.length}건`
                  : '되돌리기'}
              </Button>
            ) : (
              <Button
                size="small"
                variant="outline"
                onClick={() => onOpen(group.items[0])}
              >
                {isRedrivableReason(group.failureReason)
                  ? '상세 보기'
                  : '원문 보기'}
              </Button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
