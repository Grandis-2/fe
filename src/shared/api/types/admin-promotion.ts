/**
 * 사전예약 프로모션(사전예약 페이지). 백엔드에 아직 API가 없다 — 프론트가 제안하는
 * 모양이고, 목업(admin-promotion 핸들러)이 실서버에 붙을 때도 이 경로만 대신 받는다.
 * 명세가 나오면 여기를 명세에 맞춘다.
 */
export type AdminPromotionStatus = 'SCHEDULED' | 'ONGOING' | 'ENDED'

export type AdminPromotionView = {
  promotionId: string
  name: string
  /** 진행 기간과 오늘 날짜로 서버가 정한다 */
  status: AdminPromotionStatus
  /** 'YYYY-MM-DD' */
  startAt: string
  endAt: string
  linkedProductIds: string[]
  thumbnailUrl: string | null
  detailImageUrls: string[]
  /** 고객에게 보여줄 프로모션 페이지 주소 — 링크 복사에 쓴다 */
  publicUrl: string
}

/** 생성(POST)과 수정(PUT)이 같은 본문을 쓴다. 수정은 통째로 바꾼다 */
export type AdminPromotionUpsertRequest = Pick<
  AdminPromotionView,
  | 'name'
  | 'startAt'
  | 'endAt'
  | 'linkedProductIds'
  | 'thumbnailUrl'
  | 'detailImageUrls'
>
