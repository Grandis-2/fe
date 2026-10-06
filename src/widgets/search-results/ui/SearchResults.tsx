import { Fragment, useState } from 'react'

import { ChevronRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import {
  ProductCard,
  useProductSearch,
  useSearchProductCards,
  type ProductCardSort,
} from '@entities/product'
import { useProductCardSelection } from '@features/product-card-select'
import {
  ONGOING_PREORDERS,
  PreorderLinks,
  ProductResults,
  SearchField,
  toKeyword,
  useRecentSearches,
} from '@features/search'
import { searchResultsPath } from '@shared/config/routes'
import { InlineAlert } from '@shared/ui'

import * as styles from './SearchResults.css'

// 카테고리 API는 가격 정렬만 받는다 — 추천순은 정렬 없이 보낸다(아래 cardSort).
const SORT_OPTIONS: {
  label: string
  value: 'RECOMMENDED' | ProductCardSort
}[] = [
  { label: '추천순', value: 'RECOMMENDED' },
  { label: '낮은 가격순', value: 'PRICE_ASC' },
  { label: '높은 가격순', value: 'PRICE_DESC' },
]
// ponytail: 페이지 나눔 없이 한 번에 받는다(API 최대 100개) — 결과가 더 많아지면 무한 스크롤로.
const RESULT_LIMIT = 100

// 검색 화면 하나가 두 가지를 그린다. 검색어·필터·정렬은 URL에 둬서 새로고침·공유해도 유지된다.
// - 키워드 검색(/search/results?q=): 검색창에서 엔터. 검색어가 바뀌면 페이지가 key로 다시 그려 입력값을 맞춘다.
// - 카테고리 둘러보기(/search?category=&subCategory=&brand=): 헤더 메가 메뉴·메인 카테고리 제목에서 온다.
export function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const keyword = toKeyword(searchParams.get('q') ?? '')
  // 검색어가 있으면 키워드 검색이 우선이다.
  const category = keyword ? undefined : searchParams.get('category')
  const isCategoryMode = Boolean(category)
  const subCategory = searchParams.get('subCategory') ?? undefined
  const brand = searchParams.get('brand') ?? undefined
  const sort =
    SORT_OPTIONS.find(({ value }) => value === searchParams.get('sort')) ??
    SORT_OPTIONS[0]
  const cardSort = sort.value === 'RECOMMENDED' ? undefined : sort.value

  const [query, setQuery] = useState(keyword)
  const { add } = useRecentSearches()
  const search = useProductSearch(keyword, {
    size: RESULT_LIMIT,
    sort: sort.value,
  })
  const categorySearch = useSearchProductCards(
    { category: category ?? undefined, subCategory, brand, sort: cardSort },
    { enabled: isCategoryMode },
  )
  const { getCardProps } = useProductCardSelection()

  const results = search.data?.items
  const cards = categorySearch.data?.items
  const total = isCategoryMode ? categorySearch.data?.total : search.data?.total
  const hasResults = Boolean((isCategoryMode ? cards : results)?.length)
  // ponytail: 사전예약 목록 API가 없어 고정 목록에서 제목으로 찾는다 — API가 생기면 응답으로 교체.
  const preorders = ONGOING_PREORDERS.filter(({ title }) =>
    title.toLowerCase().includes(keyword.toLowerCase()),
  )
  const breadcrumb = [category, brand, subCategory].filter(
    (label): label is string => Boolean(label),
  )
  const cardMessage = categorySearch.isPending
    ? '불러오는 중이에요.'
    : categorySearch.isError
      ? '상품을 불러오지 못했어요.'
      : cards?.length === 0
        ? '조건에 맞는 상품이 없어요.'
        : null

  const setParam = (key: string, value: string) =>
    setSearchParams((prev) => {
      prev.set(key, value)
      return prev
    })

  return (
    <div className={styles.root}>
      <SearchField
        value={query}
        onChange={setQuery}
        onSubmit={(submitted) => {
          add(submitted)
          // 카테고리 화면에서 검색하면 필터를 버리고 키워드 검색 화면으로 넘어간다.
          if (isCategoryMode) navigate(searchResultsPath(submitted))
          else setParam('q', submitted)
        }}
      />

      {(keyword || isCategoryMode) && (
        <div className={styles.header}>
          <div className={styles.heading}>
            <h1 className={styles.title}>
              {isCategoryMode
                ? breadcrumb.map((label, index) => (
                    <Fragment key={label}>
                      {index > 0 && (
                        <ChevronRight className={styles.chevron} aria-hidden />
                      )}
                      {label}
                    </Fragment>
                  ))
                : `'${keyword}'`}
            </h1>
            {total !== undefined && (
              <span className={styles.total}>
                {isCategoryMode ? '상품' : '검색 결과'}{' '}
                <b className={styles.count}>{total}</b>개
              </span>
            )}
          </div>
          {hasResults && (
            <div className={styles.sorts} role="group" aria-label="정렬">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={styles.sort}
                  aria-pressed={option === sort}
                  onClick={() => setParam('sort', option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {isCategoryMode &&
        (cardMessage ? (
          <InlineAlert status={categorySearch.isError ? 'error' : 'info'}>
            {cardMessage}
          </InlineAlert>
        ) : (
          <div className={styles.cardGrid}>
            {cards?.map((product) => (
              <ProductCard key={product.productId} {...getCardProps(product)} />
            ))}
          </div>
        ))}

      {keyword && (
        <>
          {preorders.length > 0 && <PreorderLinks preorders={preorders} />}
          <ProductResults
            keyword={keyword}
            results={results}
            isError={search.isError}
          />
        </>
      )}
    </div>
  )
}
