import { useState } from 'react'

import { Search } from 'lucide-react'
import { useNavigate } from 'react-router'

import * as headerStyles from '../Header.css'

import * as styles from './HeaderSearch.css'

export type HeaderSearchProps = {
  onSearchClick?: () => void
}

// 데스크톱 전용 — 검색 아이콘을 누르면 입력창으로 바뀌고, 제출하면 /search로 이동한다.
// 모바일은 하단 탭바에 검색이 있어 헤더엔 두지 않는다.
export function HeaderSearch({ onSearchClick }: HeaderSearchProps) {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <button
        type="button"
        className={[headerStyles.iconButton, headerStyles.desktopOnly].join(
          ' ',
        )}
        aria-label="검색"
        onClick={() => {
          setIsOpen(true)
          onSearchClick?.()
        }}
      >
        <Search className={headerStyles.icon} aria-hidden="true" />
      </button>
    )
  }

  return (
    <form
      role="search"
      className={[styles.searchForm, headerStyles.desktopOnly].join(' ')}
      onSubmit={(event) => {
        event.preventDefault()
        const keyword = new FormData(event.currentTarget)
          .get('keyword')
          ?.toString()
          .trim()
        if (!keyword) return
        navigate(`/search?${new URLSearchParams({ keyword })}`)
        setIsOpen(false)
      }}
    >
      <Search className={styles.searchIcon} aria-hidden="true" />
      <input
        name="keyword"
        type="search"
        className={styles.searchInput}
        placeholder="검색어를 입력해 주세요."
        aria-label="검색어"
        autoFocus
        // 입력 없이 포커스를 잃거나 Esc를 누르면 다시 아이콘으로 접는다.
        onBlur={(event) => {
          if (!event.currentTarget.value) setIsOpen(false)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setIsOpen(false)
        }}
      />
    </form>
  )
}
