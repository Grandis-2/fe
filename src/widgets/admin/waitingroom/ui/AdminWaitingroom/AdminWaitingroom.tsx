import { useState } from 'react'

import {
  useReservationStats,
  useReservationStatsByProduct,
  useReservationStatsHistory,
} from '@entities/admin-reservation'
import {
  isBraking,
  settingSourceLabel,
  useAdmissionRates,
  useChangeAdmissionRate,
  useWaitingroomStatus,
  waitEstimate,
  WAITINGROOM_DEFAULTS,
  type AdmissionRateChange,
  type WaitingroomProductStatus,
} from '@entities/admin-waitingroom'
import { SLOW_AFTER_MS } from '@features/open-preorder-picker'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import { formatNumber } from '@shared/lib/formatNumber'
import { ratePerSecond, slopePerSecond } from '@shared/lib/samples'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  Dropdown,
  InlineAlert,
  Input,
  RefreshStatus,
  SegmentedTabs,
  Skeleton,
  Table,
  Tag,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { admissionVerdict, previewNote } from '../../lib/admissionVerdict'
import { AdmissionBar } from '../AdmissionBar'
import { BacklogTrend } from '../BacklogTrend'
import {
  NumberSettingForm,
  type NumberSettingFormProps,
} from '../NumberSettingForm'

import * as styles from './AdminWaitingroom.css'

export type AdminWaitingroomProps = {
  /** 상품 id → 이름. 대기열 응답엔 id만 있다 */
  productNames: ReadonlyMap<string, string>
}

// 오픈 중엔 몇 초 사이에도 줄이 크게 바뀐다(서버 안내: 1초보다 자주 묻지 않는다).
const DEFAULT_INTERVAL: RefreshInterval = 5_000
/** 이탈 유예 선택지(초) — 250~1800 범위라 직접 입력 대신 고른다 */
const GRACE_CHOICES = [250, 300, 600, 1800]

/** 250 → '4분 10초' */
const formatSeconds = (seconds: number) => {
  if (seconds < 60) return `${seconds}초`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) return rest ? `${minutes}분 ${rest}초` : `${minutes}분`
  return `${Math.floor(minutes / 60)}시간 ${minutes % 60}분`
}

const sum = (values: Record<string, number>) =>
  Object.values(values).reduce((total, value) => total + value, 0)

/** 가장 오래 기다린 외부 등록이 받은 시각 기준 몇 초째인지. 대기가 없으면 null */
const oldestSeconds = (oldestAt: string | null | undefined, at: number) =>
  oldestAt ? Math.max(0, Math.floor((at - Date.parse(oldestAt)) / 1000)) : null

/**
 * 대기열 관리 — 입장 속도와 자리 지켜 주기(이탈 유예) 둘만 다룬다. 입장 속도는 모든
 * 사전예약이 같은 예약 서버·외부 예약 시스템을 쓰므로 전체 기준으로 판단하고(여유 막대),
 * 상품별 표에서 어느 상품이 밀리는지 보고 그 상품의 상한만 낮춘다. 최대 대기 시간은 사람을
 * 거절하는 값이라 칸을 두지 않고, 걸려 있을 때만 경고와 해제 버튼을 보인다(모두 받는다).
 */
