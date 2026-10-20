import { Link } from 'react-router'

import { adminOrderStatusLabel } from '@entities/admin-order'
import { ADMIN_ORDERS_PATH, ADMIN_PRODUCTS_PATH } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'

import {
  ORDER_SUMMARY_STEPS,
  type OrderSummaryStep,
} from '../../lib/orderSummary'

import * as styles from './OrderSummaryCard.css'

/** 관리자가 다음 단계로 옮겨야 하는 단계 — 칠해서 보인다 */
const ACTION_STEPS: readonly OrderSummaryStep[] = [
  'PREPARING_ITEMS',
  'READY_TO_SHIP',
]

const valueOf = (count: number | null) =>
  count === null ? '—' : formatNumber(count)

export type OrderSummaryCardProps = {
  /** 단계별 주문 수. 못 받았으면 null */
  orders: Record<OrderSummaryStep, number | null>
  /** 판매 상태별 상품 수. 못 받았으면 null */
  products: { active: number | null; paused: number | null }
}

/** 주문 단계별 건수와 상품 판매 상태 — 단계를 누르면 그 상태로 거른 주문 목록이 열린다 */
export function OrderSummaryCard({ orders, products }: OrderSummaryCardProps) {
  return (
    <section className={styles.root} aria-labelledby="ops-orders">
      <div className={styles.header}>
        <h2 id="ops-orders" className={styles.title}>
          주문·상품
        </h2>
        <Link to={ADMIN_ORDERS_PATH} className={styles.link}>
          주문 관리
        </Link>
      </div>
      <ol className={styles.steps} aria-label="주문 단계별 건수">
        {ORDER_SUMMARY_STEPS.map((status) => (
          <li key={status} className={styles.stepItem}>
            <Link
              to={`${ADMIN_ORDERS_PATH}?status=${status}`}
              className={
                ACTION_STEPS.includes(status) ? styles.stepAction : styles.step
              }
            >
              <span className={styles.count}>{valueOf(orders[status])}</span>
              <span className={styles.label}>
                {adminOrderStatusLabel[status]}
              </span>
            </Link>
          </li>
        ))}
      </ol>
      <div className={styles.products}>
        <span>
          상품{' '}
          <b className={styles.strong}>판매 중 {valueOf(products.active)}</b>
          {' · '}판매 중지 {valueOf(products.paused)}
        </span>
        <Link to={ADMIN_PRODUCTS_PATH} className={styles.link}>
          상품 관리
        </Link>
      </div>
    </section>
  )
}
