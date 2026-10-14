import type {
  DisplayStatus,
  OptionAxis,
  PreorderSaleStatus,
  ProductDetailView,
  ProductSaleStatus,
  SaleMode,
  StockOverviewItem,
} from '@shared/api/types'

/**
 * 관리자 상세가 화면에 그리는 모양.
 *
 * 응답은 회원 상세(product)에 태그·등록 상태가 따로 붙어 온다. 헤더·수정 폼·재고
 * 탭·배송 탭이 같이 쓰므로 한 모양으로 편다 — 태그는 콤마 문자열을 배열로, 전시는
 * 목록과 같은 규칙으로 한 값으로 모은다.
 */
export type AdminProductDetailModel = Pick<
  ProductDetailView,
  | 'productId'
  | 'saleMode'
  | 'status'
  | 'campaign'
  | 'basePrice'
  | 'optionAxes'
  | 'variants'
  | 'description'
  | 'warranty'
  | 'images'
  | 'categoryId'
> & {
  name: string
  displayStatus: AdminDisplayStatus
  /** 검색 태그. 서버는 콤마로 이은 문자열로 준다 */
  tags: string[]
  /** 준비 완료. false면 공개로 골라 뒀어도 회원에게 보이지 않는다 */
  registrationCompleted: boolean
}

/**
 * 관리자 상품 목록이 화면에 그리는 모양.
 *
 * 판매·전시 상태를 한 값으로 들고 있다 — 응답은 사전예약/일반에 따라 다른 필드를
 * 주고(preorderStatus vs status), 전시는 두 불리언으로 온다. 표의 셀마다 그 분기를
 * 다시 하면 같은 규칙이 여러 곳으로 흩어지므로 매퍼에서 한 번만 정한다.
 */
export type AdminProduct = {
  productId: string
  name: string
  saleMode: SaleMode
  /** 판매 중지를 포함한 전체 옵션 수 */
  optionCount: number
  /** 사전예약 오픈 시각. 일반 상품이거나 회차가 없으면 null */
  opensAt: string | null
  closesAt: string | null
  /** 상품 판매 상태 — 사전예약이든 일반이든 모든 상품에 있다 */
  status: ProductSaleStatus
  /** 사전예약 접수 단계. 일반 상품이거나 회차가 아직 없으면 null */
  preorderStatus: PreorderSaleStatus | null
  displayStatus: AdminDisplayStatus
  /** 판매 중인 옵션의 최저가(원). 없으면 null */
  minPrice: number | null
  thumbnailUrl: string | null
}

// 화면(pages/widgets)은 DTO를 직접 import할 수 없어 여기서 다시 내보낸다.
export type AdminStockItemModel = StockOverviewItem
export type AdminSaleState = ProductSaleStatus
export type AdminPreorderStage = PreorderSaleStatus
/**
 * 화면의 전시 상태. 서버의 공개 여부(visible)에 사전예약 접수 기간을 더한다 — 사전예약은
 * 공개로 둬도 접수 기간(오픈~마감)에만 구매자에게 보인다(백엔드 합의, 2026-10-14).
 * - SCHEDULED(공개 예정): 공개로 뒀고 오픈 전
 * - ENDED(공개 종료): 공개로 뒀고 마감 뒤
 */
export type AdminDisplayStatus = DisplayStatus | 'SCHEDULED' | 'ENDED'

/** 관리자가 공개로 둔 상태인지 — 접수 기간 밖이라 지금 안 보여도 공개 설정은 켜져 있다 */
export const isPublicSetting = (status: AdminDisplayStatus) =>
  status === 'PUBLISHED' || status === 'SCHEDULED' || status === 'ENDED'

/** 상품 판매 상태 — 백엔드의 status를 그대로 쓴다 */
export const saleStateLabel: Record<ProductSaleStatus, string> = {
  ACTIVE: '판매 중',
  PAUSED: '판매 중지',
}

export const saleStateColor: Record<ProductSaleStatus, 'green' | 'gray'> = {
  ACTIVE: 'green',
  PAUSED: 'gray',
}

/**
 * 사전예약 접수 단계 — 판매 상태와 다른 축이다. 판매 중인 상품도 아직 오픈 전일 수
 * 있고, 접수가 마감된 뒤에도 판매 상태는 그대로 ACTIVE다.
 */
export const preorderStageLabel: Record<PreorderSaleStatus, string> = {
  BEFORE_OPEN: '오픈 전',
  OPEN: '접수 중',
  CLOSED: '접수 마감',
}

export const preorderStageColor: Record<
  PreorderSaleStatus,
  'blue' | 'green' | 'gray'
> = {
  BEFORE_OPEN: 'blue',
  OPEN: 'green',
  CLOSED: 'gray',
}

