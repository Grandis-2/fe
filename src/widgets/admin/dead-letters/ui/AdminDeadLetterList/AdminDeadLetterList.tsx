import { useState } from 'react'

import { useLocation, useNavigate, useSearchParams } from 'react-router'

import {
  deadLetterEventLabel,
  deadLetterEventTypes,
  deadLetterFailureReasonLabel,
  deadLetterFailureReasons,
  deadLetterStatusColor,
  deadLetterStatuses,
  deadLetterStatusLabel,
  deadLetterStatusLabels,
  useDeadLetters,
  useRedriveDeadLetters,
  type DeadLetter,
  type DeadLetterFailureReason,
  type DeadLetterStatus,
} from '@entities/admin-dead-letter'
import { reservationNo } from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import {
  DEFAULT_REFRESH_INTERVAL,
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import { adminDeadLetterPath, type BackTo } from '@shared/config/routes'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  Dropdown,
  InlineAlert,
  RefreshStatus,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import * as styles from './AdminDeadLetterList.css'

// shortcut: 최근 100건만 받는다(서버 한 쪽 상한). 평소 비어 있어야 하는 목록이라 충분하다 —
// 넘치면 서버 페이지 이동을 붙인다.
const PAGE_SIZE = 100

// 상세에 갔다 돌아와도 같은 조건이 보이게 주소에 둔다.
const PARAM = {
  status: 'status',
  eventType: 'event',
  failureReason: 'reason',
} as const

const ALL = 'all'

// 주소 값은 누구나 바꿔 넣을 수 있어 아는 값일 때만 쓰고, 아니면 기본값으로 둔다.
const pick = <T extends string>(
  value: string | null,
  known: readonly T[],
  fallback: T | typeof ALL,
): T | typeof ALL =>
  value === ALL ? ALL : (known.find((item) => item === value) ?? fallback)

// 처음 열면 손댈 것(처리 대기)부터 보인다.
const DEFAULT_STATUS: DeadLetterStatus = 'OPEN'

const statusOptions: DropdownOption<DeadLetterStatus | typeof ALL>[] = [
  { label: '전체 상태', value: ALL },
  ...deadLetterStatuses.map((status) => ({
    label: deadLetterStatusLabel[status],
    value: status,
  })),
]

const eventOptions: DropdownOption<string>[] = [
  { label: '전체 이벤트', value: ALL },
  ...deadLetterEventTypes.map((eventType) => ({
    label: deadLetterEventLabel(eventType),
    value: eventType,
  })),
]

const reasonOptions: DropdownOption<DeadLetterFailureReason | typeof ALL>[] = [
  { label: '전체 실패 이유', value: ALL },
  ...deadLetterFailureReasons.map((reason) => ({
    label: deadLetterFailureReasonLabel[reason],
    value: reason,
  })),
]

type Feedback = { status: 'success' | 'error'; message: string }

/**
 * 이벤트 DLQ 목록(개발자용). 처리에 거듭 실패해 멈춘 메시지를 조건으로 거르고, 고른 것을
 * 원래 큐로 한 번에 되돌린다. 버리기는 원문을 보고 판단해야 해서 상세에서만 한다.
 */
export function AdminDeadLetterList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const status = pick(
    searchParams.get(PARAM.status),
    deadLetterStatuses,
    DEFAULT_STATUS,
  )
  // 서버가 모르는 종류도 거를 수 있어 이벤트만은 그대로 받는다.
  const eventType = searchParams.get(PARAM.eventType) ?? ALL
  const failureReason = pick(
    searchParams.get(PARAM.failureReason),
    deadLetterFailureReasons,
    ALL,
  )
  const setParam = (key: string, value: string, fallback: string) =>
    setSearchParams(
      (prev) => {
        if (value === fallback) prev.delete(key)
        else prev.set(key, value)
        return prev
      },
      { replace: true },
    )

  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(
    DEFAULT_REFRESH_INTERVAL,
  )
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>()

  const deadLetters = useDeadLetters(
    {
      status: status === ALL ? undefined : status,
      eventType: eventType === ALL ? undefined : eventType,
      failureReason: failureReason === ALL ? undefined : failureReason,
      size: PAGE_SIZE,
    },
    refreshInterval,
  )
  const redrive = useRedriveDeadLetters()

  const items = deadLetters.data?.items
  const redrivable = (items ?? []).filter((item) => item.redrivable)
  const selectedIds = redrivable
    .filter((item) => selected.has(item.deadLetterId))
    .map((item) => item.deadLetterId)
  const allSelected =
    redrivable.length > 0 &&
    redrivable.every((item) => selected.has(item.deadLetterId))

  const toggle = (ids: string[], checked: boolean) =>
    setSelected((prev) => toggleInSet(prev, ids, checked))

  const confirmRedrive = () => {
    const ids = selectedIds
    openModal({
      theme: 'light',
      title: `${ids.length}건을 되돌릴까요?`,
      description:
        '고른 메시지를 원래 큐로 다시 보냅니다. 원인을 고친 뒤에 보내야 다시 실패하지 않습니다.',
      confirmLabel: '되돌리기',
      onConfirm: () => {
        closeModal()
        setFeedback(undefined)
        redrive.mutate(ids, {
          onSuccess: ({ targetCount, skippedCount, estimatedSeconds }) => {
            setSelected(new Set())
            setFeedback({
              status: 'success',
              message: [
                `${targetCount}건을 되돌리는 중입니다(약 ${estimatedSeconds}초).`,
                skippedCount > 0 &&
                  `${skippedCount}건은 대기 상태가 아니거나 되돌릴 수 없어 건너뛰었습니다.`,
              ]
                .filter(Boolean)
                .join(' '),
            })
          },
          onError: (caught) =>
            setFeedback({
              status: 'error',
              message: getErrorMessage(caught, '되돌리지 못했습니다.'),
            }),
        })
      },
    })
  }

  const columns: TableColumn<DeadLetter>[] = [
    {
      key: 'select',
      header: (
        <Checkbox
          aria-label="되돌릴 수 있는 메시지 모두 선택"
          checked={allSelected}
          disabled={redrivable.length === 0 || redrive.isPending}
          onChange={(event) =>
            toggle(
              redrivable.map((item) => item.deadLetterId),
              event.target.checked,
            )
          }
        />
      ),
      align: 'center',
      width: '56px',
      render: (item) =>
        item.redrivable && (
          <Checkbox
            aria-label={`${deadLetterEventLabel(item.eventType)} 선택`}
            checked={selected.has(item.deadLetterId)}
            disabled={redrive.isPending}
            // 행 전체가 상세로 가는 버튼이라, 고르기만 하고 머문다.
            onClick={(event) => event.stopPropagation()}
            onChange={(event) =>
              toggle([item.deadLetterId], event.target.checked)
            }
          />
        ),
    },
    {
      key: 'event',
      header: '이벤트',
      render: (item) => (
        <span className={styles.stacked}>
          {deadLetterEventLabel(item.eventType)}
          {item.eventType && (
            <span className={styles.subText}>{item.eventType}</span>
          )}
        </span>
      ),
    },
    {
      key: 'preorder',
      header: '예약',
      align: 'center',
      render: (item) =>
        item.preorderId ? reservationNo(item.preorderId) : '—',
    },
    {
      key: 'reason',
      header: '실패 이유',
      align: 'center',
      render: (item) => deadLetterFailureReasonLabel[item.failureReason],
    },
    {
      key: 'receive',
      header: '받은 횟수',
      align: 'center',
      render: (item) => `${item.receiveCount}회`,
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
      header: '쌓인 시각',
      align: 'center',
      render: (item) => formatDotDateTime(item.createdAt),
    },
  ]

  // 상세의 '돌아가기'가 지금 고른 조건 그대로의 목록을 가리키게 한다.
  const openDetail = (item: DeadLetter) => {
    const backTo: BackTo = {
      label: '이벤트 DLQ',
      to: location.pathname + location.search,
    }
    navigate(adminDeadLetterPath(item.deadLetterId), { state: { backTo } })
  }

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={deadLetters.dataUpdatedAt}
        onRefresh={() => void deadLetters.refetch()}
      >
        <Dropdown
          label="자동 갱신 간격"
          size="small"
          width="140px"
          options={refreshIntervalOptions}
          value={refreshInterval}
          // 고르는 즉시 한 번 받는다 — 새 간격을 기다리지 않고 지금 값을 보여준다.
          onSelect={(next) => {
            setRefreshInterval(next)
            void deadLetters.refetch()
          }}
        />
      </RefreshStatus>

      <div className={styles.filters}>
        <Dropdown
          label="상태"
          size="small"
          width="160px"
          options={statusOptions}
          value={status}
          onSelect={(next) => setParam(PARAM.status, next, DEFAULT_STATUS)}
        />
        <Dropdown
          label="이벤트"
          size="small"
          width="200px"
          options={eventOptions}
          value={eventType}
          onSelect={(next) => setParam(PARAM.eventType, next, ALL)}
        />
        <Dropdown
          label="실패 이유"
          size="small"
          width="180px"
          options={reasonOptions}
          value={failureReason}
          onSelect={(next) => setParam(PARAM.failureReason, next, ALL)}
        />
        <Button
          size="small"
          variant="outline"
          className={styles.bulkButton}
          disabled={selectedIds.length === 0 || redrive.isPending}
          onClick={confirmRedrive}
        >
          {redrive.isPending
            ? '되돌리는 중…'
            : `선택 되돌리기 ${selectedIds.length}건`}
        </Button>
      </div>

      {/* 다시 받기가 실패해도 이전 목록은 남는다 — 멈춘 목록을 최신으로 읽지 않게 알린다. */}
      {deadLetters.isError && (
        <InlineAlert status={items ? 'warning' : 'error'}>
          {getErrorMessage(deadLetters.error, '메시지를 불러오지 못했습니다.')}
          {items && ' 아래 목록은 마지막으로 받은 값입니다.'}
        </InlineAlert>
      )}
      {feedback && (
        <InlineAlert status={feedback.status}>{feedback.message}</InlineAlert>
      )}

      <Table
        columns={columns}
        rows={items ?? []}
        rowKey={(item) => item.deadLetterId}
        pageSize={20}
        onRowClick={openDetail}
        loading={deadLetters.isPending}
        emptyMessage={
          deadLetters.isError
            ? '메시지를 불러오지 못했습니다.'
            : '조건에 맞는 메시지가 없습니다.'
        }
      />
      {deadLetters.data && deadLetters.data.total > PAGE_SIZE && (
        <div className={styles.subText}>
          전체 {deadLetters.data.total.toLocaleString('ko-KR')}건 중 최근{' '}
          {PAGE_SIZE}건만 보입니다. 조건을 좁혀 주세요.
        </div>
      )}
    </div>
  )
}
