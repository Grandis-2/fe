export type ApiViolation = {
  field: string
  message: string
}

// violations/retryable은 에러 코드별로 있을 때만 오는 부가 정보라 details 아래에
// 중첩된다 — 서버 봉투가 실제로 이 모양이다(11-frontend-guide.md §1).
export type ApiErrorDetails = {
  violations?: ApiViolation[]
  retryable?: boolean
}

export type ApiError = {
  code: string
  message: string
  details: ApiErrorDetails | null
}

// success를 판별자로 쓰는 union — success가 true면 data가 non-null로 좁혀지고,
// false면 error가 non-null로 좁혀진다. 호출부에서 옵셔널 체이닝이 필요 없어진다.
export type ApiResponse<TData> =
  | {
      success: true
      data: TData
      error: null
      timestamp: string
      traceId: string
    }
  | {
      success: false
      data: null
      error: ApiError
      timestamp: string
      traceId: string
    }

export type Paged<TItem> = {
  items: TItem[]
  page: number
  size: number
  total: number
  totalPages: number
  hasNext: boolean
}
