import type { ProductImageBundle, StockOverviewItem } from '@shared/api/types'
import type { DateRange, UploadedImage } from '@shared/ui'

import {
  axisValueName,
  brandNameOf,
  COLOR_GROUP_CODE,
  DETAIL_SECTIONS,
  type AdminProductDetailModel,
} from './types'

/* ------------------------------------------------------------------ *
 * 폼이 편집하는 모양 — 서버 DTO와 형태가 달라서 별도로 둔다.
 * (색상/옵션을 편집 중에는 코드가 없고, 조합 수량은 맵으로 들고 있다)
 * ------------------------------------------------------------------ */

export type ProductColorOption = {
  id: string
  /** 색상 이름. '색상 없음'을 체크하면 빈 문자열로 둔다 */
  name: string
  /** 조합 표에 찍히는 스와치 색 */
  hex: string
  noColor: boolean
  images: UploadedImage[]
}

export type ProductOptionValue = {
  id: string
  label: string
  /** 기본 가격에 더해지는 금액 */
  extraPrice: number
}

export type ProductOptionGroup = {
  id: string
  /** 옵션 이름 (예: '용량') */
  name: string
  values: ProductOptionValue[]
}

export type AdminProductFormValue = {
  name: string
  /** 서버의 productId로 저장되는 모델 코드 */
  modelName: string
  /** PRODUCT_BRANDS 중 하나. 아직 고르지 않았으면 빈 문자열 */
  brand: string
  isPreorder: boolean
  /**
   * 일반 상품을 등록하자마자 공개할지. 끄면 숨김으로 등록돼 상세에서 확인한 뒤 공개한다.
   * 사전예약은 보지 않는다 — 늘 공개로 보내고 서버가 접수 기간에만 보여준다.
   */
  publishOnCreate: boolean
  /**
   * 검색용 태그. 구매자 화면에는 나오지 않고 검색어로만 쓰인다.
   * 후보(TAG_PRESETS)에서 골라도 되고 직접 적어도 되므로 자유 문자열이다.
   */
  tags: string[]
  /** datetime-local 형식 문자열 */
  openAt: string
  closeAt: string
  /**
   * 고른 제품 종류의 카테고리 id. 등록에 필수다 — 종류를 고르면 카테고리 트리에서
   * 찾아 채운다. 수정 화면에선 서버 값이고 바꿀 수 없다.
   */
  categoryId: string
  /**
   * 1차 배송 예정 기간('YYYY-MM-DD'). 사전예약 등록에 필수다 — 서버가 차수마다 시작·
   * 종료일을 둘 다 받는다(registration.ts).
   */
  firstDelivery: DateRange
  colors: ProductColorOption[]
  optionGroups: ProductOptionGroup[]
  basePrice: number
  /**
   * 조합별 수량. 키는 `색상|옵션값|옵션값` 형태다.
   * 조합 행 자체는 colors × optionGroups에서 매번 파생시키고 수량만 여기 남겨서,
   * 색상이나 옵션을 추가·삭제해도 살아남은 조합의 입력값이 유지되게 한다.
   */
  quantities: Record<string, number>
  /**
   * 판매 스위치를 끈 조합의 키(quantities와 같은 키).
   * - 등록: 만들지 않는다(서버 excluded)
   * - 수정: 이미 있는 조합은 판매 중지, 서버에 없는 조합(등록 때 뺀 것·새 값의 조합)은
   *   만들지 않는다. 서버에 옵션을 지우는 API가 없어서 그만 팔 조합은 판매 중지로 둔다.
   */
  pausedKeys: string[]
  /**
   * '색상 없음' 상품의 상품 사진. 색상 축이 없으면 갤러리는 색상 없는 묶음 하나라
   * 색상 칸(colors[].images)에 둘 수 없다. 색상이 있는 상품에서는 보내지 않는다.
   */
  noColorImages: UploadedImage[]
  detailImages: UploadedImage[]
  specImages: UploadedImage[]
  noticeImages: UploadedImage[]
}

export function createColorOption(): ProductColorOption {
  // hex가 빈 값이면 아직 색을 고르지 않은 상태다.
  return {
    id: crypto.randomUUID(),
    name: '',
    hex: '',
    noColor: false,
    images: [],
  }
}

export function createOptionValue(): ProductOptionValue {
  return { id: crypto.randomUUID(), label: '', extraPrice: 0 }
}