export function AdminWaitingroom({ productNames }: AdminWaitingroomProps) {
  const [refreshInterval, setRefreshInterval] =
    useState<RefreshInterval>(DEFAULT_INTERVAL)
  const status = useWaitingroomStatus(refreshInterval)
  const rates = useAdmissionRates()
  const change = useChangeAdmissionRate()
  // 판단 근거 — 외부 등록이 따라오는지는 예약 집계에서 본다. 받은 값은 추이로 쌓인다.
  const stats = useReservationStats(undefined, refreshInterval)

  const view = status.data
  // 대기가 많은 상품이 막힌 상품이라 위로 올린다.
  const products = (view?.products ?? []).toSorted(
    (a, b) => b.waiting - a.waiting,
  )
  const productStats = useReservationStatsByProduct(
    products.map((product) => product.productId),
    refreshInterval,
  )
  const statsOf = (productId: string) =>
    productStats[
      products.findIndex((product) => product.productId === productId)
    ]

  const maxCredit = rates.data?.maxGlobalCredit ?? 1500
  const totalWaiting = products.reduce((total, item) => total + item.waiting, 0)
  const nameOf = (productId: string) => productNames.get(productId) ?? productId

  // 접수·외부 등록 처리 속도와 대기 추이 — 관리자 화면을 연 뒤 받은 집계로 잰다.
  const history = useReservationStatsHistory()
  const series = (pick: (value: (typeof history)[number]['value']) => number) =>
    history.map(({ at, value }) => ({ at, value: pick(value) }))
  const received = ratePerSecond(series((value) => sum(value.preorders))).at(
    -1,
  )?.value
  const processed = ratePerSecond(
    series((value) => sum(value.preorders) - value.preorders.PENDING_SYNC),
  ).at(-1)?.value
  const backlogSlope = slopePerSecond(
    series((value) => value.preorders.PENDING_SYNC),
    60_000,
  ).at(-1)?.value

  const admitting = view?.globalCredit ?? 0
  const processing = processed === undefined ? null : Math.round(processed)
  const braking = isBraking(view?.brakeFactor ?? null)
  const verdict = admissionVerdict({
    braking,
    backlogPerMinute: backlogSlope === undefined ? null : backlogSlope * 60,
    backlog: stats.data?.preorders.PENDING_SYNC ?? 0,
    admitting,
    processing,
    receiving: received ?? 0,
  })
  const oldest = oldestSeconds(
    stats.data?.oldestPendingSyncAt,
    stats.dataUpdatedAt,
  )

  // 전역 입장 속도 — 숫자만 받고, 지금 값과 다른 올바른 값일 때만 적용을 연다.
  const [draft, setDraft] = useState('')
  const globalSetting = rates.data?.globalCredit
  const draftValue = draft === '' ? null : Number(draft)
  const draftInRange =
    draftValue !== null && draftValue >= 1 && draftValue <= maxCredit
  const canApply =
    draftInRange && draftValue !== globalSetting?.value && !change.isPending
  // 실제 입장은 운영값 × 브레이크 배율이라 바꾼 값에도 지금 배율을 곱해 본다.
  const nextAdmitting =
    draftInRange && draftValue !== null
      ? Math.round(draftValue * (view?.brakeFactor ?? 1))
      : null

  const apply = (
    next: AdmissionRateChange,
    done: string,
    onDone?: () => void,
  ) => {
    change.reset()
    change.mutate(next, {
      onSuccess: () => {
        showToast(done)
        onDone?.()
      },
    })
  }

  const confirm = (
    title: string,
    description: string,
    confirmLabel: string,
    run: () => void,
  ) =>
    openModal({
      theme: 'light',
      title,
      description,
      confirmLabel,
      onConfirm: () => {
        closeModal()
        run()
      },
    })

  const askNumber = (
    title: string,
    form: Omit<NumberSettingFormProps, 'onConfirm' | 'onCancel'>,
    toChange: (value: number) => AdmissionRateChange,
  ) =>
    openModal({
      theme: 'light',
      title,
      description: '바꾸면 1초 안에 실제 회원의 입장에 반영됩니다.',
      children: (
        <NumberSettingForm
          {...form}
          onCancel={closeModal}
          onConfirm={(value) => {
            closeModal()
            apply(toChange(value), `${form.label}을(를) 바꿨습니다.`)
          }}
        />
      ),
    })

  // 이탈 유예 — 지금 값이 선택지에 없으면(직접 정한 값) 그 값도 보인다.
  const grace =
    rates.data?.leaveGraceSeconds.value ??
    WAITINGROOM_DEFAULTS.leaveGraceSeconds
  const graceItems = [...new Set([...GRACE_CHOICES, grace])]
    .toSorted((a, b) => a - b)
    .map((seconds) => ({
      value: String(seconds),
      label: `${formatSeconds(seconds)}${seconds === WAITINGROOM_DEFAULTS.leaveGraceSeconds ? ' · 기본' : ''}`,
    }))
  const pickGrace = (value: string) => {
    const seconds = Number(value)
    if (seconds === grace) return
    confirm(
      `이탈 유예를 ${formatSeconds(seconds)}(으)로 바꿀까요?`,
      seconds > grace
        ? '늘리면 정말 떠난 사람도 그만큼 줄에 남아 대기 인원·예상 시간이 늘어 보여요.'
        : '줄이면 잠깐 나간 사람이 더 빨리 자리를 잃고, 다시 오면 맨 뒤에 서요.',
      '바꾸기',
      () =>
        apply(
          {
            kind: 'leaveGrace',
            // 기본값은 운영값을 지워 되돌린다.
            value:
              seconds === WAITINGROOM_DEFAULTS.leaveGraceSeconds
                ? null
                : seconds,
          },
          '이탈 유예를 바꿨습니다.',
        ),
    )
  }

  const maxWait = rates.data?.maxWaitSeconds.value ?? null

  const productColumns: TableColumn<WaitingroomProductStatus>[] = [
    {
      key: 'name',
      header: '상품',
      render: (product) => nameOf(product.productId),
    },
    {
      key: 'waiting',
      header: '대기',
      align: 'right',
      render: (product) => `${formatNumber(product.waiting)}명`,
    },
    {
      key: 'wait',
      header: '맨 뒤 대기',
      align: 'right',
      render: (product) => waitEstimate(product.waiting, product.credit) ?? '—',
    },
    {
      key: 'credit',
      header: '실제 입장 / 상한',
      render: (product) => {
        // 상한에 닿으면 전역 속도를 올려도 이 상품 몫은 늘지 않는다.
        const atCap = product.cap > 0 && product.credit >= product.cap
        return (
          <span className={styles.capCell}>
            <span
              className={styles.miniTrack}
              role="img"
              aria-label={`실제 ${product.credit}, 상한 ${product.cap}`}
            >
              <span
                className={styles.miniFill[atCap ? 'atCap' : 'normal']}
                style={{
                  width: `${Math.min(100, (product.credit / Math.max(product.cap, 1)) * 100)}%`,
                }}
              />
            </span>
            {product.credit} / {product.cap}
            {atCap && (
              <Tag variant="subtle" size="small" rounded={false} color="yellow">
                상한에 닿음
              </Tag>
            )}
          </span>
        )
      },
    },
    {
      key: 'backlog',
      header: '외부 등록 대기',
      align: 'right',
      render: (product) => <BacklogTrend productId={product.productId} />,
    },
    {
      key: 'oldest',
      header: '가장 오래 기다린 등록',
      align: 'right',
      render: (product) => {
        const query = statsOf(product.productId)
        const seconds = oldestSeconds(
          query?.data?.oldestPendingSyncAt,
          query?.dataUpdatedAt ?? 0,
        )
        if (seconds === null) return '—'
        return (
          <span
            className={
              seconds * 1000 > SLOW_AFTER_MS ? styles.slowText : undefined
            }
          >
            {formatSeconds(seconds)}
          </span>
        )
      },
    },
    {
      key: 'cap',
      header: '',
      align: 'right',
      render: (product) => {
        const cap = rates.data?.products.find(
          (item) => item.productId === product.productId,
        )?.cap
        const name = nameOf(product.productId)
        return (
          <div className={styles.rowActions}>
            {cap?.source === 'OPERATIONAL' && (
              <Button
                size="small"
                variant="subtle"
                disabled={change.isPending}
                onClick={() =>
                  confirm(
                    `${name}의 입장 상한을 기본값으로 되돌릴까요?`,
                    `${WAITINGROOM_DEFAULTS.productCap}명/초로 돌아가고 1초 안에 반영됩니다.`,
                    '되돌리기',
                    () =>
                      apply(
                        {
                          kind: 'productCap',
                          productId: product.productId,
                          value: null,
                        },
                        `${name}의 입장 상한을 기본값으로 되돌렸습니다.`,
                      ),
                  )
                }
              >
                기본값
              </Button>
            )}
            <Button
              size="small"
              variant="outline"
              color="primary"
              disabled={change.isPending || !rates.data}
              onClick={() =>
                askNumber(
                  `${name}의 입장 상한을 바꿀까요?`,
                  {
                    label: '상품 입장 상한',
                    unit: '명/초',
                    min: 1,
                    max: maxCredit,
                    initial: cap?.value ?? product.cap,
                    hint: '낮춰도 이미 줄에 선 사람은 빠지지 않습니다.',
                  },
                  (value) => ({
                    kind: 'productCap',
                    productId: product.productId,
                    value,
                  }),
                )
              }
            >
              상한 바꾸기
            </Button>
          </div>
        )
      },
    },
  ]

  const note =
    nextAdmitting !== null && processing !== null
      ? previewNote(nextAdmitting, processing)
      : null

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={status.dataUpdatedAt}
        onRefresh={() => {
          void status.refetch()
          void rates.refetch()
          void stats.refetch()
        }}
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
            void status.refetch()
          }}
        />
      </RefreshStatus>

      {pollingError(status) !== null && (
        <InlineAlert status={view ? 'warning' : 'error'}>
          {getErrorMessage(
            pollingError(status),
            '대기열 현황을 불러오지 못했습니다.',
          )}
          {view && ' 아래 숫자는 마지막으로 받은 값입니다.'}
        </InlineAlert>
      )}
      {view?.snapshotStale && (
        <InlineAlert status="warning">
          대기열 현황 정보가 {view.snapshotAgeSeconds ?? '?'}초째 갱신되지
          않았습니다. 지금 새로 오는 사람은 모두 줄에 섭니다.
        </InlineAlert>
      )}
      {/* 모두 받는데 최대 대기 시간이 걸려 있으면 줄이 찬 뒤 오는 사람이 거절된다. */}
      {maxWait !== null && (
        <InlineAlert status="error">
          <span className={styles.alertRow}>
            <span>
              <b>최대 대기 시간({formatSeconds(maxWait)})이 걸려 있어요.</b>{' '}
              줄이 차면 새로 오는 사람이 거절돼요.
            </span>
            <Button
              size="small"
              disabled={change.isPending}
              onClick={() =>
                confirm(
                  '최대 대기 시간 제한을 해제할까요?',
                  '줄 길이 제한이 없어져 새로 오는 사람을 모두 줄에 세워요.',
                  '해제',
                  () =>
                    apply(
                      { kind: 'maxWait', value: null },
                      '최대 대기 시간 제한을 해제했습니다.',
                    ),
                )
              }
            >
              제한 해제
            </Button>
          </span>
        </InlineAlert>
      )}
      {change.isError && (
        <InlineAlert status="error">
          {getErrorMessage(change.error, '운영값을 바꾸지 못했습니다.')}
        </InlineAlert>
      )}

      <section className={styles.section} aria-labelledby="wr-speed">
        <div className={styles.sectionHead}>
          <h2 id="wr-speed" className={styles.sectionTitle}>
            입장 속도
          </h2>
          <span className={styles.caption}>
            모든 사전예약 합계 · 같은 서버와 외부 예약 시스템을 함께 써요
          </span>
        </div>

        <div className={styles.card[verdict.tone]}>
          {status.isPending ? (
            <Skeleton height={120} />
          ) : (
            <>
              <div className={styles.verdict}>
                <span className={styles.dot[verdict.tone]} aria-hidden="true" />
                <span className={styles.verdictText[verdict.tone]}>
                  {verdict.message}
                </span>
              </div>

              {processing !== null && view && (
                <AdmissionBar
                  admitting={admitting}
                  processing={processing}
                  next={nextAdmitting}
                  tone={verdict.tone}
                />
              )}

              <div className={styles.chips}>
                <span className={styles.chip}>
                  <BacklogTrend prefix="외부 등록 대기" />
                </span>
                <span
                  className={
                    oldest !== null && oldest * 1000 > SLOW_AFTER_MS
                      ? styles.chipWarn
                      : styles.chip
                  }
                >
                  가장 오래 기다린 등록{' '}
                  {oldest === null ? '없음' : formatSeconds(oldest)}
                </span>
                {braking && (
                  <span className={styles.chipDanger}>
                    브레이크 {view?.brakeFactor}× · 올려도 안 빨라져요
                  </span>
                )}
              </div>
            </>
          )}

          <div className={styles.divider} />

          <form
            className={styles.speedRow}
            onSubmit={(event) => {
              event.preventDefault()
              if (!canApply || draftValue === null) return
              apply(
                { kind: 'globalCredit', value: draftValue },
                '전역 입장 속도를 바꿨습니다.',
                () => setDraft(''),
              )
            }}
          >
            <div className={styles.speedLabel}>
              <span className={styles.caption}>
                전역 입장 속도 · 모든 상품 합계
              </span>
              <span className={styles.speedValue}>
                {globalSetting?.value === null || globalSetting === undefined
                  ? '—'
                  : `${formatNumber(globalSetting.value)}명/초`}
                {globalSetting && (
                  <Tag
                    variant="outline"
                    size="small"
                    color={
                      globalSetting.source === 'OPERATIONAL'
                        ? 'primary'
                        : 'gray'
                    }
                  >
                    {settingSourceLabel[globalSetting.source]}
                  </Tag>
                )}
              </span>
            </div>
            <div className={styles.speedInput}>
              <Input
                label="바꿀 속도(명/초)"
                size="small"
                inputMode="numeric"
                value={draft}
                // 숫자만 받는다 — 붙여 넣은 글자·소수점은 버린다.
                onChange={(event) =>
                  setDraft(event.target.value.replace(/\D/g, '').slice(0, 5))
                }
                error={
                  draft !== '' && !draftInRange
                    ? `1~${formatNumber(maxCredit)} 사이로 적어 주세요`
                    : undefined
                }
              />
            </div>
            <Button type="submit" disabled={!canApply}>
              {change.isPending ? '적용 중…' : '적용'}
            </Button>
          </form>

          <div className={styles.speedFoot}>
            <span className={styles.previewLine} aria-live="polite">
              {nextAdmitting !== null && view ? (
                <>
                  바꾸면 · 맨 뒤 대기{' '}
                  <b>
                    {waitEstimate(totalWaiting, admitting) ?? '줄 없음'} →{' '}
                    {waitEstimate(totalWaiting, nextAdmitting) ?? '줄 없음'}
                  </b>
                  {note && (
                    <>
                      {' · '}
                      <b className={styles.noteText[note.tone]}>{note.text}</b>
                    </>
                  )}
                </>
              ) : (
                '숫자를 넣으면 바꿨을 때 결과가 먼저 보여요'
              )}
            </span>
            <span className={styles.speedLinks}>
              {globalSetting?.source === 'OPERATIONAL' && (
                <button
                  type="button"
                  className={styles.linkButton}
                  disabled={change.isPending}
                  onClick={() =>
                    confirm(
                      '전역 입장 속도를 기본값으로 되돌릴까요?',
                      `${WAITINGROOM_DEFAULTS.globalCredit}명/초로 돌아가고 1초 안에 반영됩니다.`,
                      '되돌리기',
                      () =>
                        apply(
                          { kind: 'globalCredit', value: null },
                          '전역 입장 속도를 기본값으로 되돌렸습니다.',
                        ),
                    )
                  }
                >
                  기본값으로
                </button>
              )}
              <button
                type="button"
                className={styles.linkDanger}
                disabled={change.isPending || globalSetting?.value === 0}
                onClick={() =>
                  confirm(
                    '입장을 멈출까요?',
                    '모든 사전예약의 입장이 멈춰요. 줄은 그대로 남고, 기본값으로 되돌리면 다시 들어가요.',
                    '입장 멈춤',
                    () =>
                      apply(
                        { kind: 'globalCredit', value: 0 },
                        '입장을 멈췄습니다.',
                      ),
                  )
                }
              >
                입장 멈춤
              </button>
            </span>
          </div>
        </div>
      </section>

      {/* 세 덩어리(입장 속도 · 상품별 상한 · 자리 지켜 주기)를 같은 제목·간격으로 둔다. */}
      <section className={styles.section} aria-labelledby="wr-caps">
        <div className={styles.sectionHead}>
          <h2 id="wr-caps" className={styles.sectionTitle}>
            상품별 상한
          </h2>
          <span className={styles.caption}>
            어느 상품에서 밀리는지 보고, 그 상품의 상한만 낮춰요
          </span>
        </div>
        <Table
          columns={productColumns}
          rows={products}
          rowKey={(product) => product.productId}
          loading={status.isPending}
          emptyMessage={
            status.isError && !view
              ? '대기열 현황을 불러오지 못했습니다.'
              : '대기열에 올라온 상품이 없습니다.'
          }
        />
      </section>

      <section className={styles.section} aria-labelledby="wr-grace">
        <div className={styles.sectionHead}>
          <h2 id="wr-grace" className={styles.sectionTitle}>
            자리 지켜 주기
          </h2>
          <span className={styles.caption}>이탈 유예</span>
        </div>
        <div className={styles.card.muted}>
          <span className={styles.lead}>
            앱을 잠깐 나간 사람의 순번을 지켜 주는 시간
          </span>
          {rates.isPending ? (
            <Skeleton height={44} />
          ) : (
            <SegmentedTabs
              items={graceItems}
              value={String(grace)}
              onChange={pickGrace}
            />
          )}
          <span
            className={
              grace > WAITINGROOM_DEFAULTS.leaveGraceSeconds
                ? styles.graceWarn
                : styles.caption
            }
          >
            {grace > WAITINGROOM_DEFAULTS.leaveGraceSeconds
              ? '늘려 둔 만큼 정말 떠난 사람도 줄에 남아 대기 인원·예상 시간이 늘어 보여요'
              : `조회가 ${formatSeconds(grace)} 끊기면 줄에서 빠지고, 다시 오면 맨 뒤에 서요`}
          </span>
          {rates.isError && (
            <InlineAlert status="error">
              {getErrorMessage(rates.error, '운영값을 불러오지 못했습니다.')}
            </InlineAlert>
          )}
        </div>
      </section>
    </div>
  )
}
