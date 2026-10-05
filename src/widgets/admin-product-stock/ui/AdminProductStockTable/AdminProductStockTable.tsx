import {
  getAdminProductStocks,
  isPreorder,
  useAdminProduct,
  useAdminProductStock,
  type AdminProductStock,
} from '@entities/admin-product'
import { getErrorMessage } from '@shared/api/client'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { Table } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

export type AdminProductStockTableProps = {
  productId: string
}

/** 옵션(색상 × 용량)별 재고 현황 — 재고 수량에 상품 상세의 옵션 이름·가격을 붙여 보여준다 */
export function AdminProductStockTable({
  productId,
}: AdminProductStockTableProps) {
  const product = useAdminProduct(productId)
  const stock = useAdminProductStock(productId)

  const columns: TableColumn<AdminProductStock>[] = [
    {
      key: 'color',
      header: '색상',
      align: 'center',
      render: (row) => row.color,
    },
    {
      key: 'capacity',
      header: '용량',
      align: 'center',
      render: (row) => row.capacity,
    },
    {
      key: 'totalCount',
      header: '총수량',
      align: 'center',
      render: (row) => formatNumber(row.totalCount),
    },
    {
      key: 'price',
      header: '가격',
      align: 'center',
      render: (row) => formatWon(row.price),
    },
    {
      key: 'confirmedCount',
      // 같은 reservedQuantity지만 일반 판매에는 '확정' 단계가 없어 팔린 수량으로 읽힌다.
      header: product.data && isPreorder(product.data) ? '확정' : '판매',
      align: 'center',
      render: (row) => `${formatNumber(row.confirmedCount)}건`,
    },
    {
      key: 'remainingCount',
      header: '잔여',
      align: 'center',
      render: (row) => `${formatNumber(row.remainingCount)}건`,
    },
  ]

  const failed = product.error ?? stock.error

  return (
    <Table
      columns={columns}
      rows={
        product.data && stock.data
          ? getAdminProductStocks(product.data, stock.data)
          : []
      }
      rowKey={(row) => row.optionCode}
      pageSize={10}
      // 조회 실패를 '재고 없음'으로 보이면 운영 판단이 정반대가 된다.
      emptyMessage={
        failed
          ? getErrorMessage(failed, '재고를 불러오지 못했습니다.')
          : product.isPending || stock.isPending
            ? '불러오는 중입니다.'
            : '등록된 재고가 없습니다.'
      }
    />
  )
}
