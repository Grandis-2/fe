import { Fragment, useState } from 'react'

import { ChevronRight } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { ProductCard, useSearchProductCards } from '@entities/product'
import type { ProductCardSort } from '@entities/product'
import { useProductCardSelection } from '@features/product-card-select'
import { Container, Dropdown, InlineAlert } from '@shared/ui'

import * as styles from './SearchPage.css'

const SORT_OPTIONS: { label: string; value: ProductCardSort }[] = [
  { label: '낮은 가격순', value: 'PRICE_ASC' },
  { label: '높은 가격순', value: 'PRICE_DESC' },
]

// 헤더 메가 메뉴에서 /search?category=모바일&subCategory=스마트폰 으로 들어온다.
export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? undefined
  const subCategory = searchParams.get('subCategory') ?? undefined
  const brand = searchParams.get('brand') ?? undefined
  const sort = SORT_OPTIONS.find(
    ({ value }) => value === searchParams.get('sort'),
  )
  const [isSortOpen, setIsSortOpen] = useState(false)
  const { data, isPending, isError } = useSearchProductCards({
    category,
    subCategory,
    brand,
    sort: sort?.value,
  })
  const { getCardProps } = useProductCardSelection()
  const message = isPending
    ? '불러오는 중이에요.'
    : isError
      ? '상품을 불러오지 못했어요.'
      : data?.items.length === 0
        ? '조건에 맞는 상품이 없어요.'
        : null

  // 정렬도 URL에 남겨서 새로고침·공유해도 유지되게 한다.
  const handleSortSelect = (_: string, index: number) => {
    setSearchParams((prev) => {
      prev.set('sort', SORT_OPTIONS[index].value)
      return prev
    })
    setIsSortOpen(false)
  }

  const breadcrumb = [category ?? '전체', brand, subCategory].filter(
    (label) => label !== undefined,
  )

  return (
    <Container>
      <div className={styles.header}>
        <div className={styles.titleRow}>
          <div className={styles.title}>
            {breadcrumb.map((label, index) => (
              <Fragment key={label}>
                {index > 0 && (
                  <ChevronRight className={styles.chevron} aria-hidden="true" />
                )}
                <span>{label}</span>
              </Fragment>
            ))}
          </div>
          {data && <span className={styles.total}>총 {data.total}개</span>}
        </div>
        <Dropdown
          size="small"
          width="120px"
          label="가격순"
          options={SORT_OPTIONS.map(({ label }) => label)}
          open={isSortOpen}
          selectedOption={sort?.label}
          onToggle={() => setIsSortOpen((open) => !open)}
          onSelect={handleSortSelect}
        />
      </div>
      {message ? (
        <InlineAlert status={isError ? 'error' : 'info'}>{message}</InlineAlert>
      ) : (
        <div className={styles.cardGrid}>
          {data?.items.map((product) => (
            <ProductCard key={product.productId} {...getCardProps(product)} />
          ))}
        </div>
      )}
    </Container>
  )
}
