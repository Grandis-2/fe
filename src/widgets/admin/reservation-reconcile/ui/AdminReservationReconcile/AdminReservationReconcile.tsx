import { useState } from 'react'

import { ChevronRight } from 'lucide-react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'

import {
  canAct,
  canBatchExternalCancel,
  codesOfGroup,
  countByGroup,
  EXTERNAL_CANCEL_BATCH_MAX,
  FINDING_CANCEL_REASON_MAX,
  findingDescription,
  findingGroupLabel,
  findingGroupOf,
  findingGroups,
  isRunActive,
  useCancelFinding,
  useExternalCancelFinding,
  useExternalCancelFindings,
  useReconciliationFindings,
  useReconciliationRuns,
  useReprocessFinding,
  useStartReconciliationRun,
  type FindingGroup,
  type ReconcileFinding,
  type ReconcileRun,
} from '@entities/admin-reconciliation'
import {
  preorderStatusLabel,
  reservationNo,
  useAdminReservation,
} from '@entities/admin-reservation'
import { externalStatusLabel } from '@entities/external-reservation'
import { ApiRequestError, getErrorMessage } from '@shared/api/client'
import { adminReservationPath, type BackTo } from '@shared/config/routes'
import { formatShortDateTime } from '@shared/lib/formatDotDate'
import { toggleInSet } from '@shared/lib/toggleInSet'
import { useClampPage } from '@shared/lib/useClampPage'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Checkbox,
  Dropdown,
  InlineAlert,
  Navigator,
  ReasonForm,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { DropdownOption, TableColumn } from '@shared/ui'

import * as styles from './AdminReservationReconcile.css'

type TabValue = 'all' | FindingGroup

type Feedback = {
  status: 'success' | 'info' | 'warning' | 'error'
  message: string
}

const PAGE_SIZE = 10

// 상세에 갔다 돌아와도 같은 탭·상품·쪽이 보이게 주소에 둔다.
const PARAM = { tab: 'tab', product: 'product', page: 'page' } as const

const groupTagColor: Record<
  FindingGroup,
  'red' | 'primary' | 'yellow' | 'gray'
> = {
  externalCancel: 'red',
  reprocess: 'primary',
  reservationCancel: 'yellow',
  manual: 'gray',
}

// 어긋난 쪽 — 그 칸만 빨갛게 한다. 고칠 쪽이 정해지지 않은 수동 조사는 칠하지 않는다.
const wrongSideOf = (finding: ReconcileFinding): 'ours' | 'external' | null => {
  if (finding.checkCode === 'MOCK_ONLY') return 'ours'
  const group = findingGroupOf(finding.checkCode)
  if (group === 'externalCancel') return 'external'
  if (group === 'reprocess' || group === 'reservationCancel') return 'ours'
  return null
}

const text = (value: unknown) => (typeof value === 'string' ? value : null)

// 우리 쪽 스냅숏이 예약 모양인가 — STUCK(이벤트·시도)·OUTBOX_MISSING·QUEUE_GAP·
// PAID_BUT_REGISTERED는 예약이 아닌 다른 모양이 와서 status가 없다(be 문서 4장).
const isReservationSnapshot = (finding: ReconcileFinding) =>
  text(finding.beSnapshot?.status) !== null

// 스냅숏은 검사 종류마다 모양이 달라 아는 칸만 읽는다.
const oursOf = (finding: ReconcileFinding) => {
  const { beSnapshot } = finding
  if (!beSnapshot) return '없음'
  if (!isReservationSnapshot(finding)) return '—'
  const status = text(beSnapshot.status)
  return (
    [
      status && status in preorderStatusLabel
        ? preorderStatusLabel[status as keyof typeof preorderStatusLabel]
        : status,
      text(beSnapshot.externalReference),
    ]
      .filter(Boolean)
      .join(' · ') || '있음'
  )
}

