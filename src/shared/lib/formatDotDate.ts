const pad = (value: number) => String(value).padStart(2, '0')

// ISO 시각을 로컬 날짜 'YYYY.MM.DD'로 찍는다(리뷰 작성일, 주문·예약일).
export const formatDotDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}
