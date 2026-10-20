import { useEffect, useState } from 'react'

// 사진 목록이 바뀌면(예: 색 선택) 새 사진을 다 받아 둘 때까지 이전 목록을 돌려준다 — 바로 바꾸면
// <img>가 새로 마운트돼 받는 동안 빈 칸이 깜박인다. 못 받은 사진이 있어도 기다림은 끝내고
// 넘긴다(그 칸은 ImageWithFallback이 대체 그림으로 그린다).
export function usePreloadedSrcs(srcs: string[]) {
  // 호출부가 렌더마다 새 배열을 넘겨도 같은 목록이면 다시 받지 않도록 문자열로 비교한다.
  const key = srcs.join('\n')
  const [shownKey, setShownKey] = useState(key)

  useEffect(() => {
    let cancelled = false
    const next = key ? key.split('\n') : []
    Promise.allSettled(
      next.map((src) => {
        const image = new Image()
        image.src = src
        return image.decode()
      }),
    ).then(() => {
      if (!cancelled) setShownKey(key)
    })
    return () => {
      cancelled = true
    }
  }, [key])

  if (shownKey === key) return srcs
  return shownKey ? shownKey.split('\n') : []
}
