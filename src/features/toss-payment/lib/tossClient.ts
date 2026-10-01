import { loadTossPayments } from '@tosspayments/tosspayments-sdk'

// SDK 로드는 한 번만 — 결제 버튼을 여러 번 눌러도 같은 Promise를 재사용한다.
let client: ReturnType<typeof loadTossPayments> | null = null

export function getTossPayments() {
  client ??= loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY)
  return client
}
