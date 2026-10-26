// 다른 탭에 가 있으면 탭 제목을 바꿔 알리고, 돌아오면 되돌린다. 보고 있으면 아무것도 하지 않는다.
// effect에서 그대로 돌려줘 화면을 떠날 때도 되돌리게 한다 — `useEffect(() => alertTabTitle('...'), [...])`.
export function alertTabTitle(title: string) {
  if (!document.hidden) return undefined
  const original = document.title
  document.title = title
  const restore = () => {
    if (!document.hidden) document.title = original
  }
  document.addEventListener('visibilitychange', restore)
  return () => {
    document.removeEventListener('visibilitychange', restore)
    document.title = original
  }
}
