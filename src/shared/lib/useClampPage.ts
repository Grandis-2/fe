import { useEffect } from 'react'

/**
 * 보던 쪽이 마지막 쪽을 넘으면 마지막 쪽으로 옮긴다. 건수가 줄었거나(재처리로 탭이 비거나 폴링
 * 중 행이 다른 탭으로 감) 옛 주소(?page=5)로 들어오면 빈 표만 남고, 한 쪽뿐이면 쪽 이동도
 * 숨어 돌아갈 길이 없다. totalPages는 지금 쪽의 응답을 받았을 때만 준다 — 쪽을 바꾸는 동안
 * 보이는 이전 쪽(placeholder)의 건수로 옮기면 안 된다.
 */
export function useClampPage(
  page: number,
  totalPages: number | null,
  goTo: (page: number) => void,
) {
  const last = Math.max(totalPages ?? 1, 1)
  const over = totalPages !== null && page > last
  useEffect(() => {
    if (over) goTo(last)
  }, [over, last, goTo])
}
