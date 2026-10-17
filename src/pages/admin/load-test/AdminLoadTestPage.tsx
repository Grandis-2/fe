import { useSearchParams } from 'react-router'

import { useAdminProducts } from '@entities/admin-product'
import { Dropdown } from '@shared/ui'
import type { DropdownOption } from '@shared/ui'
import { AdminLoadTest } from '@widgets/admin/load-test'

import * as styles from './AdminLoadTestPage.css'

const PRODUCT_PARAM = 'product'

/**
 * 부하 검증(개발자 기능) — 시험 중 서비스 상태를 지켜본다. 사전예약이 여럿 열려 있으면
 * 어느 상품이 막혔는지 봐야 해서 상품을 고른다. 이름은 겹칠 수 있어 productId로 고르고,
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

  const productOptions: DropdownOption<string | undefined>[] = [
    { label: '전체 상품', value: undefined },
    ...products.map((product) => ({
      label: product.name,
      value: product.productId,
    })),
  ]
  const productNames = new Map(
    products.map((product) => [product.productId, product.name]),
  )

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.heading}>
          <h1 className={styles.title}>부하 검증</h1>
          <div className={styles.description}>
            부하를 거는 동안 대기열, 예약 처리, 외부 등록이 어떻게 버티는지
            봅니다. 서버 지표(TPS·응답 시간·에러율)는 Grafana에서 봅니다.
          </div>
        </div>
        <Dropdown
          label="현재 선택된 상품"
          size="medium"
          width="200px"
          options={productOptions}
          value={productId}
          onSelect={setProductId}
        />
      </div>
      {/* 상품을 바꾸면 쌓은 그래프·시험 기준점이 다른 상품 값이라 처음부터 다시 쌓는다. */}
      <AdminLoadTest
        key={productId ?? 'all'}
        productId={productId}
        productNames={productNames}
        onSelectProduct={setProductId}
      />
    </div>
  )
}
