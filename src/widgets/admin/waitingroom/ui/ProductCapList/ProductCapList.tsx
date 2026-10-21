import { useReservationStatsByProduct } from '@entities/admin-reservation'
import {
  waitEstimate,
  WAITINGROOM_DEFAULTS,
  type WaitingroomProductRate,
  type WaitingroomProductStatus,
} from '@entities/admin-waitingroom'
import { SLOW_AFTER_MS } from '@features/open-preorder-picker'
import type { RefreshInterval } from '@shared/config/refreshInterval'
import { formatNumber } from '@shared/lib/formatNumber'
import { closeModal, openModal } from '@shared/model/modalStore'
import { Skeleton, Tag, UsageCells } from '@shared/ui'

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

const phaseLabel: Record<WaitingroomProductStatus['phase'], string> = {
  BEFORE_OPEN: '오픈 전',
  OPEN: '접수 중',
  CLOSED: '마감',
}

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
  const productStats = useReservationStatsByProduct(
    products.map((product) => product.productId),
    refreshInterval,
  )
  const statsOf = (productId: string) =>
    productStats[products.findIndex((item) => item.productId === productId)]
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
      `${WAITINGROOM_DEFAULTS.productCap}명/초로 돌아가고 1초 안에 반영됩니다.`,
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

      {loading ? (
        <Skeleton height={160} />
      ) : products.length === 0 ? (
        <span className={styles.caption}>{emptyMessage}</span>
      ) : (
        <ul className={styles.list}>
          {products.map((product) => {
            const name = nameOf(product.productId)
            // 상한은 설정값(입장 속도 API)으로 보인다 — 운영값이 없으면 서버 기본값이 온다.
            // 현황의 cap이 다르면 서버가 지금 그보다 낮게 적용 중이라 따로 알린다.
            const cap = capOf(product.productId)?.value ?? product.cap
            const applied = product.cap !== cap ? product.cap : null
            const atCap = cap > 0 && product.credit >= cap
            const query = statsOf(product.productId)
            const oldest = oldestSeconds(
              query?.data?.oldestPendingSyncAt,
              query?.dataUpdatedAt ?? 0,
            )
            const register = query?.data?.syncJobs.REGISTER
            // 가장 오래 기다린 시각엔 재처리 필요(DEAD_LETTER) 건도 들어 있어, 처리 중인
            // 작업이 있고 실패가 없을 때만 밀림으로 본다(운영 대시보드와 같은 기준).
            const slow =
              register !== undefined &&
              register.PENDING +
                register.PROCESSING +
                register.RETRY_SCHEDULED >
                0 &&
              register.DEAD_LETTER === 0 &&
              oldest !== null &&
              oldest * 1000 > SLOW_AFTER_MS
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
                    {waitEstimate(product.waiting, product.credit) ?? '—'}
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
                    <button
                      type="button"
                      className={styles.resetButton}
                      aria-label={`${name} 상한 기본값으로`}
                      disabled={admission.isPending}
                      onClick={() => resetCap(product)}
                    >
                      기본값
                    </button>
                  )}
                  <button
                    type="button"
                    className={
                      atCap ? styles.capButton.strong : styles.capButton.plain
                    }
                    aria-label={`${name} 상한 바꾸기`}
                    disabled={admission.isPending || !rates}
                    onClick={() => askCap(product)}
                  >
                    상한 바꾸기
                  </button>
                </div>

                <div className={styles.capBox}>
                  <span className={styles.capHead}>
                    <span className={styles.capLabel}>입장 / 상한</span>
                    <span className={styles.capValue}>
                      {formatNumber(product.credit)} / {formatNumber(cap)}
                      <span className={styles.capUnit}>(명/초)</span>
                    </span>
                  </span>
                  <UsageCells
                    used={product.credit}
                    total={cap}
                    label={`${name} 입장 상한 ${formatNumber(cap)}명 중 ${formatNumber(product.credit)}명 사용`}
                  />
                  <span />
                  <span className={atCap ? styles.hintWarn : styles.hint}>
                    {cap === 0
                      ? '상한이 0이라 이 상품은 아무도 못 들어가요'
                      : atCap
                        ? '상한에 닿음 · 전역 속도를 올려도 이 상품은 안 빨라져요'
                        : `초당 ${formatNumber(cap - product.credit)}명 여유`}
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
