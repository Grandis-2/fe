const numberFormatter = new Intl.NumberFormat('ko-KR')

// 천 단위 구분 — 로케일을 고정해서 브라우저 설정과 무관하게 같은 모양이 나온다.
export const formatNumber = (value: number) => numberFormatter.format(value)

export const formatWon = (value: number) => `${formatNumber(value)}원`
