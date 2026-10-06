import { useEffect, useRef, useState } from 'react'

import { ChevronRight, Search, X } from 'lucide-react'
import { Link } from 'react-router'

import { useProductCards, useProductSearch } from '@entities/product'
import { productPath, searchPath } from '@shared/config/routes'
import { typography } from '@shared/config/theme'
import { formatWon } from '@shared/lib/formatNumber'
import { InlineAlert, PriceText } from '@shared/ui'
import { brandMenus } from '@widgets/category-nav'

import { useRecentSearches } from '../lib/useRecentSearches'
import {
  ONGOING_PREORDERS,
  POPULAR_KEYWORDS,
  type PreorderStatus,
} from '../model/searchSuggestions'

import * as styles from './SearchOverlay.css'

const SUGGEST_LIMIT = 6
const FALLBACK_LIMIT = 4
// 한 글자마다 요청하지 않도록 입력이 멈추고 나서 찾는다(한글 조합 중간값도 여기서 걸러진다).
const DEBOUNCE_MS = 250

const PREORDER_STATUS_LABEL: Record<PreorderStatus, string> = {
  open: '진행 중',
  upcoming: '오픈 예정',
}

type ResultCardProps = {
  productId: string
  name: string
  imageUrl?: string | null
  price: number
  onClick: () => void
}

export type SearchOverlayProps = {
  onClose: () => void
}

