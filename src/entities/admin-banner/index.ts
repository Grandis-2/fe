export { useCreateAdminBanner } from './api/useAdminBanners'
// 사진 업로드는 조회가 아니라 파일마다 한 번 보내는 일이라 생 함수를 내보낸다 — 업로더의
// upload로 넘기기만 한다(admin-product의 uploadProductImage와 같다).
export { uploadBannerImage } from './api/adminBanner'
export {
  BANNER_TEXT_MAX,
  bannerFormProblem,
  createEmptyBannerFormValue,
} from './model/types'
export type {
  AdminBannerFormValue,
  BannerTargetType,
  BannerTextField,
} from './model/types'
