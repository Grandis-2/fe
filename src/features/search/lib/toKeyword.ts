// 검색어 최대 길이. 입력창 maxLength와 아래 toKeyword가 같은 값을 쓴다.
export const KEYWORD_MAX_LENGTH = 50

// 검색어가 들어오는 모든 입구(입력창 엔터, 오버레이 미리보기, 주소의 ?q=)가 거치는 정리 규칙.
// maxLength는 타이핑만 막아서, 코드가 넣은 값(최근 검색어·공유 링크)은 여기서 자른다.
// ponytail: 프론트에서만 자른다 — 서버도 q 길이를 검증해야 API 직접 호출까지 막힌다.
export const toKeyword = (raw: string) =>
  raw.trim().slice(0, KEYWORD_MAX_LENGTH).trim()
