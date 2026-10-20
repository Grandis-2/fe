import { Link } from 'react-router'

import type { OpenPreorder } from '@features/open-preorder-picker'
import { ADMIN_WAITINGROOM_PATH } from '@shared/config/routes'
import { formatNumber } from '@shared/lib/formatNumber'
import { Table, type TableColumn } from '@shared/ui'

import * as styles from './OpenPreorderTable.css'

export type OpenPreorderTableProps = {
  items: readonly OpenPreorder[]
  /** 대기열 현황을 아직 못 받았다 — 0건과 섞이지 않게 회색 줄을 깐다 */
  loading?: boolean
}

/** 진행 중인 사전예약마다 대기·입장 속도·외부 등록 실패를 한 줄씩 */
export function OpenPreorderTable({
  items,
  loading = false,
}: OpenPreorderTableProps) {
  const columns: TableColumn<OpenPreorder>[] = [
    {
      key: 'name',
      header: '상품',
      render: (item) => <span className={styles.name}>{item.name}</span>,
    },
    {
      key: 'waiting',
      header: '대기',
      align: 'right',
      render: (item) => formatNumber(item.waiting),
    },
    {
      key: 'credit',
      header: '입장/초',
      align: 'right',
      render: (item) => formatNumber(item.credit),
    },
    {
      key: 'failures',
      header: '실패',
      align: 'right',
      render: (item) =>
        item.failures === null ? (
          '—'
        ) : (
          <span className={item.failures ? styles.failures : undefined}>
            {formatNumber(item.failures)}
          </span>
        ),
    },
  ]

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
      <Table
        columns={columns}
        rows={[...items]}
        rowKey={(item) => item.productId}
        emptyMessage="지금 접수 중인 사전예약이 없어요."
        loading={loading}
        loadingRows={3}
      />
    </section>
  )
}
