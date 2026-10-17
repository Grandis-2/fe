import { ApiRequestError, apiClient } from '@shared/api/client'
import { toQueryString } from '@shared/api/queryString'
import type { ConfirmPaymentRequest, DrawListParams } from '@shared/api/types'

import type {
  Draw,
  DrawEntry,
  DrawPage,
  DrawPaymentAttempt,
  DrawPaymentResult,
  EnterDrawRequest,
} from '../model/draw'

const path = (drawId: string) => `/api/v1/draws/${encodeURIComponent(drawId)}`

// [order] GET /api/v1/draws — 회차 목록
// 회차 목록 — 최신순, 로그인 없이 부를 수 있다. 예정·응모 중·마감이 모두 온다.
export const getDraws = (params: DrawListParams, signal?: AbortSignal) =>
  apiClient.request<DrawPage>(`/api/v1/draws${toQueryString(params)}`, {
    signal,
  })

// [order] GET /api/v1/draws/{drawId} — 회차 상세
export const getDraw = (drawId: string, signal?: AbortSignal) =>
  apiClient.request<Draw>(path(drawId), { signal })

// [order] GET /api/v1/draws/{drawId}/entries/me — 내 응모
// 내 응모와 추첨 결과. 응모하지 않았으면 서버가 404 DRAW_ENTRY_NOT_FOUND를 주는데 오류가 아니라 "응모 전"이라
// null로 돌려준다. 그 밖의 실패(401 등)는 그대로 던진다.
export const getMyDrawEntry = (drawId: string, signal?: AbortSignal) =>
  apiClient
    .request<DrawEntry>(`${path(drawId)}/entries/me`, { signal })
    .catch((caught: unknown) => {
      if (
        caught instanceof ApiRequestError &&
        caught.error.code === 'DRAW_ENTRY_NOT_FOUND'
      )
        return null
      throw caught
    })

// [order] POST /api/v1/draws/{drawId}/entries — 응모하기
// ① 응모 — 배송지만 보낸다. 새 응모는 201(응모비 결제 전), 이미 응모했으면 200으로 기존 응모(새 배송지는 무시).
// 같은 요청을 다시 보내도 응모는 하나라서 네트워크 오류는 그대로 다시 보내도 된다.
export const enterDraw = (drawId: string, body: EnterDrawRequest) =>
  apiClient.request<DrawEntry>(`${path(drawId)}/entries`, {
    method: 'POST',
    body,
  })

// [order] POST /api/v1/draws/{drawId}/entries/me/payment-attempts — 응모비 결제 준비
// ② 응모비 결제 준비 — 토스 결제창을 열기 직전에(본문 없음). 부를 때마다 새 tossOrderId가 나온다.
export const createEntryPaymentAttempt = (drawId: string) =>
  apiClient.request<DrawPaymentAttempt>(
    `${path(drawId)}/entries/me/payment-attempts`,
    { method: 'POST' },
  )

// [order] POST /api/v1/draws/{drawId}/entries/me/payment-attempts/{tossOrderId}/confirm — 응모비 결제 승인
// ③ 응모비 결제 승인 — successUrl 쿼리(orderId=tossOrderId, paymentKey, amount)를 옮겨 보낸다. 최대 70초 걸릴 수 있다.
// 기본 타임아웃(10초)으로는 승인 중에 끊겨 재전송이 409로 돌아오므로 70초보다 길게 기다린다.
export const confirmEntryPayment = ({
  drawId,
  tossOrderId,
  ...body
}: ConfirmPaymentRequest & { drawId: string; tossOrderId: string }) =>
  apiClient.request<DrawPaymentResult>(
    `${path(drawId)}/entries/me/payment-attempts/${encodeURIComponent(tossOrderId)}/confirm`,
    { method: 'POST', body, timeout: 80_000 },
  )
