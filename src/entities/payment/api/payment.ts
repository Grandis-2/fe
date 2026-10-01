import { apiClient } from '@/shared/api/client'
import type {
  ConfirmPaymentRequest,
  ConfirmPaymentResponse,
  PreparePaymentRequest,
  PreparePaymentResponse,
} from '@/shared/api/types'

// ① 결제 준비 — 토스 결제창을 열기 전에 주문ID·금액을 서버에 먼저 확정해 둔다.
export const preparePayment = (body: PreparePaymentRequest) =>
  apiClient.request<PreparePaymentResponse>('/api/v1/payments/prepare', {
    method: 'POST',
    body,
  })

// ③ 결제 승인 — 토스가 successUrl로 돌려준 값을 그대로 서버에 넘긴다. 서버는 이
// amount를 ①에서 저장해둔 값과 대조해 위변조를 걸러낸 뒤에만 토스 승인 API를 부른다.
export const confirmPayment = (body: ConfirmPaymentRequest) =>
  apiClient.request<ConfirmPaymentResponse>('/api/v1/payments/confirm', {
    method: 'POST',
    body,
  })
