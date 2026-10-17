/**
 * 화면에 보일 짧은 번호(UUID 뒤 8자리, 대문자). 서버 id는 시간순 UUID(v7)라 앞자리는
 * 만든 시각이다 — 비슷한 때 만든 것끼리 같아지므로 무작위인 뒷자리를 쓴다.
 */
export const shortId = (uuid: string) => uuid.slice(-8).toUpperCase()
