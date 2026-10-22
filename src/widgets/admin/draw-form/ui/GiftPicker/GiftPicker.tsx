import { formatNumber } from '@shared/lib/formatNumber'
import { Button, Dropdown, FieldError, Skeleton } from '@shared/ui'

import * as styles from './GiftPicker.css'

import type { GiftOption, GiftProduct } from '../../lib/useGiftOptions'

export type GiftPickerProps = {
  /** 후보 상품. 불러오는 중이면 undefined */
  products: GiftProduct[] | undefined
  /** 고른 상품의 옵션. 상품을 고르기 전이거나 불러오는 중이면 undefined */
  options: GiftOption[] | undefined
  productId: string
  optionId: string
  onChange: (gift: { productId: string; optionId: string }) => void
  /** 매장에 팔지 않는 증정품은 비공개 상품으로 먼저 등록한다 */
  onAddProduct: () => void
  error?: string
  /** 후보·옵션을 못 불러왔을 때의 안내 */
  loadError?: string
  /** 입력한 당첨 인원 — 고른 옵션에서 얼마를 확보하고 얼마가 남는지 보여준다 */
  winnerCount?: number
}

/**
 * 증정품 고르기 — 상품을 고르면 그 상품의 판매 중 옵션과 가용 재고가 나온다. 회차를
 * 만들 때 당첨 인원만큼 이 재고를 확보한다.
 */
export function GiftPicker({
  products,
  options,
  productId,
  optionId,
  onChange,
  onAddProduct,
  error,
  loadError,
  winnerCount,
}: GiftPickerProps) {
  const selected = options?.find((option) => option.optionId === optionId)
  const reserving =
    winnerCount !== undefined &&
    Number.isInteger(winnerCount) &&
    winnerCount > 0
      ? winnerCount
      : null

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        {products ? (
          <Dropdown
            label={
              products.length === 0
                ? '고를 수 있는 일반 상품이 없습니다'
                : '상품을 골라 주세요'
            }
            width="100%"
            options={products.map((product) => ({
              label: product.name,
              value: product.productId,
            }))}
            value={productId || undefined}
            // 상품이 바뀌면 옵션은 다시 고른다.
            onSelect={(next) => onChange({ productId: next, optionId: '' })}
          />
        ) : (
          <Skeleton height={48} radius={8} />
        )}
        <Dropdown
          label={
            productId === ''
              ? '상품을 먼저 골라 주세요'
              : options?.length === 0
                ? '재고를 등록한 판매 중 옵션이 없습니다'
                : '옵션을 골라 주세요'
          }
          width="100%"
          options={(options ?? []).map((option) => ({
            label: `${option.label} · 가용 ${formatNumber(option.available)}개`,
            value: option.optionId,
          }))}
          value={optionId || undefined}
          onSelect={(next) => onChange({ productId, optionId: next })}
        />
      </div>

      {/* 만들면 바로 확보하는 재고 — 확인 모달까지 가지 않아도 남는 양이 보인다. */}
      {selected && (
        <div className={styles.stock}>
          <span className={styles.stockName}>
            {products?.find((product) => product.productId === productId)
              ?.name ?? ''}{' '}
            · {selected.label}
          </span>
          <span className={styles.stockText}>
            가용 재고 {formatNumber(selected.available)}개
            {reserving === null
              ? ' — 당첨 인원만큼 회차를 만들 때 바로 확보해요'
              : reserving > selected.available
                ? ` — 당첨 ${formatNumber(reserving)}명을 채우기에 ${formatNumber(reserving - selected.available)}개 모자라요`
                : ` → 만들면 ${formatNumber(reserving)}개를 바로 확보해요(남는 재고 ${formatNumber(selected.available - reserving)}개)`}
          </span>
        </div>
      )}
      <FieldError message={error ?? loadError} />

      <div className={styles.footer}>
        <span className={styles.hint}>
          매장에 팔지 않는 증정품은 비공개 일반 상품으로 먼저 등록해 주세요.
        </span>
        <Button
          size="small"
          variant="outline"
          color="cancel"
          onClick={onAddProduct}
        >
          증정품 상품 등록하기
        </Button>
      </div>
    </div>
  )
}
