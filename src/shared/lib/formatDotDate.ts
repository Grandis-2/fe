const pad = (value: number) => String(value).padStart(2, '0')

// ISO 시각을 로컬 날짜 'YYYY.MM.DD'로 찍는다(리뷰 작성일, 주문·예약일).
export const formatDotDate = (iso: string) => {
  const date = new Date(iso)
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}

// ISO 시각을 로컬 'YYYY.MM.DD HH:mm:ss'로 찍는다(관리자 이력·연동 기록처럼 초까지 봐야 하는 곳).
export const formatDotDateTime = (iso: string) => {
  const date = new Date(iso)
  return `${formatDotDate(iso)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
