import { useState } from 'react'

import { Search } from 'lucide-react'

import { SearchOverlay } from '@widgets/search'

import * as headerStyles from '../Header.css'

export type HeaderSearchProps = {
  onSearchClick?: () => void
}

// 데스크톱 전용 — 검색 아이콘을 누르면 화면 전체를 덮는 검색창(SearchOverlay)이 열린다.
// 모바일은 하단 탭바에 검색이 있어 헤더엔 두지 않는다.
export function HeaderSearch({ onSearchClick }: HeaderSearchProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
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
      {isOpen && <SearchOverlay onClose={() => setIsOpen(false)} />}
    </>
  )
}