// 검색 아이콘을 누르면 화면 전체를 덮는다. 열 때 마운트하고 닫을 때 언마운트한다 —
// 그래서 다시 열면 검색어가 비어 있다. Esc·취소·결과 선택으로 닫힌다.
export function SearchOverlay({ onClose }: SearchOverlayProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [keyword, setKeyword] = useState('')
  const { recent, add, remove, clear } = useRecentSearches()

  // showModal()이라 최상위 레이어에 뜨고, 뒤 화면은 포커스·클릭이 막힌다.
  // StrictMode에선 effect가 두 번 돌아, 이미 열린 dialog에 showModal()을 다시 부르면 던진다.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setKeyword(query.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const trimmed = query.trim()
  const search = useProductSearch(keyword)
  const results = search.data?.items
  const isEmpty = results?.length === 0
  // 결과가 0건일 때 대신 보여 줄 상품. 메인 화면과 같은 캐시라 대개 이미 받아 둔 상태다.
  const fallback = useProductCards('best')

  const pick = (label: string) => {
    setQuery(label)
    inputRef.current?.focus()
  }

  const commit = (label: string) => {
    pick(label)
    add(label)
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
          <form
            role="search"
            className={styles.field}
            onSubmit={(event) => {
              event.preventDefault()
              if (trimmed) add(trimmed)
            }}
          >
            <Search className={styles.fieldIcon} aria-hidden="true" />
            <input
              ref={inputRef}
              type="search"
              className={styles.input}
              value={query}
              placeholder="상품명이나 모델을 검색해 보세요"
              aria-label="검색어"
              onChange={(event) => setQuery(event.target.value)}
            />
            {query && (
              <button
                type="button"
                className={styles.clear}
                aria-label="검색어 지우기"
                onClick={() => pick('')}
              >
                <X size={14} aria-hidden="true" />
              </button>
            )}
          </form>
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
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>최근 검색어</h2>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={clear}
                  >
                    전체 삭제
                  </button>
                </div>
                <ul className={styles.chips}>
                  {recent.map((label) => (
                    <li key={label} className={styles.recentChip}>
                      <button
                        type="button"
                        className={styles.recentLabel}
                        onClick={() => pick(label)}
                      >
                        {label}
                      </button>
                      <button
                        type="button"
                        className={styles.recentRemove}
                        aria-label={`${label} 삭제`}
                        onClick={() => remove(label)}
                      >
                        <X size={12} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>인기 검색어</h2>
              <ol className={styles.popular}>
                {POPULAR_KEYWORDS.map((label, index) => (
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

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>카테고리</h2>
              <ul className={styles.chips}>
                {Object.keys(brandMenus).map((category) => (
                  <li key={category}>
                    <Link
                      to={searchPath({ category })}
                      className={styles.categoryChip}
                      onClick={onClose}
                    >
                      {category}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>진행 중인 사전예약</h2>
              <ul className={styles.preorders}>
                {ONGOING_PREORDERS.map(({ title, status, to }) => (
                  <li key={title}>
                    <Link to={to} className={styles.preorder} onClick={onClose}>
                      <span className={styles.preorderStatus[status]}>
                        {PREORDER_STATUS_LABEL[status]}
                      </span>
                      <span className={styles.preorderTitle}>{title}</span>
                      <ChevronRight
                        className={styles.preorderChevron}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : search.isError ? (
          <InlineAlert status="error">상품을 검색하지 못했어요.</InlineAlert>
        ) : !results ? (
          // 첫 결과가 오기 전(입력 직후 대기 포함). 이후엔 직전 결과를 유지해 깜빡이지 않는다.
          <section className={styles.section} aria-busy>
            <span className={styles.srOnly}>검색하는 중</span>
            <h2 className={styles.sectionTitle}>상품</h2>
            <ResultGridSkeleton />
          </section>
        ) : isEmpty ? (
          <>
            <div className={styles.empty}>
              <div className={styles.emptyTitle}>
                &apos;{keyword}&apos; 검색 결과가 없어요
              </div>
              <div className={styles.emptyHint}>
                철자를 확인하거나 다른 검색어로 찾아보세요.
              </div>
            </div>
            {fallback.data && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  대신 이런 상품은 어때요?
                </h2>
                <div className={styles.grid}>
                  {fallback.data.slice(0, FALLBACK_LIMIT).map((product) => (
                    <ResultCard
                      key={product.productId}
                      productId={product.productId}
                      name={product.name}
                      imageUrl={product.colors[0]?.imageUrls[0]}
                      price={product.basePrice}
                      onClick={onClose}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <ul className={styles.suggestions}>
              {results.slice(0, SUGGEST_LIMIT).map((product) => (
                <li key={product.productId}>
                  <Link
                    to={productPath(product.productId)}
                    className={styles.suggestion}
                    onClick={() => {
                      add(product.name)
                      onClose()
                    }}
                  >
                    <Search
                      className={styles.suggestionIcon}
                      aria-hidden="true"
                    />
                    <Highlight text={product.name} match={keyword} />
                  </Link>
                </li>
              ))}
            </ul>
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>상품</h2>
              <div className={styles.grid}>
                {results.map((product) => (
                  <ResultCard
                    key={product.productId}
                    productId={product.productId}
                    name={product.name}
                    imageUrl={product.thumbnailUrl}
                    price={product.priceRange.min}
                    onClick={onClose}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </dialog>
  )
}

// 검색어와 겹치는 첫 부분만 굵게 — 대소문자는 가리지 않는다.
function Highlight({ text, match }: { text: string; match: string }) {
  const start = text.toLowerCase().indexOf(match.toLowerCase())
  if (!match || start < 0) return <span>{text}</span>
  const end = start + match.length
  return (
    <span>
      {text.slice(0, start)}
      <b className={styles.match}>{text.slice(start, end)}</b>
      {text.slice(end)}
    </span>
  )
}

function ResultCard({
  productId,
  name,
  imageUrl,
  price,
  onClick,
}: ResultCardProps) {
  return (
    <Link to={productPath(productId)} className={styles.card} onClick={onClick}>
      <div className={styles.cardImage}>
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className={styles.image}
            // 이미지를 못 받으면 깨진 아이콘 대신 빈 타일로 둔다.
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden'
            }}
          />
        )}
      </div>
      <span
        className={[typography.body.subSemibold, styles.cardName].join(' ')}
      >
        {name}
      </span>
      <span className={typography.body.defaultMedium}>
        <PriceText value={formatWon(price)} />
      </span>
    </Link>
  )
}

function ResultGridSkeleton() {
  return (
    <div className={styles.grid} aria-hidden>
      {Array.from({ length: FALLBACK_LIMIT }, (_, i) => (
        <div key={i} className={styles.card}>
          <div className={[styles.cardImage, styles.skeleton].join(' ')} />
          <div className={styles.lineSkeleton} style={{ width: '70%' }} />
          <div className={styles.lineSkeleton} style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  )
}
