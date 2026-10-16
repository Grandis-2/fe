import type { PromotionLinkableProduct } from '@entities/admin-promotion'
import { srOnly } from '@shared/config/theme'
import { Button, Checkbox, Skeleton } from '@shared/ui'

import * as styles from './PromotionProductLinker.css'

export type PromotionProductLinkerProps = {
  products: PromotionLinkableProduct[]
  /** 상품 목록을 받는 중 — '상품 없음' 대신 카드 모양을 먼저 깐다 */
  loading?: boolean
  /** 연결할 상품들 — 체크하면 바로 여기 반영되고, 폼을 저장할 때 함께 저장된다 */
  value: string[]
  onChange: (productIds: string[]) => void
  onAddProduct: () => void
}

export function PromotionProductLinker({
  products,
  loading = false,
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

      {loading ? (
        <div className={styles.list} role="status" aria-busy="true">
          <span className={srOnly}>불러오는 중입니다.</span>
          {[0, 1].map((row) => (
            <div key={row} className={styles.skeletonCard}>
              <Skeleton width="40%" height={22} />
              <Skeleton width={120} height={18} />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
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
                  {/* 옵션은 상세를 받아야 알 수 있고, 그 축이 없는 상품도 있다. */}
                  {product.colors.length > 0 && (
                    <span className={styles.optionRow}>
                      <span className={styles.optionLabel}>색상</span>
                      <span className={styles.optionValues}>
                        {product.colors.join('  ')}
                      </span>
                    </span>
                  )}
                  {product.storages.length > 0 && (
                    <span className={styles.optionRow}>
                      <span className={styles.optionLabel}>용량</span>
                      <span className={styles.optionValues}>
                        {product.storages.join('  ')}
                      </span>
                    </span>
                  )}
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
