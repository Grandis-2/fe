import { Link } from 'react-router'

import { adminOrderStatusLabel } from '@entities/admin-order'
import { ADMIN_ORDERS_PATH, ADMIN_PRODUCTS_PATH } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './OrderSummaryCard.css'

import type { OrderSummaryStep } from '../../lib/orderSummary'

/** 관리자가 다음 단계로 옮겨야 하는 단계 — 줄마다 처리 버튼을 단다 */
const ACTION_STEPS = [
  { status: 'PREPARING_ITEMS', hint: '포장이 끝나면 출고 대기로' },
  { status: 'READY_TO_SHIP', hint: '택배에 넘기면 배송 중으로' },
] as const satisfies readonly { status: OrderSummaryStep; hint: string }[]

/** 지나간·남은 단계 — 손댈 일이 아니라 한 줄 요약으로 */
const SUMMARY_STEPS = [
  'AWAITING_CONFIRMATION',
  'SHIPPED',
] as const satisfies readonly OrderSummaryStep[]

const valueOf = (count: number | null) =>
  count === null ? '—' : formatNumber(count)

const ordersPath = (status: OrderSummaryStep) =>
  `${ADMIN_ORDERS_PATH}?status=${status}`

export type OrderSummaryCardProps = {
  /** 단계별 주문 수. 못 받았으면 null */
  orders: Record<OrderSummaryStep, number | null>
  /** 판매 상태별 상품 수. 못 받았으면 null */
  products: { active: number | null; paused: number | null }
}

/**
 * 주문·상품 요약 — 관리자가 옮겨야 하는 단계(상품 준비·출고 대기)를 줄마다 건수·안내·처리
 * 버튼으로, 결제 완료·배송 중은 아래 한 줄로. 맨 아래에 상품 판매 상태.
 */
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

      <ul className={styles.todos} aria-label="처리할 주문">
        {ACTION_STEPS.map(({ status, hint }) => (
          <li key={status} className={styles.todo}>
            <span className={styles.todoCount}>{valueOf(orders[status])}</span>
            <span className={styles.todoText}>
              <span className={styles.todoLabel}>
                {adminOrderStatusLabel[status]}
              </span>
              <span className={styles.todoHint}>{hint}</span>
            </span>
            <Link
              to={ordersPath(status)}
              className={styles.todoAction}
              aria-label={`${adminOrderStatusLabel[status]} 주문 처리`}
            >
              처리
            </Link>
          </li>
        ))}
      </ul>

      <ul className={styles.chips} aria-label="그 밖의 주문">
        {SUMMARY_STEPS.map((status) => (
          <li key={status}>
            <Link to={ordersPath(status)} className={styles.chip}>
              {adminOrderStatusLabel[status]}{' '}
              <b className={styles.strong}>{valueOf(orders[status])}</b>
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.products}>
        <span>
          상품{' '}
          <b className={styles.strong}>판매 중 {valueOf(products.active)}</b>
          {' · '}판매 중지{' '}
          <b className={styles.strong}>{valueOf(products.paused)}</b>
        </span>
        <Link to={ADMIN_PRODUCTS_PATH} className={styles.link}>
          상품 관리
        </Link>
      </div>
    </section>
  )
}
