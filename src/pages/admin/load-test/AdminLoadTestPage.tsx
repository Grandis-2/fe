import { useSearchParams } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import { Chip } from '@shared/ui'
import { AdminLoadTest } from '@widgets/admin/load-test'

import * as styles from './AdminLoadTestPage.css'

const PRODUCT_PARAM = 'product'

/**
 * 부하 검증(개발자 기능) — 부하를 넣는 동안 서비스 상태를 실시간으로 지켜본다. 사전예약이
 * 여럿 열려 있으면 어느 상품이 막혔는지 봐야 해서 상품을 고른다. 이름은 겹칠 수 있어 productId로 고르고,
 * 새로고침해도 남게 주소(?product=)에 둔다.
 */
export function AdminLoadTestPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const productId = searchParams.get(PRODUCT_PARAM) ?? undefined
  const setProductId = (next: string | undefined) =>
    setSearchParams(
      (prev) => {
        if (next) prev.set(PRODUCT_PARAM, next)
        else prev.delete(PRODUCT_PARAM)
        return prev
      },
      { replace: true },
    )
  const { data: products = [] } = useAdminProducts({
    saleMode: 'PREORDER',
    size: 100,
  })

  return (
    <div className={styles.root}>
      <div className={styles.heading}>
        <h1 className={styles.title}>부하 검증</h1>
        <div className={styles.description}>
          부하를 거는 동안 대기열, 예약 처리, 외부 등록이 어떻게 버티는지
          봅니다. 서버 지표(TPS·응답 시간·에러율)는 Grafana에서 봅니다.
        </div>
      </div>
      <div className={styles.scope} role="group" aria-label="볼 상품">
        <span className={styles.scopeLabel}>범위</span>
        {[{ productId: undefined, name: '전체' }, ...products].map(
          (product) => (
            <Chip
              key={product.productId ?? 'all'}
              variant="solid"
              selected={product.productId === productId}
              aria-pressed={product.productId === productId}
              onClick={() => setProductId(product.productId)}
            >
              {product.name}
            </Chip>
          ),
        )}
      </div>
      {/* 상품을 바꾸면 범위 안의 값이 다른 상품 것이라 처음부터 다시 그린다. */}
      <AdminLoadTest key={productId ?? 'all'} productId={productId} />
    </div>
  )
}
