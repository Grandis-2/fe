import { useState } from 'react'

import { useReservationStats } from '@entities/admin-reservation'
import {
  useAdmissionRates,
  useWaitingroomStatus,
} from '@entities/admin-waitingroom'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import {
  refreshIntervalOptions,
  type RefreshInterval,
} from '@shared/config/refreshInterval'
import { Button, Dropdown, InlineAlert, RefreshStatus } from '@shared/ui'

import { formatSeconds } from '../../lib/duration'
import { useAdmissionChange } from '../../lib/useAdmissionChange'
import { AdmissionSpeedCard } from '../AdmissionSpeedCard'
import { LeaveGraceSetting } from '../LeaveGraceSetting'
import { ProductCapTable } from '../ProductCapTable'

import * as styles from './AdminWaitingroom.css'

export type AdminWaitingroomProps = {
  /** 상품 id → 이름. 대기열 응답엔 id만 있다 */
  productNames: ReadonlyMap<string, string>
}

// 오픈 중엔 몇 초 사이에도 줄이 크게 바뀐다(서버 안내: 1초보다 자주 묻지 않는다).
const DEFAULT_INTERVAL: RefreshInterval = 5_000

/**
 * 대기열 관리 — 입장 속도 · 상품별 상한 · 자리 지켜 주기(이탈 유예) 세 덩어리를 조립한다.
 * 최대 대기 시간은 사람을 거절하는 값이라 칸을 두지 않고, 걸려 있을 때만 경고와 해제 버튼을
 * 보인다(사전예약은 모두 받는다). 모든 변경은 한 요청 상태(admission)를 나눠 써서 진행 중엔
 * 다른 변경도 막힌다.
 */
export function AdminWaitingroom({ productNames }: AdminWaitingroomProps) {
  const [refreshInterval, setRefreshInterval] =
    useState<RefreshInterval>(DEFAULT_INTERVAL)
  const status = useWaitingroomStatus(refreshInterval)
  const rates = useAdmissionRates()
  // 판단 근거 집계 — 카드가 같은 키로 받는다. 여기선 새로 고침 때 함께 다시 받으려고 둔다.
  const stats = useReservationStats(undefined, refreshInterval)
  const admission = useAdmissionChange()

  const view = status.data
  // 대기가 많은 상품이 막힌 상품이라 위로 올린다.
  const products = (view?.products ?? []).toSorted(
    (a, b) => b.waiting - a.waiting,
  )
  const maxCredit = rates.data?.maxGlobalCredit ?? 1500
  const maxWait = rates.data?.maxWaitSeconds.value ?? null

  const refresh = () => {
    void status.refetch()
    void rates.refetch()
    void stats.refetch()
  }

  return (
    <div className={styles.root}>
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
      {rates.isError && (
        <InlineAlert status="error">
          {getErrorMessage(rates.error, '운영값을 불러오지 못했습니다.')}
        </InlineAlert>
      )}
      {/* 모두 받는데 최대 대기 시간이 걸려 있으면 줄이 찬 뒤 오는 사람이 거절된다. */}
      {maxWait !== null && (
        <InlineAlert status="error">
          <span className={styles.alertRow}>
            <span>
              <span className={styles.strong}>
                최대 대기 시간({formatSeconds(maxWait)})이 걸려 있어요.
              </span>{' '}
              줄이 차면 새로 오는 사람이 거절돼요.
            </span>
            <Button
              size="small"
              disabled={admission.isPending}
              onClick={() =>
                admission.confirm(
                  '최대 대기 시간 제한을 해제할까요?',
                  '줄 길이 제한이 없어져 새로 오는 사람을 모두 줄에 세워요.',
                  '해제',
                  () =>
                    admission.apply(
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
      {admission.error && (
        <InlineAlert status="error">
          {getErrorMessage(admission.error, '운영값을 바꾸지 못했습니다.')}
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
        <AdmissionSpeedCard
          view={view}
          loading={status.isPending}
          globalSetting={rates.data?.globalCredit}
          maxCredit={maxCredit}
          refreshInterval={refreshInterval}
          admission={admission}
        />
      </section>

      <section className={styles.section} aria-labelledby="wr-caps">
        <div className={styles.sectionHead}>
          <h2 id="wr-caps" className={styles.sectionTitle}>
            상품별 상한
          </h2>
          <span className={styles.caption}>
            어느 상품에서 밀리는지 보고, 그 상품의 상한만 낮춰요
          </span>
        </div>
        <ProductCapTable
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
      </section>

      <section className={styles.section} aria-labelledby="wr-grace">
        <div className={styles.sectionHead}>
          <h2 id="wr-grace" className={styles.sectionTitle}>
            자리 지켜 주기
          </h2>
          <span className={styles.caption}>이탈 유예</span>
        </div>
        <LeaveGraceSetting
          setting={rates.data?.leaveGraceSeconds}
          loading={rates.isPending}
          admission={admission}
        />
      </section>
    </div>
  )
}
