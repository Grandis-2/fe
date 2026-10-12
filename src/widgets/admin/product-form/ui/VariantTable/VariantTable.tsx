import type {
  ProductColorOption,
  ProductOptionGroup,
  ProductVariant,
} from '@entities/admin-product'
import { formatNumber } from '@shared/lib/formatNumber'
import { Table } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { NumberField } from '../NumberField'

import * as styles from './VariantTable.css'

export type VariantTableProps = {
  variants: ProductVariant[]
  colors: ProductColorOption[]
  optionGroups: ProductOptionGroup[]
  quantities: Record<string, number>
  onQuantityChange: (key: string, quantity: number) => void
  /**
   * 사전예약이면 등록 때 받는 수량이 전체 재고가 아니라 1차 배송 물량이다 —
   * 2차 이후는 배송 차수 탭에서 따로 정하므로 이름으로 구분해 준다.
   */
  isPreorder?: boolean
}

export function VariantTable({
  variants,
  colors,
  optionGroups,
  quantities,
  onQuantityChange,
  isPreorder = false,
}: VariantTableProps) {
  const quantityLabel = isPreorder ? '1차 배송 수량' : '수량'
  const hexByName = new Map(
    colors.map((colorOption) => [
      colorOption.noColor ? '색상 없음' : colorOption.name,
      colorOption.hex,
    ]),
  )

  // '색상 없음'이면 색상 컬럼 자체가 의미가 없어 빼버린다.
  const hasNoColor = colors.some((colorOption) => colorOption.noColor)

  // 옵션 그룹 수에 따라 가운데 컬럼이 늘어나므로 컬럼도 함께 만들어낸다.
  const columns: TableColumn<ProductVariant>[] = [
    ...(hasNoColor
      ? []
      : [
          {
            key: 'color',
            header: '색상',
            align: 'center' as const,
            render: (variant: ProductVariant) => (
              <span className={styles.colorCell}>
                <span
                  className={styles.swatch}
                  style={{ background: hexByName.get(variant.colorName) }}
                  aria-hidden="true"
                />
                {variant.colorName}
              </span>
            ),
          },
        ]),
    ...optionGroups
      .filter((group) =>
        group.values.some((value) => value.label.trim() !== ''),
      )
      .map((group, index) => ({
        key: group.id,
        header: group.name || `옵션 ${index + 1}`,
        align: 'center' as const,
        render: (variant: ProductVariant) => variant.optionLabels[index] ?? '',
      })),
    {
      key: 'price',
      header: '가격',
      align: 'center',
      render: (variant) => formatNumber(variant.price),
    },
    {
      key: 'quantity',
      header: quantityLabel,
      align: 'center',
      width: isPreorder ? '170px' : '140px',
      render: (variant) => (
        <div className={styles.quantityField}>
          <NumberField
            size="small"
            label={quantityLabel}
            value={quantities[variant.key] ?? 0}
            onChange={(quantity) => onQuantityChange(variant.key, quantity)}
          />
        </div>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      rows={variants}
      rowKey={(variant) => variant.key}
      emptyMessage="색상과 옵션을 입력하면 조합이 자동으로 만들어집니다."
    />
  )
}