export function createOptionGroup(): ProductOptionGroup {
  return { id: crypto.randomUUID(), name: '', values: [createOptionValue()] }
}

/** 새 상품 등록 폼의 초기값 */
export function createEmptyProductFormValue(): AdminProductFormValue {
  return {
    name: '',
    modelName: '',
    brand: '',
    tags: [],
    isPreorder: false,
    // 기본은 숨김 — 옵션·가격을 확인하기 전에 구매자에게 보이지 않게.
    publishOnCreate: false,
    openAt: '',
    closeAt: '',
    categoryId: '',
    firstDelivery: { start: '', end: '' },
    // 색상은 최소 한 칸을 미리 열어둔다 (아직 아무것도 선택되지 않은 상태).
    colors: [createColorOption()],
    optionGroups: [],
    basePrice: 0,
    quantities: {},
    pausedKeys: [],
    noColorImages: [],
    detailImages: [],
    specImages: [],
    noticeImages: [],
  }
}

/* ------------------------------------------------------------------ *
 * 색상 × 옵션값 조합 파생
 * ------------------------------------------------------------------ */

export type ProductVariant = {
  /** quantities 맵의 키 */
  key: string
  colorName: string
  /** 옵션 그룹 순서대로의 선택값 라벨 */
  optionLabels: string[]
  price: number
}

const KEY_SEPARATOR = '|'

export function buildVariantKey(colorName: string, optionLabels: string[]) {
  // 색상도 옵션도 없는 경우 키가 빈 문자열이 되지 않게 한다.
  return [colorName, ...optionLabels].join(KEY_SEPARATOR) || 'default'
}

/** 옵션 그룹들의 값을 곱집합으로 펼친다 */
function combineOptionValues(groups: ProductOptionGroup[]) {
  return groups.reduce<{ labels: string[]; extraPrice: number }[]>(
    (acc, group) =>
      acc.flatMap((combo) =>
        group.values.map((value) => ({
          labels: [...combo.labels, value.label],
          extraPrice: combo.extraPrice + value.extraPrice,
        })),
      ),
    [{ labels: [], extraPrice: 0 }],
  )
}

const filledGroupsOf = (groups: ProductOptionGroup[]) =>
  groups
    .filter((group) =>
      group.values.some((optionValue) => optionValue.label.trim() !== ''),
    )
    .map((group) => ({
      ...group,
      values: group.values.filter(
        (optionValue) => optionValue.label.trim() !== '',
      ),
    }))

/**
 * 색상 × 옵션값 조합을 매번 새로 계산한다.
 * 조합을 상태로 저장하지 않기 때문에 색상이나 옵션을 추가·삭제해도
 * quantities에 남아 있는 수량이 그대로 붙는다.
 */
export function getProductVariants(
  value: Pick<AdminProductFormValue, 'colors' | 'optionGroups' | 'basePrice'>,
): ProductVariant[] {
  const combos = combineOptionValues(filledGroupsOf(value.optionGroups))

  // '색상 없음'을 체크하면 색상은 조합 축에서 빠지고 옵션만 남는다.
  if (value.colors.some((colorOption) => colorOption.noColor)) {
    return combos.map((combo) => ({
      key: buildVariantKey('', combo.labels),
      colorName: '',
      optionLabels: combo.labels,
      price: value.basePrice + combo.extraPrice,
    }))
  }

  const namedColors = value.colors.filter(
    (colorOption) => colorOption.name.trim() !== '',
  )
  if (namedColors.length === 0) return []

  return namedColors.flatMap((colorOption) =>
    combos.map((combo) => ({
      key: buildVariantKey(colorOption.name, combo.labels),
      colorName: colorOption.name,
      optionLabels: combo.labels,
      price: value.basePrice + combo.extraPrice,
    })),
  )
}

/* ------------------------------------------------------------------ *
 * 폼 값 ↔ 서버 DTO
 * ------------------------------------------------------------------ */

// datetime-local('2026-09-20T09:00')을 서버가 쓰는 ISO 문자열로 바꾼다.
export const toIso = (local: string) =>
  local ? new Date(local).toISOString() : undefined

// 반대로 ISO를 datetime-local이 읽는 형식으로 자른다(로컬 시각 기준).
function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const toUploadedImages = (bundle?: ProductImageBundle): UploadedImage[] =>
  (bundle?.items ?? []).map((item) => ({
    id: item.url,
    url: item.url,
    name: item.url.split('/').pop() ?? '',
  }))

