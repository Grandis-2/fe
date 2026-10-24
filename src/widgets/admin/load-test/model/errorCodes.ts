/** 외부 등록 실패 코드의 뜻 — 표에 같이 적는다. 모르는 코드는 비워 둔다 */
export const errorCodeMeaning: Record<string, string> = {
  TIMEOUT: '외부 응답 없음(타임아웃)',
  EXT_TIMEOUT: '외부 응답 없음(타임아웃)',
  HTTP_429: '외부가 속도 제한',
  HTTP_500: '외부 내부 오류',
  HTTP_502: '외부 게이트웨이 오류',
  HTTP_503: '외부 일시 사용 불가',
  HTTP_504: '외부 게이트웨이 타임아웃',
}
