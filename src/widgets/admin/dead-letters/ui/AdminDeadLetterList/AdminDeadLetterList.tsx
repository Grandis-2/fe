import { useState } from 'react'

import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'

import {
  deadLetterEventLabel,
  deadLetterEventTypes,
  deadLetterFailureReasonLabel,
  deadLetterFailureReasonTag,
  deadLetterFailureReasons,
  deadLetterStatusColor,
  deadLetterStatusLabel,
  deadLetterStatusLabels,
  deadLetterTabs,
  groupDeadLetters,
  useDeadLetterCounts,
  useDeadLetters,
  useRedriveDeadLetters,
  type DeadLetter,
  type DeadLetterFailureReason,
  type DeadLetterTab,
} from '@entities/admin-dead-letter'
import { reservationNo } from '@entities/admin-reservation'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  DEFAULT_REFRESH_INTERVAL,
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import {
  adminDeadLetterPath,
  adminReservationPath,
  type BackTo,
} from '@shared/config/routes'
import { formatDistance } from '@shared/lib/formatDistance'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatNumber } from '@shared/lib/formatNumber'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { useNow } from '@shared/lib/useNow'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  Dropdown,
  InlineAlert,
  Panel,
  RefreshStatus,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import { DeadLetterGroups } from '../DeadLetterGroups'

import * as styles from './AdminDeadLetterList.css'

// shortcut: 최근 100건만 받는다(서버 한 쪽 상한). 평소 비어 있어야 하는 목록이라 충분하다 —
// 넘치면 서버 페이지 이동을 붙인다.
const PAGE_SIZE = 100

// 상세에 갔다 돌아와도 같은 조건이 보이게 주소에 둔다.
const PARAM = {
  tab: 'tab',
  eventType: 'event',
  failureReason: 'reason',
} as const

const ALL = 'all'

// 처음 열면 손댈 것(처리 대기)부터 보인다.
const DEFAULT_TAB: DeadLetterTab = 'open'

// '멈춘 지'는 분 단위라 1분마다 다시 그리면 충분하다.
const NOW_INTERVAL_MS = 60_000

const eventOptions: DropdownOption<string>[] = [
  { label: '반영 안 된 처리: 전체', value: ALL },
  ...deadLetterEventTypes.map((eventType) => ({
    label: deadLetterEventLabel(eventType),
    value: eventType,
  })),
]

const reasonOptions: DropdownOption<DeadLetterFailureReason | typeof ALL>[] = [
  { label: '실패 이유: 전체', value: ALL },
  ...deadLetterFailureReasons.map((reason) => ({
    label: deadLetterFailureReasonLabel[reason],
    value: reason,
  })),
]

type Feedback = { status: 'success' | 'error'; message: string }

/**
 * 이벤트 DLQ 목록(개발자용). 처리 대기 탭은 같은 원인끼리 묶어 무엇이 멈췄는지 먼저
 * 보여주고, 묶음째 또는 고른 것만 원래 큐로 되돌린다. 버리기는 원문을 보고 판단해야 해서
 * 상세에서만 한다.
 */
