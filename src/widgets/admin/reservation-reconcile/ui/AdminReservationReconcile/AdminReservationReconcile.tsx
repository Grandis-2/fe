import { useState } from 'react'

import { ChevronRight } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import {
  PartialReprocessError,
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
  Dropdown,
  InlineAlert,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import {
  canReprocess,
  reconcile,
  reconcileKindColor,
  reconcileKindDescription,
  reconcileKindLabel,
  reconcileKinds,
  reconcileWrongSide,
  type ReconcileIssue,
  type ReconcileKind,
} from '../../lib/reconcile'

import * as styles from './AdminReservationReconcile.css'

type KindFilter = 'all' | ReconcileKind

type Feedback = { status: 'success' | 'error'; message: string }

// 상세에 갔다 돌아와도 같은 탭·상품이 보이게 주소(?kind=·?product=)에 둔다.
const KIND_PARAM = 'kind'
const PRODUCT_PARAM = 'product'
const toKindFilter = (value: string | null): KindFilter =>
  reconcileKinds.find((kind) => kind === value) ?? 'all'

// 재처리 대상이 아닌 건에 관리자가 할 일. 처리 API가 없는 건은 개발팀이 맡는다.
const hintOf = (issue: ReconcileIssue) =>
  issue.kind === 'STALE' ? '자동 재시도 중' : '개발팀 문의'

/**
 * 외부 예약 대조 화면 — 우리 예약과 외부 예약 시스템을 맞춰 본다. 양쪽 전체를 받아야 해서
 * 들어올 때 한 번, 그 뒤엔 '대조 실행'을 눌렀을 때만 한다. 상품·탭을 바꾸면 받은 결과를
 * 다시 거르기만 한다. 대조 실행이 제목 줄에 붙어 제목까지 이 위젯이 그린다.
 */
export function AdminReservationReconcile() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(
      (prev) => {
        if (value === undefined) prev.delete(key)
        else prev.set(key, value)
        return prev
      },
      { replace: true },
    )
  const kindFilter = toKindFilter(searchParams.get(KIND_PARAM))
  const setKindFilter = (next: KindFilter) =>
    setParam(KIND_PARAM, next === 'all' ? undefined : next)
  // 상품명은 겹칠 수 있어 이름이 아니라 productId로 고른다.
  const productId = searchParams.get(PRODUCT_PARAM) ?? undefined
  const setProductId = (next: string | undefined) =>
    setParam(PRODUCT_PARAM, next)

  const { data: products = [] } = useAdminProducts({ saleMode: 'PREORDER' })
  // 값이 undefined인 첫 항목이 '전체 상품' — 외부에만 있는 등록까지 다 본다.
  const productOptions: DropdownOption<string | undefined>[] = [
    { label: '전체 상품', value: undefined },
    ...products.map((product) => ({
      label: product.name,
      value: product.productId,
    })),
  ]
  // 외부에만 있는 예약은 우리 예약이 없어 상품 이름을 여기서 찾는다.
  const productNames = new Map(
    products.map((product) => [product.productId, product.name]),
  )

  // 고른 건 / 이번 대조에서 이미 재처리를 보낸 건(예약 id). 다시 대조하면 비운다.
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [requested, setRequested] = useState<ReadonlySet<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>()

  const reservations = useAllAdminReservations()
  // 둘 다 무거워 들어와도 받지 않는다 — '대조 실행'을 눌러야 받는다.
  const ledger = useExternalLedger({ enabled: false })
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
          onError: (caught) => {
            // 앞 묶음은 접수됐다 — 접수된 건은 다시 못 고르게 하고, 보내지 못한 건만 고르게 둔다.
            if (caught instanceof PartialReprocessError) {
              const unsent = new Set(caught.unsentPreorderIds)
              setRequested(
                (prev) =>
                  new Set([...prev, ...keys.filter((key) => !unsent.has(key))]),
              )
              setSelected(unsent)
              setFeedback({ status: 'error', message: caught.message })
              return
            }
            showFailure(caught)
          },
        })
      },
    })
  }

  // 건수는 탭에 붙인다 — 따로 카드를 두면 같은 숫자를 두 번 읽는다. 대조 전엔 숫자를 뺀다.
  const tabLabel = (label: string, count: number) => (
    <span className={styles.tabLabel}>
      {label}
      {ran && (
        <span className={count > 0 ? styles.tabCount : styles.tabCountZero}>
          {count.toLocaleString('ko-KR')}
        </span>
      )}
    </span>
  )
  const tabs = [
    { value: 'all' as const, label: tabLabel('전체', issues.length) },
    ...reconcileKinds.map((kind) => ({
      value: kind,
      label: tabLabel(
        reconcileKindLabel[kind],
        issues.filter((issue) => issue.kind === kind).length,
      ),
    })),
  ]

  const productName = (issue: ReconcileIssue) =>
    issue.reservation?.productTitle ??
    (issue.productId && productNames.get(issue.productId)) ??
    '—'

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
      render: (issue) => (
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={reconcileKindColor[issue.kind]}
        >
          {reconcileKindLabel[issue.kind]}
        </Tag>
      ),
    },
    // 번호 아래 상품 — 외부에만 있는 건은 우리 번호가 없어 외부 번호를 붙인다.
    {
      key: 'reservation',
      header: '예약',
      render: (issue) => (
        <span className={styles.stacked}>
          <span className={styles.mainText}>
            {issue.reservation ? reservationNo(issue.key) : '—'}
          </span>
          <span className={styles.subText}>
            {[
              productName(issue),
              issue.reservation?.optionTitle ?? issue.external?.externalNumber,
            ]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
      ),
    },
    // 우리와 외부를 한 칸에 맞대고, 어긋난 쪽만 빨갛게 한다.
    {
      key: 'compare',
      header: '양쪽 상태',
      render: (issue) => {
        const wrong = reconcileWrongSide[issue.kind]
        const ours = issue.reservation
          ? preorderStatusLabel[issue.reservation.status]
          : '없음'
        const external = issue.external
          ? [
              externalStatusLabel[issue.external.status],
              issue.reservation && issue.external.externalNumber,
            ]
              .filter(Boolean)
              .join(' · ')
          : '없음'
        return (
          <span className={styles.compare}>
            <span className={styles.side}>우리</span>
            <span
              className={
                wrong === 'ours' ? styles.sideValueWrong : styles.sideValue
              }
            >
              {ours}
            </span>
            <span className={styles.side}>외부</span>
            <span
              className={
                wrong === 'external' ? styles.sideValueWrong : styles.sideValue
              }
            >
              {external}
            </span>
          </span>
        )
      },
    },
    {
      key: 'reason',
      header: '내용',
      render: (issue) => (
        <span className={styles.cellText}>{issue.reason}</span>
      ),
    },
    {
      key: 'action',
      header: '조치',
      width: '120px',
      render: (issue) =>
        requested.has(issue.key) ? (
          <span className={styles.hint}>재처리 요청함</span>
        ) : canReprocess(issue) ? (
          <Button
            size="small"
            variant="outline"
            disabled={reprocessing}
            onClick={(event) => {
              event.stopPropagation()
              confirmReprocessOne(issue)
            }}
          >
            재처리
          </Button>
        ) : (
          <span className={styles.hint}>{hintOf(issue)}</span>
        ),
    },
    // 공통 Table의 rowAction은 모든 행에 붙어서, 열 상세가 있는 건에만 직접 둔다.
    {
      key: 'detail',
      header: '',
      align: 'center',
      width: '56px',
      render: (issue) =>
        issue.reservation && (
          <button
            type="button"
            className={styles.detailButton}
            aria-label={`${reservationNo(issue.key)} 상세 보기`}
            onClick={(event) => {
              event.stopPropagation()
              openDetail(issue)
            }}
          >
            <ChevronRight className={styles.detailIcon} aria-hidden="true" />
          </button>
        ),
    },
  ]

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>외부 예약 대조</h1>
        <div className={styles.runStatus}>
          <span>
            {running
              ? '비교하는 중…'
              : ran
                ? `마지막 대조 ${formatDotDateTime(new Date(ranAt).toISOString())}`
                : '아직 대조하지 않았습니다.'}
          </span>
          <Button size="small" disabled={running} onClick={run}>
            {running ? '대조 중…' : '대조 실행'}
          </Button>
        </div>
      </header>

      <div className={styles.note}>
        우리 예약과 외부 예약 시스템을 비교해 어긋난 건만 보여줍니다. 방금
        들어온 예약(1분 이내)은 빼고 비교합니다.
      </div>

      {runError != null && (
        <InlineAlert status="error">
          {getErrorMessage(runError, '대조에 필요한 목록을 받지 못했습니다.')}
        </InlineAlert>
      )}

      {feedback && (
        <InlineAlert status={feedback.status}>{feedback.message}</InlineAlert>
      )}

      <SegmentedTabs items={tabs} value={kindFilter} onChange={setKindFilter} />
      {kindFilter !== 'all' && (
        <div className={styles.note}>
          {reconcileKindDescription[kindFilter]}
        </div>
      )}

      <div className={styles.filters}>
        <Dropdown
          className={styles.field}
          label="전체 상품"
          fieldLabel="상품"
          options={productOptions}
          value={productId}
          onSelect={setProductId}
        />
      </div>

      {visibleSelectable.length > 0 && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionCount}>
            {selectedKeys.length.toLocaleString('ko-KR')}건 선택됨
          </span>
          <Button
            size="small"
            disabled={selectedKeys.length === 0 || reprocessing}
            onClick={confirmReprocessSelected}
          >
            {reprocessMany.isPending ? '재처리 요청 중…' : '선택한 예약 재처리'}
          </Button>
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
    </div>
  )
}
