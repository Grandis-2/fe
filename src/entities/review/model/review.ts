import type { ReviewView } from '@shared/api/types'

// 응답 모양 그대로 쓴다. 시각(createdAt·updatedAt)은 ISO 문자열이고 화면에서 formatDotDate(@shared/lib)로 찍는다.
export type Review = ReviewView
