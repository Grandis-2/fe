import type {
  ProductColorOption,
  ProductOptionGroup,
  ProductVariant,
} from '@entities/admin-product'
import { formatNumber } from '@shared/lib/formatNumber'
import { Table, Toggle } from '@shared/ui'
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
  /** 수량 칸을 숨긴다 — 사전예약 수정 화면은 1차 배송 수량을 배송 구간 설정에서 고친다 */
  hideQuantity?: boolean
  /**
   * 조합마다 판매 여부를 고른다. 넘기지 않으면 칸이 없다.
   * - 등록: 끈 조합은 만들지 않는다(서버 excluded) — 수량도 받지 않는다
   * - 수정: 서버에 옵션을 지우는 API가 없어서 그만 팔 조합은 판매 중지로 둔다
   */
  pausedKeys?: string[]
  /** 등록 화면 — 끈 조합의 수량 칸을 막는다(만들지 않으니 재고가 없다) */
  excludeOnPause?: boolean
  onPausedChange?: (key: string, paused: boolean) => void
}

export function VariantTable({
  variants,
  colors,
  optionGroups,
  quantities,
  onQuantityChange,
  isPreorder = false,
  hideQuantity = false,
  pausedKeys,
  onPausedChange,
  excludeOnPause = false,
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
    ...(hideQuantity
      ? []
      : [
          {
            key: 'quantity',
            header: quantityLabel,
            align: 'center' as const,
            width: isPreorder ? '170px' : '140px',
            render: (variant: ProductVariant) => (
              <div className={styles.quantityField}>
                <NumberField
                  size="small"
                  label={quantityLabel}
                  disabled={
                    excludeOnPause && !!pausedKeys?.includes(variant.key)
                  }
                  value={quantities[variant.key] ?? 0}
                  onChange={(quantity) =>
                    onQuantityChange(variant.key, quantity)
                  }
                />
              </div>
            ),
          },
        ]),
    ...(pausedKeys && onPausedChange
      ? [
          {
            key: 'selling',
            header: '판매',
            align: 'center' as const,
            render: (variant: ProductVariant) => (
              <Toggle
                // 스위치만 있는 칸이라 어느 조합인지 이름에 담는다.
                aria-label={`${[variant.colorName, ...variant.optionLabels]
                  .filter(Boolean)
                  .join(' ')} 판매`}
                checked={!pausedKeys.includes(variant.key)}
                onChange={(event) =>
                  onPausedChange(variant.key, !event.target.checked)
                }
              />
            ),
          },
        ]
      : []),
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
