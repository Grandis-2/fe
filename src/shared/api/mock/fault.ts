/**
 * 요청 모니터의 [장애 내기]가 고르는 목 장애. 고른 요청만 503으로 실패한다(forceErrorHandler).
 * 토스 결제창을 다녀오거나 다른 화면으로 가도 이어지도록 sessionStorage에 둔다 — 탭을 닫으면 풀린다.
 * msw를 불러오지 않아 화면 코드가 import해도 목 코드가 번들에 실리지 않는다.
 */
export const MOCK_FAULTS = {
  all: { label: '모든 요청', path: '/api/' },
  queue: { label: '대기열 조회', method: 'GET', path: '/preorders/queue' },
  confirm: { label: '결제 승인', method: 'POST', path: '/confirm' },
} as const satisfies Record<
  string,
  { label: string; method?: string; path: string }
>

export type MockFault = keyof typeof MOCK_FAULTS

const KEY = 'mock-fault'

export const readMockFault = (): MockFault | null => {
  try {
    const value = sessionStorage.getItem(KEY)
    return value !== null && value in MOCK_FAULTS ? (value as MockFault) : null
  } catch {
    return null
  }
}

export const setMockFault = (fault: MockFault | null) => {
  try {
    if (fault) sessionStorage.setItem(KEY, fault)
    else sessionStorage.removeItem(KEY)
  } catch {
    // 저장소를 못 쓰면 장애를 걸지 않는다.
  }
}

// 지금 고른 장애가 이 요청에 걸리는지.
export const hitsMockFault = (method: string, pathname: string) => {
  const fault = readMockFault()
  if (!fault) return false
  const target: { method?: string; path: string } = MOCK_FAULTS[fault]
  return (
    (!target.method || target.method === method) &&
    pathname.includes(target.path)
  )
}
