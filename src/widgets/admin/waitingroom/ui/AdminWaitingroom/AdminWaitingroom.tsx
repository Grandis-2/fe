import { useState } from 'react'

import {
  useAdmissionRates,
  useWaitingroomStatus,
  WAITINGROOM_DEFAULTS,
} from '@entities/admin-waitingroom'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import { Dropdown, InlineAlert, RefreshStatus } from '@shared/ui'

import { useAdmissionChange } from '../../lib/useAdmissionChange'
import { useAdmissionFlow } from '../../lib/useAdmissionFlow'
import { AdmissionSpeedCard } from '../AdmissionSpeedCard'
import { AdmissionStatus } from '../AdmissionStatus'
import { LeaveGraceSetting } from '../LeaveGraceSetting'
import { MaxWaitSetting } from '../MaxWaitSetting'
import { ProductCapList } from '../ProductCapList'
import { ServerStatusCard } from '../ServerStatusCard'

import * as styles from './AdminWaitingroom.css'

export type AdminWaitingroomProps = {
  /** 상품 id → 이름. 대기열 응답엔 id만 있다 */
  productNames: ReadonlyMap<string, string>
}

// 오픈 중엔 몇 초 사이에도 줄이 크게 바뀐다(서버 안내: 1초보다 자주 묻지 않는다).
const DEFAULT_INTERVAL: RefreshInterval = 5_000
/** 맨 위 '속도 낮추기'가 옮겨 갈 입력 칸 */
const SPEED_INPUT_ID = 'wr-speed-input'

/**
 * 대기열 관리 — 위에서 아래로 "지금 어떤가(판정 줄) → 얼마나 들일까(입장 속도) → 어느 상품이
 * 막히나(상품별 상한)"로 읽힌다. 자주 바꾸지 않는 설정(자리 지켜 주기 · 최대 대기 시간)과
 * 서버 상태는 오른쪽에 둔다. 모든 변경은 한 요청 상태(admission)를 나눠 써서 진행 중엔
 * 다른 변경도 막힌다.
 */
export function AdminWaitingroom({ productNames }: AdminWaitingroomProps) {
  const [refreshInterval, setRefreshInterval] =
    useState<RefreshInterval>(DEFAULT_INTERVAL)
  const status = useWaitingroomStatus(refreshInterval)
  const rates = useAdmissionRates()
  const admission = useAdmissionChange()

  const view = status.data
  const { stats, ...flow } = useAdmissionFlow(view, refreshInterval)
  // 대기가 많은 상품이 막힌 상품이라 위로 올린다.
  const products = (view?.products ?? []).toSorted(
    (a, b) => b.waiting - a.waiting,
  )
  const maxCredit = rates.data?.maxGlobalCredit ?? 1500

  const refresh = () => {
    void status.refetch()
    void rates.refetch()
    void stats.refetch()
  }

  // 급할 때만 판정 줄에 할 일을 붙인다.
  const action =
    flow.verdict.kind === 'stopped'
      ? {
          label: '다시 열기',
          disabled: admission.isPending,
          onClick: () =>
            admission.confirm(
              '입장을 다시 열까요?',
              `기본값 ${WAITINGROOM_DEFAULTS.globalCredit}명/초로 입장이 다시 시작되고 1초 안에 반영됩니다.`,
              '다시 열기',
              () =>
                admission.apply(
                  { kind: 'globalCredit', value: null },
                  '입장을 다시 열었습니다.',
                ),
            ),
        }
      : flow.verdict.kind === 'congested'
        ? {
            label: '속도 낮추기',
            onClick: () => document.getElementById(SPEED_INPUT_ID)?.focus(),
          }
        : undefined

  return (
    <div className={styles.root}>
      <header className={styles.topBar}>
        <h1 className={styles.pageTitle}>대기열 관리</h1>
        <RefreshStatus updatedAt={status.dataUpdatedAt} onRefresh={refresh}>
          <Dropdown
            label="자동 갱신 간격"
            size="small"
            width="140px"
            options={refreshIntervalOptions}
            value={refreshInterval}
            // 고르는 즉시 한 번 받는다 — 새 간격을 기다리지 않고 지금 값을 보여준다.
            onSelect={(next) => {
              setRefreshInterval(next)
              refresh()
            }}
          />
        </RefreshStatus>
      </header>

      {pollingError(status) !== null && (
        <InlineAlert status={view ? 'warning' : 'error'}>
          {getErrorMessage(
            pollingError(status),
            '대기열 현황을 불러오지 못했습니다.',
          )}
          {view && ' 아래 숫자는 마지막으로 받은 값입니다.'}
        </InlineAlert>
      )}
      {rates.isError && (
        <InlineAlert status="error">
          {getErrorMessage(rates.error, '운영값을 불러오지 못했습니다.')}
        </InlineAlert>
      )}
      {admission.error && (
        <InlineAlert status="error">
          {getErrorMessage(admission.error, '운영값을 바꾸지 못했습니다.')}
        </InlineAlert>
      )}

      <AdmissionStatus flow={flow} loading={status.isPending} action={action} />

      <div className={styles.columns}>
        <div className={styles.main}>
          <AdmissionSpeedCard
            flow={flow}
            brakeFactor={view?.brakeFactor ?? null}
            loading={status.isPending}
            globalSetting={rates.data?.globalCredit}
            maxCredit={maxCredit}
            productIds={products.map((product) => product.productId)}
            admission={admission}
            inputId={SPEED_INPUT_ID}
          />
          <ProductCapList
            products={products}
            rates={rates.data?.products}
            maxCredit={maxCredit}
            nameOf={(productId) => productNames.get(productId) ?? productId}
            refreshInterval={refreshInterval}
            loading={status.isPending}
            emptyMessage={
              status.isError && !view
                ? '대기열 현황을 불러오지 못했습니다.'
                : '대기열에 올라온 상품이 없습니다.'
            }
            admission={admission}
          />
        </div>
        <aside className={styles.side} aria-label="설정과 서버 상태">
          <LeaveGraceSetting
            setting={rates.data?.leaveGraceSeconds}
            loading={rates.isPending}
            admission={admission}
          />
          <ServerStatusCard view={view} loading={status.isPending} />
          <MaxWaitSetting
            setting={rates.data?.maxWaitSeconds}
            loading={rates.isPending}
            admission={admission}
          />
        </aside>
      </div>
    </div>
  )
}
