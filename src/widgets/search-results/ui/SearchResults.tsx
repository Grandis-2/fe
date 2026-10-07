import { Fragment, useState } from 'react'

import { ChevronRight } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import {
  findCategoryId,
  ProductCard,
  useCategories,
  useProducts,
} from '@entities/product'
import { useProductCardSelection } from '@features/product-card-select'
import {
  ONGOING_PREORDERS,
  PreorderLinks,
  SearchField,
  toKeyword,
  useRecentSearches,
} from '@features/search'
import { searchResultsPath } from '@shared/config/routes'
import { InlineAlert, Navigator } from '@shared/ui'

import * as styles from './SearchResults.css'

// 그리드가 2·3·4열로 바뀌어도 마지막 줄이 비지 않게 셋 모두로 나누어떨어지는 수.
const PAGE_SIZE = 12
// 검색 화면 하나가 두 가지를 그린다. 검색어·필터·페이지는 URL에 둬서 새로고침·공유해도 유지된다.
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
  // URL은 1부터, API는 0부터 센다.
  const page = Math.max(1, Math.floor(Number(searchParams.get('page'))) || 1)

  const [query, setQuery] = useState(keyword)
  const { add } = useRecentSearches()
  // URL은 카테고리를 이름으로 들고 있어 트리에서 id를 찾는다 — 브랜드가 있으면 그 하위 카테고리.
  // ponytail: 백엔드 트리는 2단계(상위 > 브랜드)라 subCategory(스마트폰 등)로는 좁히지 못한다 —
  // 카테고리 이름·단계가 백엔드와 확정되면 메뉴(brandMenus)와 함께 맞춘다.
  const categories = useCategories()
  const categoryId =
    category && categories.data
      ? findCategoryId(categories.data, category, brand)
      : undefined
  // 트리에 없는 이름이면 목록을 묻지 않고 0건으로 둔다(전체 목록이 그 카테고리처럼 보이지 않게).
  const isUnknownCategory =
    isCategoryMode && Boolean(categories.data) && categoryId === undefined
  // 두 모드 모두 같은 목록 API로 받아 ProductCard로 그린다. 정렬은 백엔드가 최신 등록순으로 고정한다.
  const pageQuery = { page: page - 1, size: PAGE_SIZE }
  const productList = useProducts(
    keyword ? { q: keyword, ...pageQuery } : { categoryId, ...pageQuery },
    { enabled: Boolean(keyword) || categoryId !== undefined },
  )

  const { getCardProps } = useProductCardSelection()

  const cards = isUnknownCategory ? [] : productList.data?.items
  const total = isUnknownCategory ? 0 : productList.data?.total
  const isError = productList.isError || (isCategoryMode && categories.isError)
  const totalPages = Math.ceil((total ?? 0) / PAGE_SIZE)
  // ponytail: 사전예약 목록 API가 없어 고정 목록에서 제목으로 찾는다 — API가 생기면 응답으로 교체.
  const preorders = ONGOING_PREORDERS.filter(({ title }) =>
    title.toLowerCase().includes(keyword.toLowerCase()),
  )
  const breadcrumb = [category, brand, subCategory].filter(
    (label): label is string => Boolean(label),
  )
  const cardMessage = isError
    ? '상품을 불러오지 못했어요.'
    : cards === undefined
      ? '불러오는 중이에요.'
      : cards.length === 0
        ? isCategoryMode
          ? '조건에 맞는 상품이 없어요.'
          : `'${keyword}' 검색 결과가 없어요.`
        : null

  // 검색어가 바뀌면 결과가 달라지므로 1페이지로 돌아간다.
  const setParam = (key: string, value: string) =>
    setSearchParams((prev) => {
      prev.set(key, value)
      if (key !== 'page') prev.delete('page')
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
        </div>
      )}

      {keyword && preorders.length > 0 && (
        <PreorderLinks preorders={preorders} />
      )}

      {(keyword || isCategoryMode) &&
        (cardMessage ? (
          <InlineAlert status={isError ? 'error' : 'info'}>
            {cardMessage}
          </InlineAlert>
        ) : (
          <>
            <div className={styles.cardGrid}>
              {cards?.map((product) => (
                <ProductCard
                  key={product.productId}
                  {...getCardProps(product)}
                />
              ))}
            </div>
            {totalPages > 1 && (
              // 공용 Navigator는 밝은 바탕 기준이라 이 안쪽만 어두운 토큰을 쓴다(ProductCard와 같은 방식).
              <div className={styles.pagination} data-theme="dark">
                <Navigator
                  totalPages={totalPages}
                  currentPage={page}
                  onPageChange={(next) => {
                    if (next === page) return
                    setParam('page', String(next))
                    window.scrollTo({ top: 0 })
                  }}
                />
              </div>
            )}
          </>
        ))}
    </div>
  )
}