const externalOf = ({ mockSnapshot }: ReconcileFinding) => {
  if (!mockSnapshot) return '없음'
  const status = text(mockSnapshot.status)
  return (
    [
      status && status in externalStatusLabel
        ? externalStatusLabel[status as keyof typeof externalStatusLabel]
        : status,
      text(mockSnapshot.externalNumber),
    ]
      .filter(Boolean)
      .join(' · ') || '있음'
  )
}

// 우리 예약이 있는 건만 예약 번호와 상세가 있다 — targetKey가 예약 id(관리자 API의
// preorderId)다. QUEUE_GAP과 회차 이벤트의 STUCK은 targetKey가 상품 id라 빠진다.
const hasReservation = isReservationSnapshot

const numberOf = (finding: ReconcileFinding) =>
  hasReservation(finding)
    ? reservationNo(finding.targetKey)
    : (text(finding.mockSnapshot?.externalNumber) ?? '—')

const runMeta = (run: ReconcileRun) =>
  [
    `마지막 검사 ${formatShortDateTime(run.finishedAt ?? run.createdAt)}`,
    run.requestedBy ? '직접 요청' : '자동',
    run.productName ?? (run.productId ? '상품 하나' : '전체 상품'),
  ].join(' · ')

const startErrorFeedback = (caught: unknown): Feedback => {
  const code = caught instanceof ApiRequestError ? caught.error.code : null
  if (code === 'RECONCILIATION_RUN_ACTIVE')
    return {
      status: 'info',
      message:
        '이미 검사 중이에요. 다른 관리자나 자동 검사가 돌고 있어요. 끝나면 결과가 여기 보여요.',
    }
  if (code === 'RECONCILIATION_INTAKE_RUSH')
    return {
      status: 'warning',
      message:
        '오픈 직후 1시간은 검사할 수 없어요. 접수가 몰리는 동안 서버 부담을 줄이려고 막아 둬요. 잠시 뒤 다시 눌러 주세요.',
    }
  return {
    status: 'error',
    message: getErrorMessage(caught, '검사를 요청하지 못했어요.'),
  }
}

/**
 * 외부 예약 대조 — 서버가 우리 예약과 외부 예약 시스템을 맞춰 본 검사 결과를 보여주고, 어긋난
 * 건을 고친다. 검사는 서버가 매일 정기로 돌리고, '지금 검사'로 바로 요청할 수도 있다. 결과는
 * 검사가 끝날 때만 바뀌어 평소엔 거의 묻지 않는다(검사 중일 때만 몇 초마다).
 */
