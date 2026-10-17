import { useState } from 'react'

import { ChevronRight } from 'lucide-react'

import type {
  ProductColorOption,
  ProductOptionGroup,
  ProductVariant,
} from '@entities/admin-product'
import { formatNumber } from '@shared/lib/formatNumber'
import { Button, Table, Toggle } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import { NumberField } from '../NumberField'

import * as styles from './VariantTable.css'

export type VariantTableProps = {
  variants: ProductVariant[]
  colors: ProductColorOption[]
  optionGroups: ProductOptionGroup[]
  quantities: Record<string, number>
  /** 바뀐 조합만 담아 보낸다 — 일괄 적용은 여러 조합을 한 번에 바꾼다 */
  onQuantitiesChange: (changes: Record<string, number>) => void
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
  /** 색상 단위로 한 번에 켜고 끌 수 있어 조합 여러 개를 받는다 */
  onPausedChange?: (keys: string[], paused: boolean) => void
}

// 조합은 색상 × 옵션으로 곱해져 금방 수십 줄이 된다 — 색상별로 접고, 수량은 한꺼번에 넣게 한다.
export function VariantTable({
  variants,
  colors,
  optionGroups,
  quantities,
  onQuantitiesChange,
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
  const isPaused = (variant: ProductVariant) =>
    !!pausedKeys?.includes(variant.key)
  // 등록 화면에서 끈 조합은 만들지 않으니 수량을 받지도, 일괄 적용에 넣지도 않는다.
  const isQuantityLocked = (variant: ProductVariant) =>
    excludeOnPause && isPaused(variant)

  const applyQuantity = (rows: ProductVariant[], quantity: number) =>
    onQuantitiesChange(
      Object.fromEntries(
        rows
          .filter((variant) => !isQuantityLocked(variant))
          .map((variant) => [variant.key, quantity]),
      ),
    )

  // '색상 없음'이면 색상으로 묶을 게 없어 표 하나로 보여준다.
  const hasNoColor = colors.some((colorOption) => colorOption.noColor)
  const groups = new Map<string, ProductVariant[]>()
  if (!hasNoColor) {
    for (const variant of variants) {
      groups.set(variant.colorName, [
        ...(groups.get(variant.colorName) ?? []),
        variant,
      ])
    }
  }

  // 옵션 그룹 수에 따라 가운데 컬럼이 늘어나므로 컬럼도 함께 만들어낸다.
  // 색상은 묶음 머리줄에 있어 컬럼으로 두지 않는다.
  const columns: TableColumn<ProductVariant>[] = [
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
                  disabled={isQuantityLocked(variant)}
                  value={quantities[variant.key] ?? 0}
                  onChange={(quantity) =>
                    onQuantitiesChange({ [variant.key]: quantity })
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
                checked={!isPaused(variant)}
                onChange={(event) =>
                  onPausedChange([variant.key], !event.target.checked)
                }
              />
            ),
          },
        ]
      : []),
  ]

  const table = (rows: ProductVariant[]) => (
    <Table
      columns={columns}
      rows={rows}
      rowKey={(variant) => variant.key}
      emptyMessage="색상과 옵션을 입력하면 조합이 자동으로 만들어집니다."
    />
  )

  return (
    <div className={styles.root}>
      {!hideQuantity && variants.length > 0 && (
        <BulkQuantity
          label={`${quantityLabel} 일괄 입력`}
          applyLabel="전체에 적용"
          onApply={(quantity) => applyQuantity(variants, quantity)}
        />
      )}

      {groups.size === 0
        ? table(variants)
        : [...groups].map(([colorName, rows], index) => {
            const counted = rows.filter((variant) => !isQuantityLocked(variant))
            const total = counted.reduce(
              (sum, variant) => sum + (quantities[variant.key] ?? 0),
              0,
            )
            const emptyCount = counted.filter(
              (variant) => !quantities[variant.key],
            ).length
            const allSelling = rows.every((variant) => !isPaused(variant))

            return (
              // 첫 색상만 펼쳐 둔다 — 나머지는 머리줄의 합계·경고로 상태를 본다.
              <details
                key={colorName}
                className={styles.group}
                open={index === 0}
              >
                <summary className={styles.summary}>
                  <ChevronRight className={styles.chevron} aria-hidden="true" />
                  <span
                    className={styles.swatch}
                    style={{ background: hexByName.get(colorName) }}
                    aria-hidden="true"
                  />
                  <span className={styles.colorName}>{colorName}</span>
                  <span className={styles.meta}>
                    {rows.length}개 조합
                    {!hideQuantity &&
                      ` · ${quantityLabel} 합계 ${formatNumber(total)}`}
                  </span>
                  {!hideQuantity && emptyCount > 0 && (
                    <span className={styles.warning}>
                      {quantityLabel} 0인 조합 {emptyCount}개
                    </span>
                  )}
                </summary>

                <div className={styles.groupBody}>
                  {/* 머리줄(summary)은 누르면 접히므로 조작은 펼친 안쪽에 둔다. */}
                  <div className={styles.groupActions}>
                    {!hideQuantity && (
                      <BulkQuantity
                        label={`${colorName} ${quantityLabel}`}
                        applyLabel="이 색상에 적용"
                        onApply={(quantity) => applyQuantity(rows, quantity)}
                      />
                    )}
                    {pausedKeys && onPausedChange && (
                      <label className={styles.groupToggle}>
                        이 색상 전체 판매
                        <Toggle
                          // 색상마다 같은 문구라 어느 색상인지 이름에 담는다.
                          aria-label={`${colorName} 전체 판매`}
                          checked={allSelling}
                          onChange={() =>
                            onPausedChange(
                              rows.map((variant) => variant.key),
                              allSelling,
                            )
                          }
                        />
                      </label>
                    )}
                  </div>
                  {table(rows)}
                </div>
              </details>
            )
          })}
    </div>
  )
}

type BulkQuantityProps = {
  label: string
  applyLabel: string
  onApply: (quantity: number) => void
}

function BulkQuantity({ label, applyLabel, onApply }: BulkQuantityProps) {
  const [quantity, setQuantity] = useState(0)

  return (
    <div className={styles.bulk}>
      <div className={styles.bulkField}>
        <NumberField
          size="small"
          label={label}
          value={quantity}
          onChange={setQuantity}
        />
      </div>
      <Button
        type="button"
        size="small"
        variant="outline"
        onClick={() => onApply(quantity)}
      >
        {applyLabel}
      </Button>
    </div>
  )
}
