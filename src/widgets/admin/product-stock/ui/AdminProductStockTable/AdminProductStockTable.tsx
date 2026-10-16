import {
  getAdminProductStocks,
  getStockOptionGroups,
  useAdminProduct,
  useAdminProductStock,
  type AdminProductStock,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { InlineAlert, Table } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminProductStockTable.css'

export type AdminProductStockTableProps = {
  productId: string
}

/** 옵션 조합별 재고 현황 — 재고 수량에 상품 상세의 옵션 이름·가격을 붙여 보여준다 */
export function AdminProductStockTable({
  productId,
}: AdminProductStockTableProps) {
  const product = useAdminProduct(productId)
  const stock = useAdminProductStock(productId)

  // 열은 상품이 실제로 가진 옵션 축에서 만든다 — 상품마다 축 수가 달라서
  // (스마트폰은 용량 하나, 노트북은 크기·RAM·용량·칩) 고정할 수 없다.
  const optionAxes = product.data ? getStockOptionGroups(product.data) : []

  const columns: TableColumn<AdminProductStock>[] = [
    {
      key: 'color',
      header: '색상',
      align: 'center',
      render: (row) => row.color,
    },
    ...optionAxes.map((axis, index) => ({
      key: axis.key,
      header: axis.label,
      align: 'center' as const,
      render: (row: AdminProductStock) => row.optionNames[index] ?? '-',
    })),
    {
      key: 'price',
      header: '가격',
      align: 'center',
      render: (row) => formatWon(row.price),
    },
    {
      key: 'total',
      header: '전체 수량',
      align: 'center',
      render: (row) => formatNumber(row.total),
    },
    {
      // 결제 대기는 주문은 했고 결제 전이라 잡아 둔 수량이다(장바구니에 담기만 해선 안
      // 잡힌다) — 아직 팔린 게 아니라 판매 완료와 따로 센다.
      key: 'reserved',
      header: '결제 대기',
      align: 'center',
      render: (row) => formatNumber(row.reserved),
    },
    {
      key: 'sold',
      header: '판매 완료',
      align: 'center',
      render: (row) => formatNumber(row.sold),
    },
    {
      key: 'available',
      header: '남은 수량',
      align: 'center',
      render: (row) => formatNumber(row.available),
    },
  ]

  const failed = product.error ?? stock.error
  const rows =
    product.data && stock.data
      ? getAdminProductStocks(product.data, stock.data)
      : []

  return (
    <div className={styles.root}>
      {/* 다시 불러오기에 실패해도 이전 데이터는 남아 표에 그대로 보인다 — 그 사실을 따로 알린다. */}
      {failed != null && rows.length > 0 && (
        <InlineAlert status="warning">
          {getErrorMessage(failed, '재고를 다시 불러오지 못했습니다.')} 이전에
          불러온 재고를 표시하고 있습니다.
        </InlineAlert>
      )}

      <Table
        columns={columns}
        rows={rows}
        rowKey={(row) => row.optionId}
        pageSize={10}
        // 조회 실패를 '재고 없음'으로 보이면 운영 판단이 정반대가 된다.
        loading={!failed && (product.isPending || stock.isPending)}
        emptyMessage={
          failed
            ? getErrorMessage(failed, '재고를 불러오지 못했습니다.')
            : '등록된 재고가 없습니다.'
        }
      />
    </div>
  )
}
