import { useSearchParams } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import { useDragScroll } from '@shared/lib/useDragScroll'
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
  const dragScroll = useDragScroll<HTMLDivElement>()
  const { data: products = [] } = useAdminProducts({ saleMode: 'PREORDER' })

  return (
    <div className={styles.root}>
      {/* 상품을 바꾸면 범위 안의 값이 다른 상품 것이라 처음부터 다시 그린다. */}
      <AdminLoadTest
        key={productId ?? 'all'}
        productId={productId}
        // 제목 줄 오른쪽 도구(범위·Grafana·구간 기록)가 넓어 설명 없이 제목만 둔다(시안과 같다).
        header={{ title: '부하 검증' }}
        scope={
          <div
            className={styles.scope}
            role="group"
            aria-label="볼 상품"
            {...dragScroll}
          >
            {[{ productId: undefined, name: '전체' }, ...products].map(
              (product) => (
                <Chip
                  key={product.productId ?? 'all'}
                  variant="solid"
                  className={styles.scopeChip}
                  selected={product.productId === productId}
                  aria-pressed={product.productId === productId}
                  onClick={() => setProductId(product.productId)}
                >
                  {product.name}
                </Chip>
              ),
            )}
          </div>
        }
      />
    </div>
  )
}
