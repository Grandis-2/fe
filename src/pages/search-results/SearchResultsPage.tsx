import { useSearchParams } from 'react-router'

import { SearchResults } from '@widgets/search-results'

import * as styles from './SearchResultsPage.css'

// 헤더 뒤까지 어두운 바탕을 끌어올리고 헤더 글자는 흰색(data-header-theme)으로 둔다.
export function SearchResultsPage() {
  const [searchParams] = useSearchParams()

  return (
    <div className={styles.root} data-header-theme="dark">
      {/* 검색어가 바뀌면 다시 그려 검색창 입력값을 새 검색어로 맞춘다. */}
      <SearchResults key={searchParams.get('q')} />
    </div>
  )
}
