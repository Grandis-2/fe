/**
 * 서버가 같은 값으로 보는지 비교할 때 쓰는 모양 — 공백을 떼고 대소문자를 무시한다.
 * 서버는 대소문자·전각·악센트만 다른 값도 같은 값으로 보고 400을 준다.
 */
export const comparableValue = (value: string) =>
  value.replace(/\s+/g, '').toLowerCase()
