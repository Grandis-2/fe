import type { PromotionLinkableProduct } from '@entities/admin-promotion'
import { Button, Checkbox } from '@shared/ui'

import * as styles from './PromotionProductLinker.css'

export type PromotionProductLinkerProps = {
  products: PromotionLinkableProduct[]
  /** 연결할 상품들 — 체크하면 바로 여기 반영되고, 폼을 저장할 때 함께 저장된다 */
  value: string[]
  onChange: (productIds: string[]) => void
  onAddProduct: () => void
}

export function PromotionProductLinker({
  products,
  value,
  onChange,
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
        {value.length === 0
          ? '선택한 상품이 없습니다'
          : `${value.length}개 상품 선택됨`}
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
      </div>
    </div>
  )
}
