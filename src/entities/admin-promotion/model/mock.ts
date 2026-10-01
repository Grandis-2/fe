import type {
  AdminPromotion,
  AdminPromotionFormValue,
  PromotionLinkableProduct,
} from './types'

/**
 * ponytail: 사전예약 프로모션 API가 아직 없어서 화면을 채울 표본을 여기 둔다.
 * MSW 핸들러가 생기면 이 파일을 지우고 entities/admin-promotion/api로 옮긴다.
 * 목적이 화면 확인이라 shared/api/mock(DTO 기반 목)과는 성격이 다르다.
 */
export const mockPromotions: AdminPromotion[] = [
  {
    promotionId: 'PRM-1',
    name: '아이폰 18 PRO 사전예약 Open!',
    status: 'ONGOING',
    startAt: '2026-09-15',
    endAt: '2026-09-21',
    linkedProductIds: ['AP-I18-PRO', 'AP-I18-PRO-MAX'],
    publicUrl: 'https://nova.example.com/preorder/PRM-1',
  },
  {
    promotionId: 'PRM-2',
    name: '갤럭시 G999 얼리버드',
    status: 'SCHEDULED',
    startAt: '2026-10-01',
    endAt: '2026-10-07',
    linkedProductIds: ['SM-G999'],
    publicUrl: 'https://nova.example.com/preorder/PRM-2',
  },
  {
    promotionId: 'PRM-3',
    name: 'Fold 8 사전예약',
    status: 'ENDED',
    startAt: '2026-07-01',
    endAt: '2026-07-10',
    linkedProductIds: ['SM-FOLD8', 'SM-FOLD8-SE'],
    publicUrl: 'https://nova.example.com/preorder/PRM-3',
  },
]

const COLORS = ['딥 블루', '블랙 티타늄', '레드 건틀릿']
const STORAGES = ['128GB', '256GB', '512GB', '1TB']

export const mockLinkableProducts: PromotionLinkableProduct[] = [
  {
    productId: 'AP-I18-PRO',
    name: '아이폰 18 Pro',
    openAtLabel: '9/20 12:00 오픈',
    colors: COLORS,
    storages: STORAGES,
  },
  {
    productId: 'AP-I18-PRO-MAX',
    name: '아이폰 18 Pro Max',
    openAtLabel: '9/20 12:00 오픈',
    colors: COLORS,
    storages: STORAGES,
  },
  {
    productId: 'AP-I18',
    name: '아이폰 18',
    openAtLabel: '9/20 12:00 오픈',
    colors: COLORS,
    storages: STORAGES,
  },
  // 아래 셋은 mockPromotions가 이미 연결해 둔 상품이다. 목록에 없으면
  // 수정 화면에서 연결 개수만 보이고 해제할 카드가 없다.
  {
    productId: 'SM-G999',
    name: '갤럭시 G999',
    openAtLabel: '10/1 10:00 오픈',
    colors: COLORS,
    storages: STORAGES,
  },
  {
    productId: 'SM-FOLD8',
    name: 'Samsung Fold 8',
    openAtLabel: '7/1 10:00 오픈',
    colors: COLORS,
    storages: STORAGES,
  },
  {
    productId: 'SM-FOLD8-SE',
    name: 'Samsung Fold 8 SE',
    openAtLabel: '7/1 10:00 오픈',
    colors: COLORS,
    storages: STORAGES,
  },
]

export const findMockPromotion = (promotionId: string) =>
  mockPromotions.find((promotion) => promotion.promotionId === promotionId)

/** 수정 화면이 쓸 초기값 — 이미지는 표본이 없어 비워 둔다 */
export const toPromotionFormValue = (
  promotion: AdminPromotion,
): AdminPromotionFormValue => ({
  name: promotion.name,
  startAt: promotion.startAt,
  endAt: promotion.endAt,
  thumbnail: null,
  detailImages: [],
  linkedProductIds: promotion.linkedProductIds,
})
