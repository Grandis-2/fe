import { useState } from 'react'

import {
  isBraking,
  LEAVE_GRACE_SECONDS_RANGE,
  MAX_WAIT_SECONDS_RANGE,
  settingSourceLabel,
  useAdmissionRates,
  useChangeAdmissionRate,
  useWaitingroomStatus,
  WAITINGROOM_DEFAULTS,
  waitingroomPhaseLabel,
  waitingroomRuntimeColor,
  waitingroomRuntimeLabel,
  waitingroomRuntimeLabels,
  type AdmissionRateChange,
  type WaitingroomProductStatus,
  type WaitingroomSetting,
} from '@entities/admin-waitingroom'
import { getErrorMessage } from '@shared/api/client'
import {
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import { srOnly } from '@shared/config/theme'
import { closeModal, openModal } from '@shared/model/modalStore'
import { showToast } from '@shared/model/toastStore'
import {
  Button,
  Dropdown,
  FormSection,
  InlineAlert,
  RefreshStatus,
  Skeleton,
  StatCard,
  Table,
  Tag,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

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

const count = (value: number | null, unit: string) =>
  value === null ? '—' : `${value.toLocaleString('ko-KR')}${unit}`

type SettingRow = {
  key: 'globalCredit' | 'maxWait' | 'leaveGrace'
  label: string
  unit: string
  setting: WaitingroomSetting
  min: number
  max: number
  /** 기본값이 무엇인지 — 되돌리기 버튼에 쓴다 */
  defaultLabel: string
  hint: string
}

/**
 * 대기열 관리. 지금 대기 상황을 보면서 입장 속도·상품별 상한·최대 대기·이탈 유예를 바꾼다.
 * 바꾸면 1초 안에 실제 회원의 입장에 반영되므로 모든 변경을 한 번 더 묻는다.
 */
export function AdminWaitingroom({ productNames }: AdminWaitingroomProps) {
  const [refreshInterval, setRefreshInterval] =
    useState<RefreshInterval>(DEFAULT_INTERVAL)
  const status = useWaitingroomStatus(refreshInterval)
  const rates = useAdmissionRates()
  const change = useChangeAdmissionRate()

  const view = status.data
  const maxCredit = rates.data?.maxGlobalCredit ?? 1500
  const rateOf = (productId: string) =>
    rates.data?.products.find((product) => product.productId === productId)

  const apply = (next: AdmissionRateChange, done: string) => {
    change.reset()
    change.mutate(next, { onSuccess: () => showToast(done) })
  }

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

  const confirmReset = (
    label: string,
    defaultLabel: string,
    next: AdmissionRateChange,
  ) =>
    openModal({
      theme: 'light',
      title: `${label}을(를) 기본값으로 되돌릴까요?`,
      description: `${defaultLabel}(으)로 돌아가고 1초 안에 실제 회원의 입장에 반영됩니다.`,
      confirmLabel: '되돌리기',
      onConfirm: () => {
        closeModal()
        apply(next, `${label}을(를) 기본값으로 되돌렸습니다.`)
      },
    })

  const settings: SettingRow[] = rates.data
    ? [
        {
          key: 'globalCredit',
          label: '전역 입장 속도',
          unit: '명/초',
          setting: rates.data.globalCredit,
          min: 0,
          max: maxCredit,
          defaultLabel: `${WAITINGROOM_DEFAULTS.globalCredit}명/초`,
          hint: '전 상품을 합친 값입니다. 0이면 입장을 멈춥니다(줄은 남습니다).',
        },
        {
          key: 'maxWait',
          label: '최대 대기 시간',
          unit: '초',
          setting: rates.data.maxWaitSeconds,
          ...MAX_WAIT_SECONDS_RANGE,
          defaultLabel: '제한 없음',
          hint: '줄 길이가 초당 입장 × 이 값을 넘으면 새로 오는 사람은 줄을 설 수 없습니다.',
        },
        {
          key: 'leaveGrace',
          label: '이탈 유예',
          unit: '초',
          setting: rates.data.leaveGraceSeconds,
          ...LEAVE_GRACE_SECONDS_RANGE,
          defaultLabel: `${WAITINGROOM_DEFAULTS.leaveGraceSeconds}초`,
          hint: '연결이 끊긴 사람을 줄에 남겨 두는 시간입니다. 늘리면 떠난 사람도 오래 남습니다.',
        },
      ]
    : []

  const productColumns: TableColumn<WaitingroomProductStatus>[] = [
    {
      key: 'name',
      header: '상품',
      render: (product) =>
        productNames.get(product.productId) ?? product.productId,
    },
    {
      key: 'phase',
      header: '접수',
      align: 'center',
      render: (product) => waitingroomPhaseLabel[product.phase],
    },
    {
      key: 'runtime',
      header: '대기열',
      align: 'center',
      render: (product) => (
        <Tag
          variant="subtle"
          size="medium"
          rounded={false}
          color={waitingroomRuntimeColor[product.runtime]}
          widthOptions={waitingroomRuntimeLabels}
        >
          {waitingroomRuntimeLabel[product.runtime]}
        </Tag>
      ),
    },
    {
      key: 'waiting',
      header: '대기 인원',
      align: 'right',
      render: (product) => count(product.waiting, '명'),
    },
    {
      key: 'credit',
      header: '입장 / 상한',
      align: 'right',
      render: (product) => `${product.credit} / ${product.cap}명/초`,
    },
    {
      key: 'limit',
      header: '줄 최대 길이',
      align: 'right',
      render: (product) =>
        count(rateOf(product.productId)?.queueLimit ?? null, '명'),
    },
    {
      key: 'source',
      header: '상한',
      align: 'center',
      render: (product) => {
        const cap = rateOf(product.productId)?.cap
        const name = productNames.get(product.productId) ?? '이 상품'
        return (
          <div className={styles.rowActions}>
            <Button
              size="small"
              variant="outline"
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
              변경
            </Button>
            {cap?.source === 'OPERATIONAL' && (
              <Button
                size="small"
                variant="subtle"
                disabled={change.isPending}
                onClick={() =>
                  confirmReset(
                    `${name}의 입장 상한`,
                    `${WAITINGROOM_DEFAULTS.productCap}명/초`,
                    {
                      kind: 'productCap',
                      productId: product.productId,
                      value: null,
                    },
                  )
                }
              >
                기본값
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className={styles.root}>
      <RefreshStatus
        updatedAt={status.dataUpdatedAt}
        onRefresh={() => {
          void status.refetch()
          void rates.refetch()
        }}
        note="대기열 현황"
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

      {status.isError && (
        <InlineAlert status={view ? 'warning' : 'error'}>
          {getErrorMessage(status.error, '대기열 현황을 불러오지 못했습니다.')}
          {view && ' 아래 숫자는 마지막으로 받은 값입니다.'}
        </InlineAlert>
      )}
      {view?.snapshotStale && (
        <InlineAlert status="warning">
          대기열 현황 정보가 {view.snapshotAgeSeconds ?? '?'}초째 갱신되지
          않았습니다. 지금 새로 오는 사람은 모두 줄에 섭니다.
        </InlineAlert>
      )}
      {isBraking(view?.brakeFactor ?? null) && (
        <InlineAlert status="warning">
          예약 서버의 오류나 지연 때문에 입장을 자동으로 줄이고 있습니다(배율{' '}
          {view?.brakeFactor}).
        </InlineAlert>
      )}

      <div className={styles.cards}>
        <StatCard
          label="총 대기 인원"
          muted={!view}
          value={
            view
              ? count(
                  view.products.reduce((sum, item) => sum + item.waiting, 0),
                  '명',
                )
              : '—'
          }
        />
        <StatCard
          label="실제 입장 속도"
          muted={!view}
          value={count(view?.globalCredit ?? null, '명/초')}
        />
        <StatCard
          label="브레이크 배율"
          muted={!view}
          value={view?.brakeFactor ?? '—'}
        />
        <StatCard
          label="대기열 서버"
          muted={!view}
          value={count(view?.gateways ?? null, '대')}
        />
      </div>

      {change.isError && (
        <InlineAlert status="error">
          {getErrorMessage(change.error, '운영값을 바꾸지 못했습니다.')}
        </InlineAlert>
      )}

      <FormSection
        title="운영값"
        description="바꾸면 1초 안에 실제 회원의 입장에 반영됩니다."
      >
        {rates.isError && (
          <InlineAlert status="error">
            {getErrorMessage(rates.error, '운영값을 불러오지 못했습니다.')}
          </InlineAlert>
        )}
        <div className={styles.card}>
          {rates.isPending && (
            // 운영값 줄 모양을 먼저 깐다 — 다 오면 같은 자리에 값이 들어온다.
            <div role="status" aria-busy="true">
              <span className={srOnly}>불러오는 중입니다.</span>
              {[0, 1, 2].map((row) => (
                <Skeleton
                  key={row}
                  height={24}
                  className={styles.skeletonRow}
                />
              ))}
            </div>
          )}
          {settings.map((row) => (
            <div key={row.key} className={styles.settingRow}>
              <div className={styles.settingLabel}>{row.label}</div>
              <div className={styles.settingValue}>
                {row.setting.value === null
                  ? '제한 없음'
                  : `${row.setting.value.toLocaleString('ko-KR')}${row.unit}`}
                <Tag
                  variant="outline"
                  size="small"
                  color={
                    row.setting.source === 'OPERATIONAL' ? 'primary' : 'gray'
                  }
                >
                  {settingSourceLabel[row.setting.source]}
                </Tag>
              </div>
              <div className={styles.rowActions}>
                <Button
                  size="small"
                  variant="outline"
                  disabled={change.isPending}
                  onClick={() =>
                    askNumber(
                      `${row.label}을(를) 바꿀까요?`,
                      {
                        label: row.label,
                        unit: row.unit,
                        min: row.min,
                        max: row.max,
                        initial: row.setting.value,
                        hint: row.hint,
                      },
                      (value) => ({ kind: row.key, value }),
                    )
                  }
                >
                  변경
                </Button>
                {row.setting.source === 'OPERATIONAL' && (
                  <Button
                    size="small"
                    variant="subtle"
                    disabled={change.isPending}
                    onClick={() =>
                      confirmReset(row.label, row.defaultLabel, {
                        kind: row.key,
                        value: null,
                      })
                    }
                  >
                    기본값
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="상품별 대기열"
        description="대기열에 올라온 사전예약 상품입니다. 상한은 상품 하나가 받을 수 있는 초당 입장 인원입니다."
      >
        <Table
          columns={productColumns}
          rows={view?.products ?? []}
          rowKey={(product) => product.productId}
          loading={status.isPending}
          emptyMessage={
            status.isError && !view
              ? '대기열 현황을 불러오지 못했습니다.'
              : '대기열에 올라온 상품이 없습니다.'
          }
        />
      </FormSection>
    </div>
  )
}