/** 상세를 폼이 편집할 수 있는 모양으로 되돌린다 */
export function toFormValue(
  detail: AdminProductDetailModel,
  stockItems: StockOverviewItem[] = [],
): AdminProductFormValue {
  const colorAxis = detail.optionAxes.find(
    (axis) => axis.key === COLOR_GROUP_CODE,
  )
  const otherAxes = detail.optionAxes.filter(
    (axis) => axis.key !== COLOR_GROUP_CODE,
  )
  const detailBundle = (section: string) =>
    detail.images.detail.find((bundle) => bundle.bundleKey === section)
  // 색상 축이 없는 상품의 갤러리는 색상 없는 묶음('') 하나다.
  const noColorBundle = colorAxis
    ? undefined
    : detail.images.gallery.find((bundle) => bundle.bundleKey === '')
  // 조합은 축마다 정규화값을 들고 있다 — 폼의 키는 화면 이름으로 만든다.
  const variantKeyOf = (variant: AdminProductDetailModel['variants'][number]) =>
    buildVariantKey(
      axisValueName(colorAxis, variant.selections[COLOR_GROUP_CODE]) ?? '',
      otherAxes.map(
        (axis) => axisValueName(axis, variant.selections[axis.key]) ?? '',
      ),
    )

  const value: AdminProductFormValue = {
    ...createEmptyProductFormValue(),
    name: detail.name,
    modelName: detail.modelName,
    brand: brandNameOf(detail.brand),
    categoryId: detail.categoryId,
    tags: detail.tags,
    isPreorder: detail.saleMode === 'PREORDER',
    openAt: toLocalInput(detail.campaign?.opensAt ?? null),
    closeAt: toLocalInput(detail.campaign?.closesAt ?? null),
    colors: colorAxis
      ? colorAxis.values.map((value) => ({
          id: value.valueId,
          name: value.value,
          hex: value.hex ?? '',
          noColor: false,
          // 갤러리는 색상 정규화값으로 묶여 온다.
          images: toUploadedImages(
            detail.images.gallery.find(
              (bundle) => bundle.bundleKey === value.normalizedValue,
            ),
          ),
        }))
      : // 색상 축이 없는 상품(키보드 등)은 '색상 없음'으로 둔다 — 빈 색상 칸을 두면
        // 조합이 하나도 안 만들어져 수량 표가 비어 보인다.
        [{ ...createColorOption(), noColor: true }],
    optionGroups: otherAxes.map((axis) => ({
      id: axis.key,
      name: axis.label,
      values: axis.values.map((value) => ({
        id: value.valueId,
        label: value.value,
        // 서버가 값마다 추가금을 준다 — 예전처럼 조합 가격에서 거꾸로 계산하지 않는다.
        extraPrice: value.surcharge,
      })),
    })),
    basePrice: detail.basePrice,
    pausedKeys: detail.variants
      .filter((variant) => variant.status === 'PAUSED')
      .map((variant) => variantKeyOf(variant)),
    // 재고는 옵션 id(= variantId)로 온다. 폼의 수량 키(색상|옵션값)로 옮긴다.
    quantities: Object.fromEntries(
      detail.variants.flatMap((variant) => {
        const stock = stockItems.find(
          (item) => item.optionId === variant.variantId,
        )
        return stock ? [[variantKeyOf(variant), stock.stockTotal]] : []
      }),
    ),
    noColorImages: toUploadedImages(noColorBundle),
    detailImages: toUploadedImages(detailBundle(DETAIL_SECTIONS.detailImages)),
    specImages: toUploadedImages(detailBundle(DETAIL_SECTIONS.specImages)),
    noticeImages: toUploadedImages(detailBundle(DETAIL_SECTIONS.noticeImages)),
  }

  // 축의 곱집합 중 서버에 없는 조합은 등록 때 뺀 것이다 — 스위치를 꺼서 보여준다.
  // 켜 두면 판매 중인 것처럼 읽히는데 실제로는 없다.
  const existing = new Set(detail.variants.map(variantKeyOf))
  const missing = getProductVariants(value)
    .map((variant) => variant.key)
    .filter((key) => !existing.has(key))
  return { ...value, pausedKeys: [...value.pausedKeys, ...missing] }
}
