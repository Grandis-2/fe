// 밖에서는 TanStack Query 훅으로만 들어온다 — 생 API 함수(getAdminProducts 등)를
// 내보내면 signal 취소·재시도 정책을 건너뛰는 길이 열린다. 폼 값을 DTO로 바꾸는
// 매퍼(toUpsertRequest 등)도 훅 안에서만 쓴다 — 화면이 DTO를 직접 만들면 안 된다.
export {
  useAdminProduct,
  useAdminProductStock,
  useCreateAdminProduct,
  useHideAdminProduct,
  usePublishAdminProduct,
  useUpdateAdminProduct,
} from './api/useAdminProduct'
export { useAdminProducts } from './api/useAdminProducts'
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
  HIDE_REASON_MAX_LENGTH,
  HIDE_REASON_MIN_LENGTH,
  isPreorder,
  productTypeLabel,
  productTypeLabels,
  saleStatusColor,
  saleStatusLabel,
  saleStatusLabels,
} from './model/types'
export type {
  AdminDisplayStatus,
  AdminProduct,
  AdminProductDetailModel,
  AdminSaleStatus,
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
export { getAdminProductStocks } from './model/stock'
export type { AdminProductStock } from './model/stock'
