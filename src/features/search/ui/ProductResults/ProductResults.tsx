import {
  ProductTile,
  ProductTileSkeleton,
  useProducts,
  type ProductListItem,
} from '@entities/product'
import { Highlight, InlineAlert } from '@shared/ui'

import * as shared from '../search.css'

import * as styles from './ProductResults.css'

const FALLBACK_LIMIT = 4

export type ProductResultsProps = {
  keyword: string
  // 아직 첫 결과를 못 받았으면 undefined — 스켈레톤을 보여 준다.
  results: ProductListItem[] | undefined
  isError: boolean
}

// 검색창(SearchOverlay)과 검색 결과 화면(SearchResults)이 같이 쓰는 상품 영역 —
// 실패·불러오는 중·0건(대신 추천 상품)·결과 그리드.
export function ProductResults({
  keyword,
  results,
  isError,
}: ProductResultsProps) {
  // 결과가 0건일 때 대신 보여 줄 상품(최신 등록순).
  const fallback = useProducts({ size: FALLBACK_LIMIT })

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
              {fallback.data.items.map((product) => (
                <ProductTile
                  key={product.productId}
                  productId={product.productId}
                  name={product.title}
                  imageUrl={product.imageUrl}
                  price={product.minPrice}
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
                text={product.title}
                match={keyword}
                className={styles.match}
              />
            }
            imageUrl={product.imageUrl}
            price={product.minPrice}
          />
        ))}
      </div>
    </section>
  )
}
