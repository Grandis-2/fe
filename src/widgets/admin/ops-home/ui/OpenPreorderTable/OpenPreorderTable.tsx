import { Link } from 'react-router'

import { untilClose, type OpenPreorder } from '@features/open-preorder-picker'
import { ADMIN_WAITINGROOM_PATH } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'

import * as styles from './OpenPreorderTable.css'

export type OpenPreorderTableProps = {
  items: readonly OpenPreorder[]
  /** 마감까지 남은 시간을 잴 기준 시각 */
  now: number
}

/** 진행 중인 사전예약마다 대기·입장 속도·외부 등록 실패를 한 줄씩 */
export function OpenPreorderTable({ items, now }: OpenPreorderTableProps) {
  return (
    <section className={styles.root} aria-labelledby="ops-open-table">
      <div className={styles.header}>
        <h2 id="ops-open-table" className={styles.title}>
          진행 중인 사전예약
        </h2>
        <Link to={ADMIN_WAITINGROOM_PATH} className={styles.link}>
          대기열 관리
        </Link>
      </div>
      {items.length === 0 ? (
        <div className={styles.empty}>지금 접수 중인 사전예약이 없어요.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col" className={styles.th}>
                상품
              </th>
              <th scope="col" className={styles.thNum}>
                대기
              </th>
              <th scope="col" className={styles.thNum}>
                입장/초
              </th>
              <th scope="col" className={styles.thNum}>
                실패
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId} className={styles.row}>
                <th scope="row" className={styles.name}>
                  {item.name} · {untilClose(item.closesAt, now)}
                </th>
                <td className={styles.num}>{formatNumber(item.waiting)}</td>
                <td className={styles.num}>{formatNumber(item.credit)}</td>
                <td className={item.failures ? styles.failures : styles.num}>
                  {item.failures === null ? '—' : formatNumber(item.failures)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
