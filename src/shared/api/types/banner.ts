import type { AdminBannerView } from './admin-banner'

/** [catalog] 고객 메인 배너 한 장(BannerView) — 관리자 배너에서 순서·노출 관리 칸을 뺀 모양 */
export type BannerView = Pick<
  AdminBannerView,
  | 'bannerId'
  | 'badge'
  | 'title'
  | 'description'
  | 'tabLabel'
  | 'icon'
  | 'imageUrl'
  | 'imageAlt'
  | 'target'
>

/** GET /api/v1/banners — 관리자가 정한 순서 그대로. 보일 배너가 없으면 빈 배열 */
export type BannerListResponse = { items: BannerView[] }
