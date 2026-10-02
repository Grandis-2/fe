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
}

export function VariantTable({
  variants,
  colors,
  optionGroups,
  quantities,
  onQuantityChange,
}: VariantTableProps) {
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
      header: '수량',
      align: 'center',
      width: '140px',
      render: (variant) => (
        <div className={styles.quantityField}>
          <NumberField
            size="small"
            label="수량"
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
