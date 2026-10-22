export {
  PromotionUnconfirmedError,
  useAdminPromotion,
  useAdminPromotions,
  useCreateAdminPromotion,
  usePromotionLinkableProducts,
  useUpdateAdminPromotion,
} from './api/useAdminPromotions'
export { uploadPromotionImage } from './api/adminPromotion'
export {
  createEmptyPromotionFormValue,
  formatMonthDay,
  formatPromotionPeriod,
  linkedProductStage,
  linkedProductStageColor,
  linkedProductStageLabel,
  linkedProductStageLabels,
  PROMOTION_DETAIL_IMAGES_MAX,
  PROMOTION_NAME_MAX,
  PROMOTION_PRODUCTS_MAX,
  promotionDue,
  promotionFormProblem,
  promotionProductProblem,
  promotionStatusColor,
  promotionStatusLabel,
  promotionStatusLabels,
  toPromotionFormValue,
} from './model/types'
export type {
  AdminPromotion,
  AdminPromotionFormValue,
  LinkedProductStage,
  PromotionLinkableProduct,
  PromotionStatus,
} from './model/types'
