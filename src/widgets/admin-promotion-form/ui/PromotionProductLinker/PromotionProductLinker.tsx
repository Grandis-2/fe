import type { PromotionLinkableProduct } from '@/entities/admin-promotion'
import { Button, Checkbox } from '@/shared/ui'

import * as styles from './PromotionProductLinker.css'

export type PromotionProductLinkerProps = {
  products: PromotionLinkableProduct[]
  /** 지금 체크된 상품들 */
  value: string[]
  onChange: (productIds: string[]) => void
  /** 실제로 프로모션에 묶인 상품 수 — 체크만 하고 아직 누르지 않았을 수 있다 */
  linkedCount: number
  onLink: () => void
  onAddProduct: () => void
}

export function PromotionProductLinker({
  products,
  value,
  onChange,
  linkedCount,
  onLink,
  onAddProduct,
}: PromotionProductLinkerProps) {
  const toggle = (productId: string) =>
    onChange(
      value.includes(productId)
        ? value.filter((id) => id !== productId)
        : [...value, productId],
    )

  return (
    <div className={styles.root}>
      <div className={styles.summary}>
        {linkedCount === 0
          ? '아직 연결되지 않음'
          : `${linkedCount}개 상품이 연결됨`}
      </div>

      {products.length === 0 ? (
        <div className={styles.empty}>사전예약으로 등록된 상품이 없습니다.</div>
      ) : (
        <div className={styles.list}>
          {products.map((product) => {
            const selected = value.includes(product.productId)
            return (
              <button
                key={product.productId}
                type="button"
                className={[styles.card, selected && styles.cardSelected]
                  .filter(Boolean)
                  .join(' ')}
                aria-pressed={selected}
                onClick={() => toggle(product.productId)}
              >
                {/* 카드 전체가 버튼이라 체크박스는 표시만 하고 클릭은 받지 않는다. */}
                <Checkbox checked={selected} readOnly tabIndex={-1} />
                <span className={styles.body}>
                  <span className={styles.name}>{product.name}</span>
                  <span className={styles.openAt}>{product.openAtLabel}</span>
                  <span className={styles.optionRow}>
                    <span className={styles.optionLabel}>색상</span>
                    <span className={styles.optionValues}>
                      {product.colors.join('  ')}
                    </span>
                  </span>
                  <span className={styles.optionRow}>
                    <span className={styles.optionLabel}>용량</span>
                    <span className={styles.optionValues}>
                      {product.storages.join('  ')}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div className={styles.footer}>
        <Button variant="outline" color="cancel" onClick={onAddProduct}>
          추가 상품 등록하기
        </Button>
        <Button disabled={value.length === 0} onClick={onLink}>
          {value.length}개 연결
        </Button>
      </div>
    </div>
  )
}
