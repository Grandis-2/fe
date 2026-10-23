import type { ReviewView, WritableItemView } from '@shared/api/types'

// 응답 모양 그대로 쓴다. 시각(createdAt·updatedAt)은 ISO 문자열이고 화면에서 formatDotDate(@shared/lib)로 찍는다.
export type Review = ReviewView
// 리뷰를 쓸 수 있는 내 주문상품 한 줄(주문 당시 이름·사진·금액).
export type WritableItem = WritableItemView
