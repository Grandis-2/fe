// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수(getAdminProducts 등)를
// 내보내면 signal 취소·재시도 정책을 건너뛰는 길이 열린다. 폼 값을 DTO로 바꾸는
// 매퍼(toUpsertRequest 등)도 훅 안에서만 쓴다 — 화면이 DTO를 직접 만들면 안 된다.
export {
  useAdminProduct,
  useAdminProductDetails,
  useAdminProductStock,
  useCreateAdminProduct,
  useSetAdminProductSaleStatus,
  useSetAdminProductVisibility,
} from './api/useAdminProduct'
export { useAdminProducts } from './api/useAdminProducts'
export { useSaveAdminProductEdits } from './api/useSaveAdminProductEdits'
export type {
  EditFailure,
  EditSaveResult,
} from './api/useSaveAdminProductEdits'
export { editLockReason, editSectionLabel } from './model/edit'
export { validateRegistration } from './model/registration'
export { CANCEL_REASON_MAX, saleStatusActionOf } from './model/saleStatus'
export type { SaleStatusAction } from './model/saleStatus'
export type { EditSection } from './model/edit'
export {
  useDispatchWindow,
  useSaveDispatchWindow,
} from './api/useDispatchWindow'
export {
  createWaveDraft,
  formatDeliveryDate,
  formatSeqRange,
  nextFromSeq,
  toDispatchWindowRequest,
  toWaveDrafts,
  toWaves,
  waveDraftProblem,
} from './model/dispatch'
export type { DispatchWaveDraft, DispatchWaveModel } from './model/dispatch'
export {
  isPreorder,
  isPublicSetting,
  MODEL_NAME_MAX,
  PRODUCT_BRANDS,
  productTypeLabel,
  productTypeLabels,
  preorderStageLabel,
  saleStateLabel,
} from './model/types'
export type {
  AdminProduct,
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
export { DeliveryDateField } from './ui/DeliveryDateField'
export type { DeliveryDateFieldProps } from './ui/DeliveryDateField'
export { AdminProductDisplayTag } from './ui/AdminProductDisplayTag'
export type { AdminProductDisplayTagProps } from './ui/AdminProductDisplayTag'
export { AdminProductSaleTag } from './ui/AdminProductSaleTag'
export type { AdminProductSaleTagProps } from './ui/AdminProductSaleTag'
export { OPTION_PRESETS, withPresetOptionGroups } from './model/optionPreset'
export { recommendedTags, TAG_PRESETS } from './model/tagPreset'
export type { ProductOptionPreset } from './model/optionPreset'
export { getAdminProductStocks, getStockOptionGroups } from './model/stock'
export type { AdminProductStock } from './model/stock'
