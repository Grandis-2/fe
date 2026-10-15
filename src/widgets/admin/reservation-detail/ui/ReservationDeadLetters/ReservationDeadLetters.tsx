import {
  deadLetterEventLabel,
  deadLetterStatusColor,
  deadLetterStatusLabel,
  deadLetterStatusLabels,
  isRedriveInFlight,
  type DeadLetter,
} from '@entities/admin-dead-letter'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { Button, Table, Tag } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './ReservationDeadLetters.css'

export type ReservationDeadLettersProps = {
  items: DeadLetter[]
  onRedrive: (item: DeadLetter) => void
  /** 다시 처리를 보내는 중이면 버튼을 막는다 */
  busy?: boolean
}

/** 다시 처리할 수 없는 건에 관리자가 알아야 할 것 */
const hintOf = (item: DeadLetter) => {
  if (isRedriveInFlight(item.status)) return '처리 중입니다'
  if (item.status === 'SUCCEEDED') return '처리됨'
  if (item.status === 'DISCARDED') return '개발팀이 정리함'
  return '개발팀 문의'
}

/**
 * 이 예약에 반영되지 못한 처리(결제 완료·기한 만료 등). 서버끼리 주고받은 메시지가 처리에
 * 거듭 실패해 멈춘 것이라, 다시 처리를 누르면 같은 메시지를 한 번 더 처리하게 한다.
 * 버리기는 원문을 봐야 판단할 수 있어 개발자 화면(이벤트 DLQ)에만 둔다.
 */
export function ReservationDeadLetters({
  items,
  onRedrive,
  busy = false,
}: ReservationDeadLettersProps) {
  const columns: TableColumn<DeadLetter>[] = [
    {
      key: 'event',
      header: '반영되지 않은 처리',
      render: (item) => deadLetterEventLabel(item.eventType),
    },
    {
      key: 'status',
      header: '상태',
      align: 'center',
      render: (item) => (
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={deadLetterStatusColor[item.status]}
          widthOptions={deadLetterStatusLabels}
        >
          {deadLetterStatusLabel[item.status]}
        </Tag>
      ),
    },
    {
      key: 'at',
      header: '발생 시각',
      align: 'center',
      render: (item) => formatDotDateTime(item.sentAt ?? item.createdAt),
    },
    {
      key: 'action',
      header: '조치',
      align: 'center',
      width: '120px',
      render: (item) =>
        item.redrivable ? (
          <Button size="small" disabled={busy} onClick={() => onRedrive(item)}>
            다시 처리
          </Button>
        ) : (
          <span className={styles.hint}>{hintOf(item)}</span>
        ),
    },
  ]

  return (
    <Table
      columns={columns}
      rows={items}
      rowKey={(item) => item.deadLetterId}
    />
  )
}
