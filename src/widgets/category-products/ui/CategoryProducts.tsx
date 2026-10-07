import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import {
  findCategoryId,
  ProductCard,
  useCategories,
  useProducts,
} from '@entities/product'
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
  // 메뉴는 카테고리를 이름으로 들고 있어 트리에서 id를 찾아 목록을 묻는다.
  const categories = useCategories()
  const categoryId =
    categories.data && findCategoryId(categories.data, category)
  const products = useProducts(
    { categoryId },
    { enabled: categoryId !== undefined },
  )
  // 트리에 없는 이름이면 목록을 묻지 않고 빈 줄로 둔다.
  const isUnknown = Boolean(categories.data) && categoryId === undefined
  const isPending = categories.isPending || (!isUnknown && products.isPending)
  const isError = categories.isError || products.isError
  const items = isUnknown ? [] : products.data?.items
  const { getCardProps } = useProductCardSelection()
  const { rowRef, onScroll, canPrev, canNext, page } = useScrollArrows(
    items?.length,
  )

  // 트리 조회가 실패하면 목록은 영영 안 묻기 때문에(pending 그대로) 실패를 먼저 본다.
  const message = isError
    ? `${category} 상품을 불러오지 못했어요.`
    : isPending
      ? '불러오는 중이에요.'
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
