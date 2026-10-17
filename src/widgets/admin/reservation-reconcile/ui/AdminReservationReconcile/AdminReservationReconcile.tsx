import { useState } from 'react'

import { useLocation, useNavigate, useSearchParams } from 'react-router'

import {
  preorderStatusLabel,
  reservationNo,
  useAllAdminReservations,
  useReprocessReservation,
  useReprocessReservations,
} from '@entities/admin-reservation'
import {
  externalStatusLabel,
  useExternalLedger,
} from '@entities/external-reservation'
import { getErrorMessage } from '@shared/api/client'
import { adminReservationPath, type BackTo } from '@shared/config/routes'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  InlineAlert,
  SegmentedTabs,
  StatCard,
  Table,
  Tag,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import {
  canReprocess,
  reconcile,
  reconcileKindColor,
  reconcileKindDescription,
  reconcileKindLabel,
  reconcileKinds,
  type ReconcileIssue,
  type ReconcileKind,
} from '../../lib/reconcile'

import * as styles from './AdminReservationReconcile.css'

export type AdminReservationReconcileProps = {
  /** 고른 사전예약 상품. 없으면 전체 */
  productId?: string
  /** 상품 id → 이름. 외부에만 있는 예약은 우리 예약이 없어 이름을 여기서 찾는다 */
  productNames: ReadonlyMap<string, string>
}

type KindFilter = 'all' | ReconcileKind

type Feedback = { status: 'success' | 'error'; message: string }

// 상세에 갔다 돌아와도 같은 탭이 보이게 주소(?kind=)에 둔다.
const KIND_PARAM = 'kind'
const toKindFilter = (value: string | null): KindFilter =>
  reconcileKinds.find((kind) => kind === value) ?? 'all'

// 행마다 다른 유형 태그를 가장 긴 이름 폭으로 맞춘다.
const kindLabels = reconcileKinds.map((kind) => reconcileKindLabel[kind])

// 재처리 대상이 아닌 건에 관리자가 할 일. 처리 API가 없는 건은 개발팀이 맡는다.
const hintOf = (issue: ReconcileIssue) =>
  issue.kind === 'STALE' ? '처리 중입니다' : '개발팀 문의'

/**
 * 우리 예약과 외부 예약 시스템을 맞춰 본다. 양쪽 전체를 받아야 해서 들어올 때 한 번,
 * 그 뒤엔 '대조 실행'을 눌렀을 때만 한다. 상품·탭을 바꾸면 받은 결과를 다시 거르기만 한다.
 */