export function AdminDeadLetterList() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  // 주소 값은 누구나 바꿔 넣을 수 있어 아는 값일 때만 쓰고, 아니면 기본값으로 둔다.
  const tab =
    deadLetterTabs.find((item) => item.value === searchParams.get(PARAM.tab)) ??
    deadLetterTabs.find((item) => item.value === DEFAULT_TAB)!
  // 서버가 모르는 종류도 거를 수 있어 이벤트만은 그대로 받는다.
  const eventType = searchParams.get(PARAM.eventType) ?? ALL
  const failureReason =
    deadLetterFailureReasons.find(
      (reason) => reason === searchParams.get(PARAM.failureReason),
    ) ?? ALL
  const setParam = (key: string, value: string, fallback: string) =>
    setSearchParams(
      (prev) => {
        if (value === fallback) prev.delete(key)
        else prev.set(key, value)
        return prev
      },
      { replace: true },
    )

  const now = useNow(NOW_INTERVAL_MS).getTime()
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(
    DEFAULT_REFRESH_INTERVAL,
  )
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>()

  const statuses: readonly string[] = tab.statuses
  const deadLetters = useDeadLetters(
    {
      // 서버는 상태를 하나만 거른다. 둘 이상 묶은 탭(결과 기다림)은 전체를 받아 여기서
      // 거른다 — 되돌리기 결과를 기다리는 건 방금 보낸 것이라 최근 100건 안에 든다.
      status: tab.statuses.length === 1 ? tab.statuses[0] : undefined,
      eventType: eventType === ALL ? undefined : eventType,
      failureReason: failureReason === ALL ? undefined : failureReason,
      size: PAGE_SIZE,
    },
    refreshInterval,
  )
  const counts = useDeadLetterCounts(refreshInterval)
  const redrive = useRedriveDeadLetters()

  const fetched = deadLetters.data?.items
  const items = fetched
    ?.filter((item) => statuses.length === 0 || statuses.includes(item.status))
    // 처리 대기는 오래 멈춘 것부터, 나머지는 서버 순서(최신순) 그대로.
    .sort((a, b) =>
      tab.value === 'open' ? a.createdAt.localeCompare(b.createdAt) : 0,
    )
  const groups = tab.value === 'open' ? groupDeadLetters(items ?? []) : []
  const redrivable = (items ?? []).filter((item) => item.redrivable)
  const selectedIds = redrivable
    .filter((item) => selected.has(item.deadLetterId))
    .map((item) => item.deadLetterId)
  const allSelected =
    redrivable.length > 0 &&
    redrivable.every((item) => selected.has(item.deadLetterId))

  const toggle = (ids: string[], checked: boolean) =>
    setSelected((prev) => toggleInSet(prev, ids, checked))

  const countOf = (statusesOfTab: readonly string[]) => {
    const values = (
      statusesOfTab.length > 0 ? statusesOfTab : Object.keys(counts)
    ).map((status) => counts[status as keyof typeof counts])
    return values.some((value) => value === undefined)
      ? undefined
      : values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
  }

  const confirmRedrive = (ids: string[]) => {
    openModal({
      theme: 'light',
      title: `${ids.length}건을 되돌릴까요?`,
      description:
        '고른 메시지를 원래 큐로 다시 보냅니다. 원인을 고친 뒤에 보내야 다시 실패하지 않습니다. 초당 20건씩 천천히 보냅니다.',
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
                `${targetCount}건을 되돌리는 중입니다(약 ${estimatedSeconds}초). 결과 기다림 탭에서 이어서 볼 수 있습니다.`,
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

  // 상세의 '돌아가기'가 지금 고른 조건 그대로의 목록을 가리키게 한다.
  const backTo: BackTo = {
    label: '이벤트 DLQ',
    to: location.pathname + location.search,
  }
  const openDetail = (item: DeadLetter) =>
    navigate(adminDeadLetterPath(item.deadLetterId), { state: { backTo } })

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
        item.redrivable ? (
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
        ) : (
          <span
            className={styles.subText}
            title="원문을 읽을 수 없어 되돌릴 수 없어요"
          >
            —
          </span>
        ),
    },
    {
      key: 'event',
      header: '반영 안 된 처리',
      render: (item) => (
        <span className={styles.stacked}>
          <span className={styles.strong}>
            {item.eventType === null
              ? '알 수 없음'
              : deadLetterEventLabel(item.eventType)}
          </span>
          <span className={styles.code}>
            {item.eventType ?? `원문을 읽지 못함 · ${item.messageId}`}
          </span>
        </span>
      ),
    },
    {
      key: 'reason',
      header: '실패 이유',
      render: (item) => (
        <span className={styles.inline}>
          <Tag size="small" {...deadLetterFailureReasonTag[item.failureReason]}>
            {deadLetterFailureReasonLabel[item.failureReason]}
          </Tag>
          {item.redrivenFromId && (
            <Link
              className={styles.subLink}
              to={adminDeadLetterPath(item.redrivenFromId)}
              state={{ backTo }}
              onClick={(event) => event.stopPropagation()}
            >
              이전 실패
            </Link>
          )}
        </span>
      ),
    },
    {
      key: 'preorder',
      header: '관련 예약',
      render: (item) =>
        item.preorderId ? (
          <Link
            className={styles.link}
            to={adminReservationPath(item.preorderId)}
            state={{ backTo }}
            onClick={(event) => event.stopPropagation()}
          >
            {reservationNo(item.preorderId)}
          </Link>
        ) : (
          <span className={styles.subText}>예약과 무관</span>
        ),
    },
    {
      key: 'receive',
      header: '받은 횟수',
      align: 'right',
      render: (item) => `${item.receiveCount}회`,
    },
    {
      key: 'at',
      header: '멈춘 지',
      render: (item) => (
        <span className={styles.stacked}>
          {formatDistance(now - Date.parse(item.createdAt))} 전
          <span className={styles.subText}>
            {formatDotDateTime(item.createdAt)}
          </span>
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
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
  ]

  return (
    <div className={styles.root}>
      <div className={styles.topRow}>
        <SegmentedTabs
          items={deadLetterTabs.map((item) => {
            const count = countOf(item.statuses)
            return {
              value: item.value,
              label: (
                <span className={styles.tabLabel}>
                  {item.label}
                  {count !== undefined && (
                    <span
                      className={
                        item.value === 'open' && count > 0
                          ? styles.tabCountHot
                          : styles.tabCount
                      }
                    >
                      {formatNumber(count)}
                    </span>
                  )}
                </span>
              ),
            }
          })}
          value={tab.value}
          onChange={(next) => {
            setSelected(new Set())
            setParam(PARAM.tab, next, DEFAULT_TAB)
          }}
        />
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
      </div>

      {/* 다시 받기가 실패해도 이전 목록은 남는다 — 멈춘 목록을 최신으로 읽지 않게 알린다. */}
      {pollingError(deadLetters) !== null && (
        <InlineAlert status={items ? 'warning' : 'error'}>
          {getErrorMessage(
            pollingError(deadLetters),
            '메시지를 불러오지 못했습니다.',
          )}
          {items && ' 아래 목록은 마지막으로 받은 값입니다.'}
        </InlineAlert>
      )}
      {feedback && (
        <InlineAlert status={feedback.status}>{feedback.message}</InlineAlert>
      )}

      {groups.length > 0 && (
        <Panel
          title={
            <>
              무엇이 멈췄나
              <span className={styles.titleNote}>
                처리 대기 {formatNumber(items?.length ?? 0)}건을 같은 원인끼리
                묶었어요
              </span>
            </>
          }
          aside="원인을 고친 뒤 묶음째 되돌리면 한 건씩 고르지 않아도 돼요"
        >
          <DeadLetterGroups
            groups={groups}
            now={now}
            busy={redrive.isPending}
            onRedrive={confirmRedrive}
            onOpen={openDetail}
          />
        </Panel>
      )}

      <Panel
        title={
          <>
            메시지 {formatNumber(items?.length ?? 0)}건
            <span className={styles.titleNote}>
              {tab.value === 'open' ? '오래 멈춘 것부터' : '최근에 쌓인 것부터'}
            </span>
          </>
        }
        aside={
          <>
            <Dropdown
              label="반영 안 된 처리"
              size="small"
              width="220px"
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
          </>
        }
      >
        {selectedIds.length > 0 && (
          <div className={styles.selectionBar} role="status">
            <span className={styles.strong}>{selectedIds.length}건 선택</span>
            <span>· 원문을 읽을 수 없는 메시지는 고를 수 없어요</span>
            <div className={styles.selectionActions}>
              <Button
                size="small"
                disabled={redrive.isPending}
                onClick={() => confirmRedrive(selectedIds)}
              >
                {redrive.isPending
                  ? '되돌리는 중…'
                  : `선택 되돌리기 ${selectedIds.length}건`}
              </Button>
              <Button
                size="small"
                variant="outline"
                onClick={() => setSelected(new Set())}
              >
                선택 해제
              </Button>
            </div>
          </div>
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
              : tab.value === 'open'
                ? '멈춘 메시지가 없어요. 평소엔 이게 정상이에요.'
                : '조건에 맞는 메시지가 없습니다.'
          }
        />
      </Panel>

      <div className={styles.subText}>
        받은 횟수 = DLQ로 오기 전까지 서버가 처리하려고 받은 횟수.
        {deadLetters.data &&
          deadLetters.data.total > PAGE_SIZE &&
          ` 전체 ${formatNumber(deadLetters.data.total)}건 중 최근 ${PAGE_SIZE}건만 보입니다. 조건을 좁혀 주세요.`}
      </div>
    </div>
  )
}
