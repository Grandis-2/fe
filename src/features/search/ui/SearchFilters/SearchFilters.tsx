import { useId, type ReactNode } from 'react'

import { RotateCcw } from 'lucide-react'

import { brandMenus, productBrandNames } from '@entities/product'
import { Chip, Dropdown } from '@shared/ui'

import { useSearchFilters } from '../../lib/useSearchFilters'
import { SORT_OPTIONS, STORAGE_OPTIONS } from '../../model/searchFilters'

import * as styles from './SearchFilters.css'

const BRAND_NAMES = Object.values(productBrandNames)

function FilterGroup({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  const id = useId()
  return (
    <div className={styles.group} role="group" aria-labelledby={id}>
      <span id={id} className={styles.groupLabel}>
        {label}
      </span>
      <div className={styles.chips}>{children}</div>
    </div>
  )
}

export type SearchFiltersProps = {
  /** 카테고리 둘러보기의 대분류(모바일 등). 주면 맨 위에 하위 분류 줄이 붙는다. */
  category?: string
}

// 검색 결과 위의 필터 줄 — 브랜드·용량은 여러 개 고를 수 있고(같은 줄 안은 OR, 줄끼리는 AND), 정렬은 하나.
// 하위 분류는 하나만 고른다. 고른 값은 URL에 남는다(useSearchFilters).
export function SearchFilters({ category }: SearchFiltersProps) {
  const {
    selected,
    sort,
    activeCount,
    subCategory,
    toggle,
    setSort,
    setSubCategory,
    reset,
  } = useSearchFilters()
  const subCategories = category && brandMenus[category]?.categories

  return (
    // 공용 Chip·Dropdown은 테마 토큰이라 어두운 검색 화면에선 이 안쪽만 어두운 토큰을 쓴다.
    <div className={styles.root} data-theme="dark">
      <div className={styles.groups}>
        {subCategories && (
          <FilterGroup label="분류">
            <Chip
              selected={!subCategory}
              onClick={() => setSubCategory(undefined)}
            >
              전체
            </Chip>
            {subCategories.map((name) => (
              <Chip
                key={name}
                selected={subCategory === name}
                onClick={() => setSubCategory(name)}
              >
                {name}
              </Chip>
            ))}
          </FilterGroup>
        )}
        <FilterGroup label="브랜드">
          {BRAND_NAMES.map((name) => (
            <Chip
              key={name}
              selected={selected.brand.includes(name)}
              onClick={() => toggle('brand', name)}
            >
              {name}
            </Chip>
          ))}
        </FilterGroup>
        <FilterGroup label="용량">
          {STORAGE_OPTIONS.map((storage) => (
            <Chip
              key={storage}
              selected={selected.storage.includes(storage)}
              onClick={() => toggle('storage', storage)}
            >
              {storage}
            </Chip>
          ))}
        </FilterGroup>
      </div>
      <div className={styles.side}>
        {activeCount > 0 && (
          <button type="button" className={styles.reset} onClick={reset}>
            <RotateCcw size={14} aria-hidden="true" />
            필터 초기화
          </button>
        )}
        <Dropdown
          size="small"
          width="128px"
          label="정렬"
          options={SORT_OPTIONS}
          value={sort}
          onSelect={setSort}
        />
      </div>
    </div>
  )
}
