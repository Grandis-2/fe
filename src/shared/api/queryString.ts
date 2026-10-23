/**
 * 쿼리 파라미터 객체를 `?a=1&b=2`로 만든다.
 *
 * 값이 없는 키(`undefined`·`null`·빈 문자열)는 빼야 한다 — 그냥 넣으면 서버가
 * `'undefined'`라는 문자열을 값으로 받는다. `0`과 `false`는 의미 있는 값이라 남긴다.
 *
 * 배열은 같은 키를 값마다 반복한다(`status=A&status=B`) — 서버가 여러 값을 받는 칸이 이 모양이다.
 * 빈 배열은 키째 빠진다.
 *
 * 붙일 게 없으면 빈 문자열을 돌려주므로 경로에 그대로 이어 붙일 수 있다 —
 * `` `${BASE}${toQueryString(params)}` ``가 `?` 하나만 달랑 남지 않는다.
 */
export function toQueryString(params: Record<string, unknown>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    if (Array.isArray(value))
      for (const item of value) query.append(key, String(item))
    else query.set(key, String(value))
  }
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}
