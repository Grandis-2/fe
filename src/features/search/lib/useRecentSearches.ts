import { useState } from 'react'

// 같은 localhost에서 도는 다른 앱과 키가 겹치지 않게 앞에 붙인다.
const STORAGE_KEY = 'nova:recentSearches'
const LIMIT = 8

// 시크릿 창·저장소 차단이면 읽기/쓰기가 던진다 — 그땐 최근 검색어 없이 동작한다.
const read = (): string[] => {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved)
      ? saved.filter((it): it is string => typeof it === 'string')
      : []
  } catch {
    return []
  }
}

// 최근 검색어는 이 브라우저에만 남긴다(기기 간 동기화는 하지 않는다). 최신이 맨 앞.
export function useRecentSearches() {
  const [recent, setRecent] = useState(read)

  const save = (next: string[]) => {
    setRecent(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // 저장하지 못해도 지금 화면에선 그대로 보인다.
    }
  }

  return {
    recent,
    add: (keyword: string) =>
      save([keyword, ...recent.filter((it) => it !== keyword)].slice(0, LIMIT)),
    remove: (keyword: string) => save(recent.filter((it) => it !== keyword)),
    clear: () => save([]),
  }
}
