/**
 * 글자를 클립보드에 복사한다. 클립보드 API가 없는 환경(http 같은 비보안 컨텍스트)에선
 * navigator.clipboard가 아예 없어 바로 부르면 동기로 던진다 — 그것도 거절된 Promise로 바꿔
 * 호출부의 catch 하나로 실패 안내를 띄우게 한다.
 */
export const copyText = async (text: string) => {
  await navigator.clipboard.writeText(text)
}