export function AdminReservationReconcile() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  // 쪽 말고 다른 조건이 바뀌면 첫 쪽으로 돌아간다.
  const setParam = (key: string, value: string | undefined) =>
    setSearchParams(
      (prev) => {
        if (value === undefined) prev.delete(key)
        else prev.set(key, value)
        if (key !== PARAM.page) prev.delete(PARAM.page)
        return prev
      },
      { replace: true },
    )
  const tab: TabValue =
    findingGroups.find((group) => group === searchParams.get(PARAM.tab)) ??
    'all'
  const productId = searchParams.get(PARAM.product) ?? undefined
  const pageParam = Number(searchParams.get(PARAM.page))
  const page = Number.isSafeInteger(pageParam) && pageParam >= 1 ? pageParam : 1

  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set())
  const [feedback, setFeedback] = useState<Feedback>()

  const runs = useReconciliationRuns()
  const latest = runs.data?.[0]
  const running = latest !== undefined && isRunActive(latest)
  // 표는 마지막으로 끝난 검사로 그린다 — 도는 중이거나 실패한 검사엔 불일치가 없다.
  const shown = runs.data?.find((run) => run.status === 'COMPLETED')
  const failed = latest?.status === 'FAILED' ? latest : undefined
  const counts = countByGroup(shown?.findingCounts ?? {})
  const checkCodes =
    tab === 'all' ? [] : codesOfGroup(tab, shown?.findingCounts ?? {})
  // 고른 묶음이 이번 검사에 없으면 묻지 않고 빈 표로 둔다.
  const emptyGroup = tab !== 'all' && checkCodes.length === 0

  const findings = useReconciliationFindings(
    emptyGroup ? undefined : shown?.runId,
    { checkCodes, productId, page: page - 1, size: PAGE_SIZE },
  )
  const rows = emptyGroup ? [] : (findings.data?.items ?? [])
  const total = emptyGroup ? 0 : (findings.data?.total ?? 0)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  useClampPage(
    page,
    emptyGroup || (findings.data && !findings.isPlaceholderData)
      ? totalPages
      : null,
    (next) => setParam(PARAM.page, next > 1 ? String(next) : undefined),
  )

  const start = useStartReconciliationRun()
  const externalCancel = useExternalCancelFinding()
  const externalCancelMany = useExternalCancelFindings()
  const reprocess = useReprocessFinding()
  const cancel = useCancelFinding()
  const acting =
    externalCancel.isPending ||
    externalCancelMany.isPending ||
    reprocess.isPending ||
    cancel.isPending

  const runNow = () => {
    setFeedback(undefined)
    setSelected(new Set())
    start.mutate(undefined, {
      onError: (caught) => setFeedback(startErrorFeedback(caught)),
    })
  }

  const showFailure = (caught: unknown, fallback: string) =>
    setFeedback({ status: 'error', message: getErrorMessage(caught, fallback) })

  // 상품 고르기는 이번 검사에 불일치가 있는 상품만 — 상품 목록을 따로 받지 않는다.
  const productOptions: DropdownOption<string | undefined>[] = [
    { label: '전체 상품', value: undefined },
    ...(shown?.findingCountsByProduct ?? []).flatMap(
      ({ productId: id, productName, count }) =>
        id
          ? [{ label: `${productName ?? '이름 모름'} (${count})`, value: id }]
          : [],
    ),
  ]

  const batchable = rows.filter(canBatchExternalCancel)
  const selectedIds = batchable
    .filter((finding) => selected.has(finding.findingId))
    .map((finding) => finding.findingId)
  const allSelected =
    batchable.length > 0 && selectedIds.length === batchable.length
  const toggle = (ids: string[], checked: boolean) =>
    setSelected((prev) => toggleInSet(prev, ids, checked))

  const confirmExternalCancel = (finding: ReconcileFinding) =>
    openModal({
      theme: 'light',
      title: `${numberOf(finding)} 외부 예약을 취소할까요?`,
      description:
        finding.checkCode === 'MOCK_ONLY'
          ? '우리한텐 없는 예약이에요. 외부 예약 시스템에 남은 등록을 그 키로 취소해요.'
          : '외부 예약 시스템에 남은 등록을 그 키로 취소해요. 우리 예약은 그대로예요.',
      confirmLabel: '외부 취소',
      onConfirm: () => {
        closeModal()
        setFeedback(undefined)
        externalCancel.mutate(finding.findingId, {
          onSuccess: ({ actionStatus, actionNote }) =>
            setFeedback(
              actionStatus === 'FAILED'
                ? {
                    status: 'error',
                    message: `${numberOf(finding)} 외부 취소에 실패했어요(${actionNote ?? '사유 없음'}). 그 줄에서 다시 누를 수 있어요.`,
                  }
                : {
                    status: 'success',
                    message: `${numberOf(finding)} 외부 취소를 마쳤어요. 다음 검사에서 사라져요.`,
                  },
            ),
          onError: (caught) =>
            showFailure(caught, '외부 취소를 요청하지 못했어요.'),
        })
      },
    })

  const confirmExternalCancelSelected = () => {
    const ids = selectedIds.slice(0, EXTERNAL_CANCEL_BATCH_MAX)
    openModal({
      theme: 'light',
      title: `${ids.length}건을 외부 취소할까요?`,
      description:
        '우리 쪽은 이미 취소된 예약이에요. 외부 예약 시스템에 남은 등록을 건마다 그 키로 취소해요.',
      confirmLabel: '외부 취소',
      onConfirm: () => {
        closeModal()
        setFeedback(undefined)
        externalCancelMany.mutate(ids, {
          onSuccess: ({ items }) => {
            // 20초가 지나 시작하지 못한 건은 그것만 다시 보내게 골라 둔다.
            setSelected(
              new Set(
                items
                  .filter(
                    (item) =>
                      item.errorCode === 'RECONCILIATION_BATCH_DEADLINE',
                  )
                  .map((item) => item.findingId),
              ),
            )
            const failures = items.filter(
              (item) => !item.finding || item.finding.actionStatus === 'FAILED',
            )
            const done = items.length - failures.length
            setFeedback(
              failures.length === 0
                ? {
                    status: 'success',
                    message: `${done}건 모두 외부 취소를 마쳤어요. 다음 검사에서 사라져요.`,
                  }
                : {
                    status: 'warning',
                    message: `${items.length}건 중 ${done}건을 외부 취소했어요. ${failures.length}건은 실패했어요(${failures
                      .map(
                        (item) =>
                          item.errorMessage ??
                          item.finding?.actionNote ??
                          '사유 없음',
                      )
                      .join(', ')}). 실패한 줄은 다시 누를 수 있어요.`,
                  },
            )
          },
          onError: (caught) =>
            showFailure(caught, '외부 취소를 요청하지 못했어요.'),
        })
      },
    })
  }

  const confirmReprocess = (finding: ReconcileFinding) =>
    openModal({
      theme: 'light',
      title: `${numberOf(finding)}을(를) 재처리할까요?`,
      description:
        '같은 키로 외부 예약 시스템에 다시 등록해요. 외부엔 이미 있어서 중복으로 생기지 않고, 우리 쪽이 등록 완료로 맞춰져요.',
      confirmLabel: '재처리',
      onConfirm: () => {
        closeModal()
        setFeedback(undefined)
        reprocess.mutate(finding.findingId, {
          onError: (caught) =>
            showFailure(caught, '재처리를 요청하지 못했어요.'),
        })
      },
    })

  const confirmCancel = (finding: ReconcileFinding) =>
    openModal({
      theme: 'light',
      title: `${numberOf(finding)} 예약을 취소할까요?`,
      description:
        '외부에서 이미 취소된 예약이에요. 우리 쪽도 취소하면 예약이 취소 중이 되고, 결제한 예약은 주문 취소·환불까지 이어져요. 되돌릴 수 없어요.',
      children: (
        <ReasonForm
          label="취소 사유"
          defaultValue="외부에서 취소됨"
          maxLength={FINDING_CANCEL_REASON_MAX}
          confirmLabel="예약 취소"
          onCancel={closeModal}
          onConfirm={(reason) => {
            closeModal()
            setFeedback(undefined)
            cancel.mutate(
              { findingId: finding.findingId, reason },
              {
                onError: (caught) =>
                  showFailure(caught, '예약을 취소하지 못했어요.'),
              },
            )
          }}
        />
      ),
    })

  const actionOf: Record<
    Exclude<FindingGroup, 'manual'>,
    { label: string; run: (finding: ReconcileFinding) => void }
  > = {
    externalCancel: { label: '외부 취소', run: confirmExternalCancel },
    reprocess: { label: '재처리', run: confirmReprocess },
    reservationCancel: { label: '예약 취소', run: confirmCancel },
  }

  // 상세의 '돌아가기'가 고른 탭·상품 그대로의 이 화면을 가리키게 한다.
  const openDetail = (finding: ReconcileFinding) => {
    const backTo: BackTo = {
      label: '외부 예약 대조',
      to: location.pathname + location.search,
    }
    navigate(adminReservationPath(finding.targetKey), { state: { backTo } })
  }

  // 건수는 탭에 붙인다. 끝난 검사가 없으면 숫자를 뺀다.
  const tabLabel = (label: string, count: number) => (
    <span className={styles.tabLabel}>
      {label}
      {shown && (
        <span className={count > 0 ? styles.tabCount : styles.tabCountZero}>
          {count.toLocaleString('ko-KR')}
        </span>
      )}
    </span>
  )
  const tabs = [
    { value: 'all' as const, label: tabLabel('전체', counts.all) },
    ...findingGroups.map((group) => ({
      value: group,
      label: tabLabel(findingGroupLabel[group], counts[group]),
    })),
  ]

  const columns: TableColumn<ReconcileFinding>[] = [
    {
      key: 'select',
      header: (
        <Checkbox
          aria-label="외부 취소할 수 있는 건 모두 선택"
          checked={allSelected}
          disabled={batchable.length === 0 || acting}
          onChange={(event) =>
            toggle(
              batchable.map((finding) => finding.findingId),
              event.target.checked,
            )
          }
        />
      ),
      align: 'center',
      width: '56px',
      render: (finding) =>
        canBatchExternalCancel(finding) && (
          <Checkbox
            aria-label={`${numberOf(finding)} 선택`}
            checked={selected.has(finding.findingId)}
            disabled={acting}
            onChange={(event) =>
              toggle([finding.findingId], event.target.checked)
            }
          />
        ),
    },
    {
      key: 'group',
      header: '유형',
      render: (finding) => {
        const group = findingGroupOf(finding.checkCode)
        return (
          <Tag
            variant={group === 'reprocess' ? 'outline' : 'subtle'}
            size="medium"
            rounded={false}
            color={groupTagColor[group]}
          >
            {findingGroupLabel[group]}
          </Tag>
        )
      },
    },
    {
      key: 'reservation',
      header: '예약',
      render: (finding) => (
        <span className={styles.stacked}>
          <span className={styles.mainText}>{numberOf(finding)}</span>
          <span className={styles.subText}>{finding.productName ?? '—'}</span>
        </span>
      ),
    },
    // 우리와 외부를 한 칸에 맞대고, 어긋난 쪽만 빨갛게 한다.
    {
      key: 'compare',
      header: '양쪽 상태',
      render: (finding) => {
        const wrong = wrongSideOf(finding)
        return (
          <span className={styles.compare}>
            <span className={styles.side}>우리</span>
            <span
              className={
                wrong === 'ours' ? styles.sideValueWrong : styles.sideValue
              }
            >
              {oursOf(finding)}
            </span>
            <span className={styles.side}>외부</span>
            <span
              className={
                wrong === 'external' ? styles.sideValueWrong : styles.sideValue
              }
            >
              {externalOf(finding)}
            </span>
          </span>
        )
      },
    },
    // 쉬운 설명 아래에 서버 검사 코드를 작게 — 개발팀에 물을 때 그대로 읽는다.
    {
      key: 'reason',
      header: '내용',
      render: (finding) => (
        <span className={styles.stacked}>
          <span className={styles.cellText}>
            {findingDescription(finding.checkCode)}
          </span>
          <span className={styles.code}>{finding.checkCode}</span>
        </span>
      ),
    },
    // 오래됐으면 일시적인 어긋남이 아니다.
    {
      key: 'first',
      header: '처음 발견',
      render: (finding) => (
        <span className={styles.subText}>
          {formatShortDateTime(finding.firstDetectedAt)}
        </span>
      ),
    },
    // 버튼 글자가 꺾이지 않게 칸 폭을 잡는다('다시 외부 취소'가 가장 길다).
    {
      key: 'action',
      header: '조치',
      width: '148px',
      render: (finding) => {
        const group = findingGroupOf(finding.checkCode)
        if (group === 'manual')
          return <span className={styles.hint}>상세에서 확인</span>
        if (canAct(finding)) {
          const action = actionOf[group]
          const retry = finding.actionStatus === 'FAILED'
          return (
            <span className={styles.stacked}>
              {retry && (
                <span className={styles.stateFail}>
                  실패 · {finding.actionNote ?? '사유 없음'}
                </span>
              )}
              <Button
                size="small"
                variant="outline"
                className={styles.actionButton}
                disabled={acting}
                onClick={() => action.run(finding)}
              >
                {retry ? `다시 ${action.label}` : action.label}
              </Button>
            </span>
          )
        }
        return <ActionState finding={finding} />
      },
    },
    {
      key: 'detail',
      header: '',
      align: 'center',
      width: '56px',
      render: (finding) =>
        hasReservation(finding) && (
          <button
            type="button"
            className={styles.detailButton}
            aria-label={`${numberOf(finding)} 상세 보기`}
            onClick={() => openDetail(finding)}
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
              ? `${formatShortDateTime(latest.createdAt)}에 요청 · 결과를 기다리는 중`
              : shown
                ? runMeta(shown)
                : '아직 끝난 검사가 없어요'}
          </span>
          <Button
            size="small"
            disabled={running || start.isPending}
            onClick={runNow}
          >
            {running || start.isPending ? '검사 중…' : '지금 검사'}
          </Button>
        </div>
      </header>

      {feedback && (
        <InlineAlert status={feedback.status}>{feedback.message}</InlineAlert>
      )}

      {runs.isError && !runs.data && (
        <InlineAlert status="error">
          {getErrorMessage(runs.error, '검사 결과를 불러오지 못했어요.')}
        </InlineAlert>
      )}

      <RunSummary running={running} failed={failed} shown={shown} />

      <SegmentedTabs
        items={tabs}
        value={tab}
        onChange={(next) =>
          setParam(PARAM.tab, next === 'all' ? undefined : next)
        }
      />

      <div className={styles.filters}>
        <Dropdown
          className={styles.field}
          label="전체 상품"
          fieldLabel="상품"
          options={productOptions}
          value={productId}
          onSelect={(next) => setParam(PARAM.product, next)}
        />
      </div>

      {batchable.length > 0 && (
        <div className={styles.selectionBar}>
          <span className={styles.selectionCount}>
            외부 취소 {selectedIds.length.toLocaleString('ko-KR')}건 선택됨
          </span>
          <Button
            size="small"
            disabled={selectedIds.length === 0 || acting}
            onClick={confirmExternalCancelSelected}
          >
            {externalCancelMany.isPending
              ? '외부 취소 요청 중…'
              : '선택한 건 외부 취소'}
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        rows={rows}
        rowKey={(finding) => finding.findingId}
        loading={findings.isPending && !emptyGroup && shown !== undefined}
        loadingRows={PAGE_SIZE}
        emptyMessage={
          findings.isError
            ? getErrorMessage(
                findings.error,
                '불일치 목록을 불러오지 못했어요.',
              )
            : shown
              ? '어긋난 예약이 없어요.'
              : '검사가 끝나면 어긋난 예약이 여기 보여요.'
        }
      />

      {totalPages > 1 && (
        <Navigator
          className={styles.navigator}
          totalPages={totalPages}
          currentPage={page}
          onPageChange={(next) => setParam(PARAM.page, String(next))}
        />
      )}
    </div>
  )
}

/** 최근 검사 결과 카드 — 검사 중 · 판정 불가 · 일치 · 불일치 */
function RunSummary({
  running,
  failed,
  shown,
}: {
  running: boolean
  failed: ReconcileRun | undefined
  shown: ReconcileRun | undefined
}) {
  const card = (
    tone: 'run' | 'ok' | 'fail',
    label: string,
    message: string,
    aside?: string,
  ) => (
    <section
      className={styles.summary[tone === 'fail' ? 'alert' : 'default']}
      aria-label="최근 검사 결과"
    >
      <span className={styles.summaryTag[tone]}>{label}</span>
      <span className={styles.summaryText}>{message}</span>
      {aside && <span className={styles.summaryAside}>{aside}</span>}
    </section>
  )
  const schedule = '매일 새벽 3시에 자동으로 검사해요'

  if (running)
    return card(
      'run',
      '검사 중',
      '서버가 비교하고 있어요. 보통 몇 초 안에 끝나요. 창을 닫아도 계속 돼요. 아래는 지난 검사 결과예요.',
    )
  if (failed)
    return card(
      'fail',
      '판정 불가',
      `검사를 끝내지 못해 어긋남을 판단할 수 없어요.${failed.errorMessage ? ` 서버 메시지: ${failed.errorMessage}` : ''}${shown ? ` 아래는 ${formatShortDateTime(shown.finishedAt ?? shown.createdAt)} 검사 결과예요.` : ''}`,
    )
  if (!shown) return null
  // 기준 시각 뒤에 외부에서 바뀐 건은 판정하지 않는다 — 다음 검사에서 본다.
  const held = shown.heldCount
    ? ` 기준 시각 뒤에 바뀐 ${shown.heldCount.toLocaleString('ko-KR')}건은 다음 검사에서 봐요.`
    : ''
  if (shown.verdict === 'MATCHED')
    return card(
      'ok',
      '일치',
      `우리 예약과 외부 예약 시스템이 모두 맞아요.${held}`,
      schedule,
    )
  return card(
    'fail',
    `불일치 ${shown.findingCount.toLocaleString('ko-KR')}건`,
    `서버가 우리 예약과 외부 예약 시스템을 비교했어요.${shown.cutoffAt ? ` ${formatShortDateTime(shown.cutoffAt)}까지 들어온 예약이 대상이에요.` : ''}${held}`,
    schedule,
  )
}

/**
 * 조치한 뒤의 상태. 재처리·예약 취소는 서버가 뒤에서 하므로 '처리 중'으로 오는데, 그 예약을
 * 다시 받아 끝났으면 '완료'로 보인다 — 다음 검사를 기다리지 않아도 된다. 그 줄은 다음 검사에서
 * 사라진다.
 */
function ActionState({ finding }: { finding: ReconcileFinding }) {
  if (finding.actionStatus === 'REQUESTED' && hasReservation(finding))
    return <RequestedState finding={finding} />
  if (finding.actionStatus === 'REQUESTED')
    return <span className={styles.stateWait}>처리 중</span>
  return (
    <span className={styles.stacked}>
      <span className={styles.stateOk}>
        {finding.actionStatus === 'ALREADY_RESOLVED' ? '이미 해결됨' : '완료'}
      </span>
      <span className={styles.subText}>
        {finding.actionNote ?? '다음 검사에서 사라져요'}
      </span>
    </span>
  )
}

function RequestedState({ finding }: { finding: ReconcileFinding }) {
  const { data: reservation } = useAdminReservation(finding.targetKey)
  const done =
    reservation !== undefined &&
    (finding.actionType === 'ADMIN_CANCEL'
      ? reservation.status === 'CANCELED'
      : reservation.registerJobStatus === 'SUCCEEDED' ||
        reservation.status !== 'PENDING_SYNC')
  if (done)
    return (
      <span className={styles.stacked}>
        <span className={styles.stateOk}>완료</span>
        <span className={styles.subText}>다음 검사에서 사라져요</span>
      </span>
    )
  return (
    <span className={styles.stacked}>
      <span className={styles.stateWait}>처리 중</span>
      {finding.actionRequestedAt && (
        <span className={styles.subText}>
          {formatShortDateTime(finding.actionRequestedAt)}{' '}
          {finding.actionType === 'ADMIN_CANCEL' ? '취소 요청' : '재처리 요청'}
        </span>
      )}
    </span>
  )
}
