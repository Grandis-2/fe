// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수(getAdminProducts 등)를
// 내보내면 signal 취소·재시도 정책을 건너뛰는 길이 열린다. 폼 값을 DTO로 바꾸는
// 매퍼(toUpsertRequest 등)도 훅 안에서만 쓴다 — 화면이 DTO를 직접 만들면 안 된다.
export {
  useAdminPreorderCampaign,
  useAdminProduct,
  useAdminProductDetails,
  useAdminProductStock,
  useClosePreorderCampaign,
  useReopenPreorderCampaign,
  useDeleteAdminProduct,
  useConvertAdminProduct,
  RegistrationUnconfirmedError,
  useCreateAdminProduct,
  useSetAdminProductSaleStatus,
  useSetAdminProductVisibility,
} from './api/useAdminProduct'
export {
  useAdminProductCount,
  useAdminProducts,
  useGiftCandidates,
} from './api/useAdminProducts'
// 예외로 생 함수를 내보낸다 — 사진 업로드는 조회가 아니라 파일마다 한 번 보내는
// 일이고, 진행·실패 상태는 업로더(ImageUploader)가 사진 칸마다 들고 있다. 화면은
// 이 함수를 업로더의 upload로 넘기기만 한다(DTO는 밖으로 나가지 않는다).
export { uploadProductImage } from './api/productImages'
export {
  DETAIL_IMAGE_MAX,
  GALLERY_MAX,
  imageUploadIssues,
  PRODUCT_IMAGE_ACCEPT,
} from './model/images'
export { useSaveAdminProductEdits } from './api/useSaveAdminProductEdits'
export type {
  EditFailure,
  EditSaveResult,
} from './api/useSaveAdminProductEdits'
export {
  editLockReason,
  editLocksAt,
  editSectionLabel,
  pendingEditLabels,
} from './model/edit'
export {
  useCorrectStockOption,
  usePreviewStockCorrection,
  useStockDrifts,
} from './api/useStockReconcile'
export { toPreviewProduct, validateRegistration } from './model/registration'
export {
  DISCOUNT_RATE_MAX,
  serverIssuesOf,
  validateProductBasics,
} from './model/validation'
export type { FormField, FormIssue } from './model/validation'
export {
  CANCEL_REASON_MAX,
  canClosePreorderEarly,
  reopenPreorderOf,
  deleteBlockedReason,
  canConvertToInStock,
  saleStatusActionOf,
} from './model/saleStatus'
export type { SaleStatusAction } from './model/saleStatus'
export type { EditSection } from './model/edit'
export {
  useAdminShipmentBatches,
  useSaveAdminShipmentBatches,
} from './api/useShipmentBatches'
export {
  batchDraftProblem,
  createBatchDraft,
  currentBatchOf,
  issuedInBatch,
  formatPositionRange,
  formatShipPeriod,
  toBatchDrafts,
  toBatches,
  toShipmentBatchesRequest,
} from './model/shipment'
export type { AdminShipmentBatch, ShipmentBatchDraft } from './model/shipment'
export {
  brandFilterOptions,
  brandNameOf,
  displayStatusLabel,
  isPreorder,
  isPublicSetting,
  DESCRIPTION_MAX,
  MODEL_NAME_MAX,
  PRODUCT_BRANDS,
  productTypeLabel,
  productTypeLabels,
  preorderStageLabel,
  saleStateLabel,
} from './model/types'
export type {
  AdminDisplayStatus,
  AdminProduct,
  AdminGiftCandidate,
  AdminProductDetailModel,
  AdminPreorderStage,
  AdminSaleState,
} from './model/types'
export {
  createColorOption,
  createEmptyProductFormValue,
  createOptionGroup,
  createOptionValue,
  getProductVariants,
  toFormValue,
} from './model/form'
export type {
  AdminProductFormValue,
  ProductColorOption,
  ProductOptionGroup,
  ProductOptionValue,
  ProductVariant,
} from './model/form'
export { AdminProductDisplayTag } from './ui/AdminProductDisplayTag'
export type { AdminProductDisplayTagProps } from './ui/AdminProductDisplayTag'
export { AdminProductSaleTag } from './ui/AdminProductSaleTag'
export type { AdminProductSaleTagProps } from './ui/AdminProductSaleTag'
export { OPTION_PRESETS, withPresetOptionGroups } from './model/optionPreset'
export { recommendedTags, TAG_PRESETS } from './model/tagPreset'
export type { ProductOptionPreset } from './model/optionPreset'
export {
  getAdminProductStocks,
  getStockOptionGroups,
  sortStocksByUrgency,
  stockLevelLabel,
  stockLevelOf,
  sumStocks,
} from './model/stock'
export type {
  AdminProductStock,
  AdminStockDrift,
  StockLevel,
} from './model/stock'