export const displayStatusLabel: Record<AdminDisplayStatus, string> = {
  DRAFT: '초안',
  PUBLISHED: '게시중',
  SCHEDULED: '공개 예정',
  ENDED: '공개 종료',
  HIDDEN: '숨김',
}

/**
 * 전시 상태는 브랜드 색으로 말하고, 노출 여부는 채움으로 가른다.
 * 판매 상태 열(초록·파랑·회색)과 나란히 서는 자리라, 전시까지 의미색을 쓰면
 * 두 열이 한 덩어리로 읽힌다.
 *
 * - 게시중: secondary + subtle(채움) — 지금 구매자에게 보이는 중
 * - 숨김:   secondary + outline(테두리) — 냈다가 내림
 * - 초안:   gray + outline — 아직 한 번도 낸 적 없어 브랜드 색을 줄 자리가 아니다
 * - 공개 예정: primary + outline — 공개로 뒀지만 아직 안 보임(오픈 전)
 * - 공개 종료: gray + subtle — 공개로 뒀지만 접수가 끝나 더는 안 보임
 */
export const displayStatusColor: Record<
  AdminDisplayStatus,
  'gray' | 'secondary' | 'primary'
> = {
  DRAFT: 'gray',
  PUBLISHED: 'secondary',
  SCHEDULED: 'primary',
  ENDED: 'gray',
  HIDDEN: 'secondary',
}

export const displayStatusVariant: Record<
  AdminDisplayStatus,
  'subtle' | 'outline'
> = {
  DRAFT: 'outline',
  PUBLISHED: 'subtle',
  SCHEDULED: 'outline',
  ENDED: 'subtle',
  HIDDEN: 'outline',
}

// 표의 전시 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const displayStatusLabels = Object.values(displayStatusLabel)

/**
 * 서버가 같은 값으로 보는지 비교할 때 쓰는 모양 — 공백을 떼고 대소문자를 무시한다.
 * 서버는 대소문자·전각·악센트만 다른 값도 같은 값으로 보고 400을 준다.
 */
export const comparableValue = (value: string) =>
  value.replace(/\s+/g, '').toLowerCase()

/** storage 축 값은 숫자와 MB·GB·TB 단위만 된다(서버 400). 공백은 무시한다 */
export const isStorageValue = (value: string) =>
  /^\d+(MB|GB|TB)$/i.test(value.replace(/\s+/g, ''))

/**
 * 조합(variant)은 축마다 정규화값(selections)을 들고 있다 — 화면은 관리자가 적은
 * 이름(value)을 보여야 해서 되돌린다. 못 찾으면 undefined라 쓰는 쪽이 빈 칸을 정한다.
 */
export const axisValueName = (
  axis: OptionAxis | undefined,
  normalized?: string,
) => axis?.values.find((value) => value.normalizedValue === normalized)?.value

/**
 * 색상 옵션 그룹의 코드. 나머지 그룹은 폼이 opt1·opt2…로 발급한다(form.ts).
 * 색상만 축이 따로라 이름이 고정이고, 폼과 재고 표가 같이 본다.
 */
export const COLOR_GROUP_CODE = 'color'

/** 사전 예약 상품인지 — 목록·상세가 모두 saleMode로 알려 준다 */
export const isPreorder = (product: { saleMode: SaleMode }) =>
  product.saleMode === 'PREORDER'

/** 표와 뱃지에 찍는 판매 유형 문구 */
export const productTypeLabel = (product: { saleMode: SaleMode }) =>
  isPreorder(product) ? '사전 예약' : '일반 판매'

// 표의 Tag 열 너비를 가장 긴 문구에 맞출 때 쓴다(Tag의 widthOptions).
export const saleStateLabels = Object.values(saleStateLabel)
export const preorderStageLabels = Object.values(preorderStageLabel)
export const productTypeLabels = [
  productTypeLabel({ saleMode: 'PREORDER' }),
  productTypeLabel({ saleMode: 'IN_STOCK' }),
]

/**
 * 등록·수정 폼에서 고를 수 있는 브랜드.
 *
 * 자유 입력으로 두면 안 된다 — 구매자 쪽 브랜드 필터가 이 문자열을 그대로
 * 쿼리(`?brand=Apple`)로 쓰고 정확히 일치할 때만 걸러서, 'samsung'·'삼성'처럼
 * 한 글자만 달라도 그 상품은 필터에서 조용히 사라진다.
 *
 * LG가 들어 있는 건 메가 메뉴의 PC/주변기기 브랜드 묶음이 이미 LG를 내걸고
 * 있어서다. 여기서 빼면 그 타일은 영원히 빈 결과만 돌려준다.
 *
 * ponytail: 브랜드 목록 API가 없어서 상수다. 생기면 응답으로 갈아 끼운다.
 */
export const PRODUCT_BRANDS = ['Samsung', 'Apple', 'LG'] as const
