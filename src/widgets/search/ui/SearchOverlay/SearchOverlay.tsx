import { useEffect, useRef, useState, type MouseEvent } from 'react'

import { Search } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router'

import {
  brandMenus,
  usePopularKeywords,
  useProducts,
  type ProductListItem,
} from '@entities/product'
import { useRequireLogin } from '@features/login'
import { enterPreorderOnClick } from '@features/preorder-queue'
import {
  ONGOING_PREORDERS,
  PreorderLinks,
  ProductResults,
  SearchField,
  searchStyles as shared,
  toKeyword,
  useRecentSearches,
} from '@features/search'
import { searchPath, searchResultsPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { Chip, Highlight } from '@shared/ui'

import * as styles from './SearchOverlay.css'

const SUGGEST_LIMIT = 6
// 검색창 안 결과 그리드에 보일 상품 수.
const SEARCH_SIZE = 8
// 한 글자마다 요청하지 않도록 입력이 멈추고 나서 찾는다(한글 조합 중간값도 여기서 걸러진다).
const DEBOUNCE_MS = 250

export type SearchOverlayProps = {
  onClose: () => void
}

// 검색 아이콘을 누르면 화면 전체를 덮는다. 열 때 마운트하고 닫을 때 언마운트한다 —
// 그래서 다시 열면 검색어가 비어 있다. Esc·취소와 페이지 이동으로 닫힌다.
export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('')
  const { recent, add, remove, clear } = useRecentSearches()
  const navigate = useNavigate()
  const { key } = useLocation()
  const [openedAt] = useState(key)

  // 결과 선택·엔터뿐 아니라 밖에서 일어난 이동(대기열 완료 등)에도 닫혀야 한다 —
  // 링크마다 닫지 않고 주소가 바뀌면 여기서 한 번에 닫는다.
  useEffect(() => {
    if (key !== openedAt) onClose()
  }, [key, openedAt, onClose])

  // showModal()이라 최상위 레이어에 뜨고, 뒤 화면은 포커스·클릭이 막힌다.
  // StrictMode에선 effect가 두 번 돌아, 이미 열린 dialog에 showModal()을 다시 부르면 던진다.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(toKeyword(query)), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const trimmed = query.trim()
  const search = useProducts(
    { q: keyword, size: SEARCH_SIZE },
    { enabled: keyword !== '' },
  )
  const results = search.data?.items
  // 실패(503 등)·빈 목록이면 명세대로 영역째 숨긴다.
  const { data: popularKeywords } = usePopularKeywords()

  const pick = (label: string) => {
    setQuery(label)
    inputRef.current?.focus()
  }

  const commit = (label: string) => {
    pick(label)
    add(label)
  }

  // 예약 중인 사전예약 상품은 상세로 바로 가지 않고 대기열을 거친다(다른 목록과 같다).
  // 이동을 막아 주소가 그대로라 오버레이가 스스로 닫히지 않으므로 여기서 닫는다.
  const enterPreorder = enterPreorderOnClick(useRequireLogin())
  const handleProductClick =
    (product: ProductListItem) => (event: MouseEvent<HTMLAnchorElement>) => {
      enterPreorder(product)(event)
      if (event.defaultPrevented) onClose()
    }

  // 엔터와 같다 — 검색 결과 화면으로 간다(주소가 바뀌면 오버레이는 스스로 닫힌다).
  const submit = (label: string) => {
    add(label)
    navigate(searchResultsPath(label))
  }

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="검색"
      onClose={onClose}
    >
      <div className={styles.inner}>
        <div className={styles.bar}>
          <SearchField
            ref={inputRef}
            value={query}
            onChange={setQuery}
            onSubmit={submit}
          />
          <button
            type="button"
            className={[typography.body.defaultRegular, styles.cancel].join(
              ' ',
            )}
            onClick={onClose}
          >
            취소
          </button>
        </div>

        {!trimmed ? (
          <>
            {recent.length > 0 && (
              <section className={shared.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={shared.sectionTitle}>최근 검색어</h2>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={clear}
                  >
                    전체 삭제
                  </button>
                </div>
                <ul className={styles.chips} data-theme="dark">
                  {recent.map((label) => (
                    <li key={label}>
                      <Chip
                        onClick={() => pick(label)}
                        onRemove={() => remove(label)}
                        removeLabel={`${label} 삭제`}
                      >
                        {label}
                      </Chip>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {popularKeywords && popularKeywords.length > 0 && (
              <section className={shared.section}>
                <h2 className={shared.sectionTitle}>인기 검색어</h2>
                <ol className={styles.popular}>
                  {popularKeywords.map((label, index) => (
                    <li key={label}>
                      <button
                        type="button"
                        className={styles.popularItem}
                        onClick={() => commit(label)}
                      >
                        <span
                          className={
                            styles.popularRank[index < 3 ? 'top' : 'rest']
                          }
                        >
                          {index + 1}
                        </span>
                        <span className={styles.popularLabel}>{label}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            <section className={shared.section}>
              <h2 className={shared.sectionTitle}>카테고리</h2>
              <ul className={styles.chips} data-theme="dark">
                {Object.keys(brandMenus).map((category) => (
                  <li key={category}>
                    {/* 이동하면 경로가 바뀌어 오버레이는 스스로 닫힌다. */}
                    <Chip to={searchPath({ category })}>{category}</Chip>
                  </li>
                ))}
              </ul>
            </section>

            <PreorderLinks preorders={ONGOING_PREORDERS} />
          </>
        ) : (
          <>
            {!search.isError && results && results.length > 0 && (
              <ul className={styles.suggestions}>
                {results.slice(0, SUGGEST_LIMIT).map((product) => (
                  <li key={product.productId}>
                    {/* 상세로 바로 가지 않고 상품명으로 검색 결과 화면을 연다. */}
                    <button
                      type="button"
                      className={styles.suggestion}
                      onClick={() => submit(product.title)}
                    >
                      <Search
                        className={styles.suggestionIcon}
                        aria-hidden="true"
                      />
                      <Highlight
                        text={product.title}
                        match={keyword}
                        className={styles.match}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <ProductResults
              keyword={keyword}
              results={results}
              isError={search.isError}
              onProductClick={handleProductClick}
            />
          </>
        )}
      </div>
    </dialog>
  )
}
