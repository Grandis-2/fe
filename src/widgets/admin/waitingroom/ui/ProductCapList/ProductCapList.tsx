import { useState } from 'react'

import { useProductStats } from '@entities/admin-reservation'
import {
  productWaitEstimate,
  type WaitingroomProductRate,
  type WaitingroomProductStatus,
} from '@entities/admin-waitingroom'
import { SLOW_AFTER_MS } from '@features/open-preorder-picker'
import { getErrorMessage } from '@shared/api/client'
import { pollingError } from '@shared/api/queryPolicy'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import { formatNumber } from '@shared/lib/formatNumber'
import { closeModal, openModal } from '@shared/model/modalStore'
import {
  Button,
  Chip,
  InlineAlert,
  Skeleton,
  Tag,
  UsageCells,
} from '@shared/ui'

import { formatSeconds, oldestSeconds } from '../../lib/duration'
import { NumberSettingForm } from '../NumberSettingForm'

import * as styles from './ProductCapList.css'

import type { AdmissionChange } from '../../lib/useAdmissionChange'

export type ProductCapListProps = {
  /** 대기가 많은 순으로 정렬된 상품별 대기열 */
  products: readonly WaitingroomProductStatus[]
  /** 상품별 상한 운영값. 못 받았으면 undefined */
  rates: readonly WaitingroomProductRate[] | undefined
  /** 상한으로 정할 수 있는 최댓값 */
  maxCredit: number
  nameOf: (productId: string) => string
  refreshInterval: RefreshInterval
  loading: boolean
  /** 비어 있을 때 문구 — 조회 실패와 0건을 구분해 부모가 정한다 */
  emptyMessage: string
  admission: AdmissionChange
}

type Phase = WaitingroomProductStatus['phase']

const phaseLabel: Record<Phase, string> = {
  BEFORE_OPEN: '오픈 전',
  OPEN: '접수 중',
  CLOSED: '마감',
}

// 칩 순서 — 지금 손볼 진행 중이 먼저다.
const phaseFilters: { phase: Phase; label: string }[] = [
  { phase: 'OPEN', label: '진행 중' },
  { phase: 'BEFORE_OPEN', label: '예정' },
  { phase: 'CLOSED', label: '마감' },
]

/**
 * 상품별 입장 상한 — 상품마다 윗줄에 대기·맨 뒤 대기·외부 등록 상태, 아랫줄에 상한을 얼마나
 * 쓰는지 칸 막대로 보인다. 상한에 닿은 상품은 칸이 주황으로 바뀌고 상한 바꾸기가 진해진다 —
 * 그 상품은 전역 속도를 올려도 몫이 늘지 않는다.
 */
