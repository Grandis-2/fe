const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// 하루 안은 '방금'/'n분 전'/'n시간 전', 그보다 오래되면 날짜만 보여준다.
export const formatNotificationTime = (createdAt: string, now = Date.now()) => {
  const elapsed = now - new Date(createdAt).getTime()
  if (elapsed < MINUTE) return '방금'
  if (elapsed < HOUR) return `${Math.floor(elapsed / MINUTE)}분 전`
  if (elapsed < DAY) return `${Math.floor(elapsed / HOUR)}시간 전`
  const date = new Date(createdAt)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}