export function AdminReservationReconcile({
  productId,
  productNames,
}: AdminReservationReconcileProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const kindFilter = toKindFilter(searchParams.get(KIND_PARAM))
  const setKindFilter = (next: KindFilter) =>
    setSearchParams(
      (prev) => {
        if (next === 'all') prev.delete(KIND_PARAM)
        else prev.set(KIND_PARAM, next)
        return prev
      },
      { replace: true },
    )

  // 고른 건 / 이번 대조에서 이미 재처리를 보낸 건(예약 id). 다시 대조하면 비운다.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [requested, setRequested] = useState<ReadonlySet<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>()

  const reservations = useAllAdminReservations()
  const ledger = useExternalLedger()
  const reprocessOne = useReprocessReservation()
  const reprocessMany = useReprocessReservations()
  const reprocessing = reprocessOne.isPending || reprocessMany.isPending

  const running = reservations.isFetching || ledger.isFetching
  const runError = reservations.error ?? ledger.error
  const ran = reservations.data !== undefined && ledger.data !== undefined
  // 둘 중 늦게 받은 쪽이 아니라 먼저 받은 쪽 시각 — 그때부터의 변화는 아직 안 봤다.
  const ranAt = Math.min(reservations.dataUpdatedAt, ledger.dataUpdatedAt)

  const run = () => {
    setSelected(new Set())
    setRequested(new Set())
    setFeedback(undefined)
    void reservations.refetch()
    void ledger.refetch()
  }

  const issues = ran
    ? reconcile(reservations.data, ledger.data).filter(
        (issue) => !productId || issue.productId === productId,
      )
    : []
  const visibleIssues = issues.filter(
    (issue) => kindFilter === 'all' || issue.kind === kindFilter,
  )

  // 서버 재처리는 비동기라 바로 대조해도 그대로 보인다 — 보낸 건은 다시 못 고르게 둔다.
  const selectable = (issue: ReconcileIssue) =>
    canReprocess(issue) && !requested.has(issue.key)
  const visibleSelectable = visibleIssues.filter(selectable)
  const selectedKeys = issues
    .filter((issue) => selectable(issue) && selected.has(issue.key))
    .map((issue) => issue.key)
  const allVisibleSelected =
    visibleSelectable.length > 0 &&
    visibleSelectable.every((issue) => selected.has(issue.key))

  const toggle = (keys: string[], checked: boolean) =>
    setSelected((prev) => toggleInSet(prev, keys, checked))

  const markRequested = (keys: string[], message: string) => {
    setRequested((prev) => new Set([...prev, ...keys]))
    setSelected(new Set())
    setFeedback({ status: 'success', message })
  }
  const showFailure = (caught: unknown) =>
    setFeedback({
      status: 'error',
      message: getErrorMessage(caught, '재처리를 요청하지 못했습니다.'),
    })

  // 외부로 등록을 다시 보내는 조치라 한 번 더 묻는다.
  const confirmReprocessOne = (issue: ReconcileIssue) =>
    openModal({
      theme: 'light',
      title: '재처리를 시도할까요?',
      description: `예약 ${reservationNo(issue.key)}을(를) 외부 예약 시스템에 다시 등록합니다.`,
      confirmLabel: '재처리',
      onConfirm: () => {
        closeModal()
        setFeedback(undefined)
        reprocessOne.mutate(issue.key, {
          onSuccess: () =>
            markRequested(
              [issue.key],
              `${reservationNo(issue.key)} 재처리를 요청했습니다. 잠시 뒤 대조를 다시 실행해 확인해 주세요.`,
            ),
          onError: showFailure,
        })
      },
    })

  const confirmReprocessSelected = () => {
    const keys = selectedKeys
    openModal({
      theme: 'light',
      title: `${keys.length}건을 재처리할까요?`,
      description:
        '고른 예약을 외부 예약 시스템에 다시 등록합니다. 차례로 처리돼서 반영까지 몇 초 걸릴 수 있습니다.',
      confirmLabel: '재처리',
      onConfirm: () => {
        closeModal()
        setFeedback(undefined)
        reprocessMany.mutate(keys, {
          onSuccess: ({ targetCount, skippedCount, estimatedSeconds }) =>
            markRequested(
              keys,
              [
                `${targetCount}건 재처리를 요청했습니다(약 ${estimatedSeconds}초).`,
                skippedCount > 0 &&
                  `${skippedCount}건은 이미 처리됐거나 상태가 바뀌어 건너뛰었습니다.`,
                '잠시 뒤 대조를 다시 실행해 확인해 주세요.',
              ]
                .filter(Boolean)
                .join(' '),
            ),
          onError: showFailure,
        })
      },
    })
  }

  const tabs = [
    { value: 'all' as const, label: '전체' },
    ...reconcileKinds.map((kind) => ({
      value: kind,
      label: reconcileKindLabel[kind],
    })),
  ]

  const cards = [
    { label: '전체', count: issues.length },
    ...reconcileKinds.map((kind) => ({
      label: reconcileKindLabel[kind],
      count: issues.filter((issue) => issue.kind === kind).length,
    })),
  ]

  const productName = (issue: ReconcileIssue) =>
    issue.reservation?.productTitle ??
    (issue.productId && productNames.get(issue.productId)) ??
    '—'

  const columns: TableColumn<ReconcileIssue>[] = [
    {
      key: 'select',
      header: (
        <Checkbox
          aria-label="재처리할 수 있는 건 모두 선택"
          checked={allVisibleSelected}
          disabled={visibleSelectable.length === 0 || reprocessing}
          onChange={(event) =>
            toggle(
              visibleSelectable.map((issue) => issue.key),
              event.target.checked,
            )
          }
        />
      ),
      align: 'center',
      width: '56px',
      render: (issue) =>
        selectable(issue) && (
          <Checkbox
            aria-label={`${reservationNo(issue.key)} 선택`}
            checked={selected.has(issue.key)}
            disabled={reprocessing}
            // 행 전체가 상세로 가는 버튼이라, 고르기만 하고 머문다.
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => toggle([issue.key], event.target.checked)}
          />
        ),
    },
    {
      key: 'kind',
      header: '유형',
      align: 'center',
      render: (issue) => (
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={reconcileKindColor[issue.kind]}
          widthOptions={kindLabels}
        >
          {reconcileKindLabel[issue.kind]}
        </Tag>
      ),
    },
    {
      key: 'no',
      header: '예약 번호',
      align: 'center',
      render: (issue) => (issue.reservation ? reservationNo(issue.key) : '—'),
    },
    {
      key: 'product',
      header: '모델',
      align: 'center',
      render: productName,
    },
    {
      key: 'ours',
      header: '우리 예약',
      align: 'center',
      render: (issue) =>
        issue.reservation
          ? preorderStatusLabel[issue.reservation.status]
          : '없음',
    },
    {
      key: 'external',
      header: '외부 예약',
      align: 'center',
      render: (issue) =>
        issue.external ? (
          <span className={styles.stacked}>
            {externalStatusLabel[issue.external.status]}
            {issue.external.externalNumber && (
              <span className={styles.subText}>
                {issue.external.externalNumber}
              </span>
            )}
          </span>
        ) : (
          '없음'
        ),
    },
    {
      key: 'reason',
      header: '내용',
      render: (issue) => issue.reason,
    },
    {
      key: 'action',
      header: '조치',
      align: 'center',
      width: '120px',
      render: (issue) =>
        requested.has(issue.key) ? (
          <span className={styles.subText}>재처리 요청함</span>
        ) : canReprocess(issue) ? (
          <Button
            size="small"
            disabled={reprocessing}
            onClick={(event) => {
              event.stopPropagation()
              confirmReprocessOne(issue)
            }}
          >
            재처리
          </Button>
        ) : (
          <span className={styles.subText}>{hintOf(issue)}</span>
        ),
    },
  ]

  // 우리 예약이 있는 건만 상세로 간다 — 외부에만 있는 예약은 열 화면이 없다.
  // 상세의 '돌아가기'가 예약 현황이 아니라 고른 상품·탭 그대로의 이 화면을 가리키게 한다.
  const openDetail = (issue: ReconcileIssue) => {
    if (!issue.reservation) return
    const backTo: BackTo = {
      label: '외부 예약 대조',
      to: location.pathname + location.search,
    }
    navigate(adminReservationPath(issue.key), { state: { backTo } })
  }

  return (
    <div className={styles.root}>
      <div className={styles.runBar}>
        <span className={styles.subText}>
          {running
            ? '우리 예약과 외부 예약 시스템을 비교하는 중입니다…'
            : ran
              ? `마지막 대조 ${formatDotDateTime(new Date(ranAt).toISOString())}`
              : '아직 대조하지 않았습니다.'}
        </span>
        <Button
          size="small"
          className={styles.runButton}
          disabled={running}
          onClick={run}
        >
          {running ? '대조 중…' : '대조 실행'}
        </Button>
      </div>

      <div className={styles.cards}>
        {cards.map(({ label, count }) => (
          <StatCard
            key={label}
            label={label}
            muted={!ran}
            value={
              ran
                ? `${count.toLocaleString('ko-KR')}건`
                : running
                  ? '대조 중'
                  : '대조 전'
            }
          />
        ))}
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>대조 결과</h2>
        <div className={styles.note}>
          우리 예약과 외부 예약 시스템을 비교합니다. 예약이 많으면 시간이 걸릴
          수 있습니다. 방금 들어온 예약(1분 이내)은 빼고 비교합니다.
        </div>

        {runError != null && (
          <InlineAlert status="error">
            {getErrorMessage(runError, '대조에 필요한 목록을 받지 못했습니다.')}
          </InlineAlert>
        )}

        {feedback && (
          <InlineAlert status={feedback.status}>{feedback.message}</InlineAlert>
        )}

        <div className={styles.toolbar}>
          <SegmentedTabs
            items={tabs}
            value={kindFilter}
            onChange={setKindFilter}
          />
          <Button
            size="small"
            variant="outline"
            className={styles.runButton}
            disabled={selectedKeys.length === 0 || reprocessing}
            onClick={confirmReprocessSelected}
          >
            {reprocessMany.isPending
              ? '재처리 요청 중…'
              : `선택 재처리 ${selectedKeys.length}건`}
          </Button>
        </div>
        {kindFilter !== 'all' && (
          <div className={styles.note}>
            {reconcileKindDescription[kindFilter]}
          </div>
        )}

        <Table
          columns={columns}
          rows={visibleIssues}
          rowKey={(issue) => `${issue.kind}-${issue.key}`}
          pageSize={10}
          onRowClick={openDetail}
          emptyMessage={
            running
              ? '대조하는 중입니다.'
              : ran
                ? '어긋난 예약이 없습니다.'
                : '대조 실행을 누르면 우리 예약과 외부 예약 시스템을 비교합니다.'
          }
        />
      </section>
    </div>
  )
}