export function ProductCapList({
  products,
  rates,
  maxCredit,
  nameOf,
  refreshInterval,
  loading,
  emptyMessage,
  admission,
}: ProductCapListProps) {
  const [phase, setPhase] = useState<Phase>('OPEN')
  const shown = products.filter((product) => product.phase === phase)
  // 상품별 집계를 한 번에 받는다. 오픈 전 회차는 서버가 세지 않아 묻지 않는다.
  const productStats = useProductStats(
    phase === 'CLOSED' ? 'CLOSED' : 'OPEN',
    refreshInterval,
    { enabled: phase !== 'BEFORE_OPEN' },
  )
  const statsError = pollingError(productStats)
  const capOf = (productId: string) =>
    rates?.find((item) => item.productId === productId)?.cap

  const askCap = (product: WaitingroomProductStatus) => {
    const name = nameOf(product.productId)
    openModal({
      theme: 'light',
      title: `${name}의 입장 상한을 바꿀까요?`,
      description: '바꾸면 1초 안에 실제 회원의 입장에 반영됩니다.',
      children: (
        <NumberSettingForm
          label="상품 입장 상한"
          unit="명/초"
          min={1}
          max={maxCredit}
          initial={capOf(product.productId)?.value ?? product.cap}
          hint="낮춰도 이미 줄에 선 사람은 빠지지 않습니다."
          onCancel={closeModal}
          onConfirm={(value) => {
            closeModal()
            admission.apply(
              { kind: 'productCap', productId: product.productId, value },
              `${name}의 입장 상한을 바꿨습니다.`,
            )
          }}
        />
      ),
    })
  }

  const resetCap = (product: WaitingroomProductStatus) => {
    const name = nameOf(product.productId)
    admission.confirm(
      `${name}의 입장 상한을 기본값으로 되돌릴까요?`,
      '서버 기본값으로 돌아가고 1초 안에 반영됩니다.',
      '되돌리기',
      () =>
        admission.apply(
          { kind: 'productCap', productId: product.productId, value: null },
          `${name}의 입장 상한을 기본값으로 되돌렸습니다.`,
        ),
    )
  }

  return (
    <section className={styles.card} aria-labelledby="wr-caps">
      <div className={styles.head}>
        <h2 id="wr-caps" className={styles.title}>
          상품별 입장 상한
        </h2>
        <span className={styles.caption}>대기 많은 순</span>
      </div>

      <div className={styles.filters} role="group" aria-label="사전예약 단계">
        {phaseFilters.map((filter) => (
          <Chip
            key={filter.phase}
            className={styles.chip}
            selected={phase === filter.phase}
            count={
              loading
                ? undefined
                : products.filter((product) => product.phase === filter.phase)
                    .length
            }
            onClick={() => setPhase(filter.phase)}
          >
            {filter.label}
          </Chip>
        ))}
      </div>

      {/* 집계는 태그만 채운다 — 못 받아도 목록은 대기열 값으로 보인다. */}
      {statsError !== null && (
        <InlineAlert status="warning">
          {getErrorMessage(statsError, '등록 현황을 불러오지 못했어요.')}{' '}
          재처리·밀림 표시를 뺐어요.
        </InlineAlert>
      )}

      {loading ? (
        <Skeleton height={160} />
      ) : products.length === 0 ? (
        <span className={styles.caption}>{emptyMessage}</span>
      ) : shown.length === 0 ? (
        <span className={styles.caption}>
          {phaseFilters.find((filter) => filter.phase === phase)?.label}인
          사전예약이 없어요.
        </span>
      ) : (
        <ul className={styles.list}>
          {shown.map((product) => {
            const name = nameOf(product.productId)
            // 상한은 설정값(입장 속도 API)으로 보인다 — 운영값이 없으면 서버 기본값이 온다.
            // 현황의 cap이 다르면 서버가 지금 그보다 낮게 적용 중이라 따로 알린다.
            const cap = capOf(product.productId)?.value ?? product.cap
            const applied = product.cap !== cap ? product.cap : null
            const atCap = cap !== null && cap > 0 && product.credit >= cap
            const stats = productStats.data?.get(product.productId)
            const oldest = oldestSeconds(
              stats?.oldestInFlightSyncAt,
              productStats.dataUpdatedAt,
            )
            const register = stats?.syncJobs.REGISTER
            // 등록 작업이 아직 도는 예약만의 시각이라 재처리 필요(실패)와 섞이지 않는다.
            const slow = oldest !== null && oldest * 1000 > SLOW_AFTER_MS
            return (
              <li key={product.productId} className={styles.row}>
                <div className={styles.name}>
                  <span className={styles.nameText}>{name}</span>
                  <Tag
                    variant="subtle"
                    size="small"
                    color={product.phase === 'OPEN' ? 'primary' : 'gray'}
                  >
                    {phaseLabel[product.phase]}
                  </Tag>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>대기</span>
                  <span className={styles.statValue}>
                    {formatNumber(product.waiting)}
                    <span className={styles.unit}>명</span>
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>맨 뒤 대기</span>
                  <span className={styles.statValue}>
                    {productWaitEstimate(product) ?? '—'}
                  </span>
                </div>
                <div className={styles.register}>
                  {register && (
                    <Tag
                      variant="subtle"
                      size="medium"
                      color={
                        register.DEAD_LETTER > 0
                          ? 'red'
                          : slow
                            ? 'yellow'
                            : 'green'
                      }
                    >
                      {register.DEAD_LETTER > 0
                        ? `외부 등록 실패 ${formatNumber(register.DEAD_LETTER)}건`
                        : slow && oldest !== null
                          ? `외부 등록 밀림 · ${formatSeconds(oldest)}째`
                          : '외부 등록 정상'}
                    </Tag>
                  )}
                </div>
                <div className={styles.actions}>
                  {capOf(product.productId)?.source === 'OPERATIONAL' && (
                    <Button
                      variant="subtle"
                      color="cancel"
                      size="small"
                      rounded
                      aria-label={`${name} 상한 기본값으로`}
                      disabled={admission.isPending}
                      onClick={() => resetCap(product)}
                    >
                      기본값
                    </Button>
                  )}
                  <Button
                    // 상한에 닿은 상품만 진하게 — 이 상품이 막히는 곳이라는 걸 버튼으로도 보인다.
                    variant={atCap ? 'solid' : 'outline'}
                    size="small"
                    rounded
                    aria-label={`${name} 상한 바꾸기`}
                    disabled={admission.isPending || !rates}
                    onClick={() => askCap(product)}
                  >
                    상한 바꾸기
                  </Button>
                </div>

                <div className={styles.capBox}>
                  <span className={styles.capHead}>
                    <span className={styles.capLabel}>입장 / 상한</span>
                    <span className={styles.capValue}>
                      {formatNumber(product.credit)} /{' '}
                      {cap === null ? '서버 기본값' : formatNumber(cap)}
                      <span className={styles.capUnit}>(명/초)</span>
                    </span>
                  </span>
                  {cap !== null && (
                    <UsageCells
                      used={product.credit}
                      total={cap}
                      label={`${name} 입장 상한 ${formatNumber(cap)}명 중 ${formatNumber(product.credit)}명 사용`}
                    />
                  )}
                  <span />
                  <span className={atCap ? styles.hintWarn : styles.hint}>
                    {cap === 0
                      ? '상한이 0이라 이 상품은 아무도 못 들어가요'
                      : atCap
                        ? '상한에 닿음 · 전역 속도를 올려도 이 상품은 안 빨라져요'
                        : null}
                    {applied !== null && (
                      <span className={styles.hintSub}>
                        {' '}
                        · 서버가 지금 적용 중인 상한은 {formatNumber(applied)}
                        명/초
                      </span>
                    )}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
