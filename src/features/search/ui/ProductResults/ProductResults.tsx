import {
  ProductTile,
  ProductTileSkeleton,
  useProductCards,
  type ProductSearchItem,
} from '@entities/product'
import { Highlight, InlineAlert } from '@shared/ui'

import * as shared from '../search.css'

import * as styles from './ProductResults.css'

const FALLBACK_LIMIT = 4

export type ProductResultsProps = {
  keyword: string
  // 아직 첫 결과를 못 받았으면 undefined — 스켈레톤을 보여 준다.
  results: ProductSearchItem[] | undefined
  isError: boolean
}

// 검색창(SearchOverlay)과 검색 결과 화면(SearchResults)이 같이 쓰는 상품 영역 —
// 실패·불러오는 중·0건(대신 추천 상품)·결과 그리드.
export function ProductResults({
  keyword,
  results,
  isError,
}: ProductResultsProps) {
  // 결과가 0건일 때 대신 보여 줄 상품. 메인 화면과 같은 캐시라 대개 이미 받아 둔 상태다.
  const fallback = useProductCards('best')

  if (isError) {
    return <InlineAlert status="error">상품을 검색하지 못했어요.</InlineAlert>
  }

  if (!results) {
    return (
      <section className={shared.section} aria-busy>
        <span className={shared.srOnly}>검색하는 중</span>
        <h2 className={shared.sectionTitle}>상품</h2>
        <div className={styles.grid} aria-hidden>
          {Array.from({ length: FALLBACK_LIMIT }, (_, i) => (
            <ProductTileSkeleton key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (results.length === 0) {
    return (
      <>
        <section className={shared.section}>
          <h2 className={shared.sectionTitle}>상품</h2>
          <div className={styles.empty}>
            <div className={styles.emptyTitle}>
              &apos;{keyword}&apos; 검색 결과가 없어요
            </div>
            <div className={styles.emptyHint}>
              철자를 확인하거나 다른 검색어로 찾아보세요.
            </div>
          </div>
        </section>
        {fallback.data && (
          <section className={shared.section}>
            <h2 className={styles.fallbackTitle}>대신 이런 상품은 어때요?</h2>
            <div className={styles.grid}>
              {fallback.data.slice(0, FALLBACK_LIMIT).map((product) => (
                <ProductTile
                  key={product.productId}
                  productId={product.productId}
                  name={product.name}
                  imageUrl={product.colors[0]?.imageUrls[0]}
                  price={product.basePrice}
                />
              ))}
            </div>
          </section>
        )}
      </>
    )
  }

  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>상품</h2>
      <div className={styles.grid}>
        {results.map((product) => (
          <ProductTile
            key={product.productId}
            productId={product.productId}
            name={
              <Highlight
                text={product.name}
                match={keyword}
                className={styles.match}
              />
            }
            imageUrl={product.thumbnailUrl}
            price={product.priceRange.min}
          />
        ))}
      </div>
    </section>
  )
}
