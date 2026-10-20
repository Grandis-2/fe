/** 배너 탭 아이콘 — lucide 아이콘 이름. 이 20개 밖은 400(field=icon)이다 */
export type BannerIcon =
  | 'Smartphone'
  | 'Tablet'
  | 'Laptop'
  | 'Watch'
  | 'Headphones'
  | 'Camera'
  | 'Gamepad2'
  | 'BookOpen'
  | 'MessageSquareText'
  | 'Gift'
  | 'Sparkles'
  | 'Star'
  | 'Tag'
  | 'Percent'
  | 'Truck'
  | 'Zap'
  | 'Bell'
  | 'CalendarDays'
  | 'ShoppingBag'
  | 'Heart'

/** 배너를 누르면 갈 곳. PRODUCT는 일반 판매 상품만 — 사전예약 상품은 400(target.id)이다 */
export type BannerTarget = {
  type: 'PRODUCT' | 'PROMOTION'
  id: string
}

/** [catalog] 관리자 배너 한 장(AdminBannerView) */
export type AdminBannerView = {
  bannerId: string
  /** 20자 이하 */
  badge: string
  /** 100자 이하. 줄바꿈(\n)이 들어 있을 수 있다 */
  title: string
  /** 200자 이하 */
  description: string
  /** 60자 이하 */
  tabLabel: string
  icon: BannerIcon
  /** POST /admin/images?purpose=BANNER로 올린 주소 */
  imageUrl: string
  /** 100자 이하 */
  imageAlt: string
  target: BannerTarget
  /** 0부터. 지운 배너 자리만큼 비어 있을 수 있어 배열 순서대로 그린다 */
  position: number
  /** 관리자가 켠 노출 여부 */
  visible: boolean
  /** false면 대상 상품이 목록에 없거나 홍보 기간 밖이라 자동으로 숨은 상태 */
  targetLive: boolean
  createdAt: string
  updatedAt: string
}

/** [catalog] 만들기(POST)·고치기(PUT) 본문(BannerRequest). 모든 칸이 필수다 */
export type AdminBannerRequest = Pick<
  AdminBannerView,
  | 'badge'
  | 'title'
  | 'description'
  | 'tabLabel'
  | 'icon'
  | 'imageUrl'
  | 'imageAlt'
  | 'target'
  | 'visible'
>
