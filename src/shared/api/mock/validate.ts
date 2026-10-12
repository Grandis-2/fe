import type { ApiViolation, PageResponse } from '../types'

// 코드포인트 기준 — 서버와 동일하게 이모지 1개를 1로 센다(11-frontend-guide.md §7).
export const codePointLength = (value: string) => [...value].length

// id는 UUID 문자열이다 — 형식이 틀리면 서버는 404가 아니라 400(VALIDATION_FAILED)을 준다.
export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export const uuidViolation = (field: string): ApiViolation => ({
  field,
  message: '형식이 맞지 않습니다.',
})

// 목록 공통 오프셋 페이징 — page는 0부터(기본 0), size는 1~100(기본 20). 벗어나면 400.
export function readPaging(params: URLSearchParams) {
  const page = Number(params.get('page') ?? 0)
  const size = Number(params.get('size') ?? 20)
  const violations: ApiViolation[] = []
  if (!Number.isInteger(page) || page < 0)
    violations.push({ field: 'page', message: '0 이상이어야 합니다.' })
  if (!Number.isInteger(size) || size < 1 || size > 100)
    violations.push({ field: 'size', message: '1~100 이어야 합니다.' })
  return { page, size, violations }
}

// 마지막 쪽을 넘기면 items가 빈 배열로 온다.
export const toPage = <TItem>(
  items: TItem[],
  page: number,
  size: number,
): PageResponse<TItem> => ({
  page,
  size,
  total: items.length,
  hasNext: (page + 1) * size < items.length,
  items: items.slice(page * size, (page + 1) * size),
})
