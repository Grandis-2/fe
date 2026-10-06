import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import { ProductCard, useSearchProductCards } from '@entities/product'
import { useProductCardSelection } from '@features/product-card-select'
import { searchPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { useScrollArrows } from '@shared/lib/useScrollArrows'
import { InlineAlert, ScrollArrows } from '@shared/ui'

import * as styles from './CategoryProducts.css'

type CategoryProductsProps = {
  category: string
}

// 메인페이지의 대분류(모바일·PC/주변기기·웨어러블) 한 줄 — 제목(누르면 전체보기), 화살표, 가로로 넘기는 카드 목록.
// 스크롤 방식은 많이 찾는 상품 TOP 10(ProductRanking)과 같다.
export function CategoryProducts({ category }: CategoryProductsProps) {
  const { data, isPending, isError } = useSearchProductCards({ category })
  const items = data?.items
  const { getCardProps } = useProductCardSelection()
  const { rowRef, onScroll, canPrev, canNext, page } = useScrollArrows(
    items?.length,
  )

  const message = isPending
    ? '불러오는 중이에요.'
    : isError
      ? `${category} 상품을 불러오지 못했어요.`
      : items?.length === 0
        ? `아직 등록된 ${category} 상품이 없어요.`
        : null

  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <h3 className={[typography.title.xlSemibold, styles.title].join(' ')}>
          <Link
            to={searchPath({ category })}
            className={styles.titleLink}
            aria-label={`${category} 전체보기`}
          >
            {category}
            <ChevronRight size={22} aria-hidden className={styles.chevron} />
          </Link>
        </h3>
        {!message && (
          <ScrollArrows canPrev={canPrev} canNext={canNext} onPage={page} />
        )}
      </div>
      {message ? (
        <InlineAlert status={isError ? 'error' : 'info'}>{message}</InlineAlert>
      ) : (
        <div ref={rowRef} className={styles.row} onScroll={onScroll}>
          {items?.map((product) => (
            <ProductCard
              key={product.productId}
              {...getCardProps(product)}
              className={styles.card}
            />
          ))}
        </div>
      )}
    </section>
  )
}
