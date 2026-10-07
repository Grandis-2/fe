import type {
  AdminProductDetail,
  AdminProductUpsertRequest,
  AdminStockItem,
  AdminStockPutRequest,
  ProductOptionGroup as DtoOptionGroup,
  ProductVariant as DtoVariant,
} from '@shared/api/types'
import type { UploadedImage } from '@shared/ui'

import { COLOR_GROUP_CODE } from './types'

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
  /** datetime-local 형식 문자열 */
  openAt: string
  closeAt: string
  colors: ProductColorOption[]
  optionGroups: ProductOptionGroup[]
  basePrice: number
  /**
   * 조합별 수량. 키는 `색상|옵션값|옵션값` 형태다.
   * 조합 행 자체는 colors × optionGroups에서 매번 파생시키고 수량만 여기 남겨서,
   * 색상이나 옵션을 추가·삭제해도 살아남은 조합의 입력값이 유지되게 한다.
   */
  quantities: Record<string, number>
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

export function createEmptyProductFormValue(): AdminProductFormValue {
  return {
    name: '',
    modelName: '',
    brand: '',
    isPreorder: false,
    openAt: '',
    closeAt: '',
    // 색상은 최소 한 칸을 미리 열어둔다 (아직 아무것도 선택되지 않은 상태).
    colors: [createColorOption()],
    optionGroups: [],
    basePrice: 0,
    quantities: {},
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
const toIso = (local: string) =>
  local ? new Date(local).toISOString() : undefined

// 반대로 ISO를 datetime-local이 읽는 형식으로 자른다(로컬 시각 기준).
function toLocalInput(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const colorCodeOf = (index: number) => `C${index + 1}`
const optionGroupCodeOf = (index: number) => `opt${index + 1}`
const optionValueCodeOf = (groupIndex: number, valueIndex: number) =>
  `${optionGroupCodeOf(groupIndex)}-${valueIndex + 1}`

type Combination = {
  codes: Record<string, string>
  labels: string[]
  extraPrice: number
}

/** 옵션 그룹을 곱집합으로 펼치되 서버가 쓰는 코드까지 같이 만든다 */
function buildCombinations(groups: ProductOptionGroup[]): Combination[] {
  return groups.reduce<Combination[]>(
    (acc, group, groupIndex) =>
      acc.flatMap((combo) =>
        group.values.map((optionValue, valueIndex) => ({
          codes: {
            ...combo.codes,
            [optionGroupCodeOf(groupIndex)]: optionValueCodeOf(
              groupIndex,
              valueIndex,
            ),
          },
          labels: [...combo.labels, optionValue.label],
          extraPrice: combo.extraPrice + optionValue.extraPrice,
        })),
      ),
    [{ codes: {}, labels: [], extraPrice: 0 }],
  )
}

/**
 * 상세 응답의 variant마다 폼의 수량 맵 키를 계산해 optionCode와 짝지어 둔다.
 * 폼은 서버 옵션 코드를 들고 있지 않아서, 재고를 저장할 때 이 표로 되돌린다.
 */
export function buildOptionCodeByQuantityKey(
  detail: AdminProductDetail,
): Record<string, string> {
  const colorGroup = detail.optionGroups.find(
    (group) => group.groupCode === COLOR_GROUP_CODE,
  )
  const otherGroups = detail.optionGroups.filter(
    (group) => group.groupCode !== COLOR_GROUP_CODE,
  )

  return Object.fromEntries(
    detail.variants.map((variant) => {
      const colorName =
        colorGroup?.values.find(
          (value) => value.valueCode === variant.optionValues.color,
        )?.name ?? ''
      const labels = otherGroups.map(
        (group) =>
          group.values.find(
            (value) =>
              value.valueCode === variant.optionValues[group.groupCode],
          )?.name ?? '',
      )

      return [buildVariantKey(colorName, labels), variant.optionCode]
    }),
  )
}

/**
 * 폼의 조합별 수량을 재고 API 요청들로 바꾼다.
 * 상품 등록/수정 본문(ProductUpsert)에는 수량 필드가 없어서 재고는 따로 보낸다.
 * 서버가 아직 옵션 코드를 발급하지 않은 조합(새로 추가한 옵션)은 건너뛴다.
 */
export function toStockRequests(
  value: AdminProductFormValue,
  detail: AdminProductDetail,
): AdminStockPutRequest[] {
  const optionCodeByKey = buildOptionCodeByQuantityKey(detail)

  return Object.entries(value.quantities).flatMap(
    ([quantityKey, initialQuantity]) => {
      const optionCode = optionCodeByKey[quantityKey]
      return optionCode ? [{ optionCode, initialQuantity }] : []
    },
  )
}

/**
 * 폼 값을 등록/수정 요청 본문으로 바꾼다.
 *
 * ponytail: 조합별 수량(quantities)과 업로드 이미지는 스펙에 대응 필드가 없다.
 * 수량은 variants에 필드가 없고, 이미지는 업로드 엔드포인트가 정해지면 URL로 교체한다.
 */
export function toUpsertRequest(
  value: AdminProductFormValue,
): AdminProductUpsertRequest {
  const namedColors = value.colors.filter(
    (colorOption) => !colorOption.noColor && colorOption.name.trim() !== '',
  )
  const groups = filledGroupsOf(value.optionGroups)

  const optionGroups: DtoOptionGroup[] = [
    ...(namedColors.length > 0
      ? [
          {
            groupCode: COLOR_GROUP_CODE,
            name: '색상',
            sortOrder: 0,
            values: namedColors.map((colorOption, index) => ({
              valueCode: colorCodeOf(index),
              name: colorOption.name,
              colorHex: colorOption.hex || null,
              imageUrl: colorOption.images[0]?.url ?? null,
              sortOrder: index,
            })),
          },
        ]
      : []),
    ...groups.map((group, groupIndex) => ({
      groupCode: optionGroupCodeOf(groupIndex),
      name: group.name,
      sortOrder: groupIndex + 1,
      values: group.values.map((optionValue, valueIndex) => ({
        valueCode: optionValueCodeOf(groupIndex, valueIndex),
        name: optionValue.label,
        colorHex: null,
        imageUrl: null,
        sortOrder: valueIndex,
      })),
    })),
  ]

  // 조합을 코드까지 붙여 다시 펼친다 — 라벨만 있는 getProductVariants와 달리
  // 서버는 optionValues를 코드로 받는다.
  const combos = buildCombinations(groups)

  const colorAxis =
    namedColors.length > 0
      ? namedColors.map((colorOption, index) => ({
          code: colorCodeOf(index),
          name: colorOption.name,
        }))
      : [null]

  const variants: DtoVariant[] = colorAxis.flatMap((colorEntry, colorIndex) =>
    combos.map((combo, comboIndex) => ({
      optionCode: [colorEntry?.code, ...Object.values(combo.codes)]
        .filter(Boolean)
        .join('-'),
      name: [colorEntry?.name, ...combo.labels].filter(Boolean).join(' '),
      optionValues: colorEntry
        ? { [COLOR_GROUP_CODE]: colorEntry.code, ...combo.codes }
        : combo.codes,
      price: value.basePrice + combo.extraPrice,
      listPrice: null,
      available: true,
      sortOrder: colorIndex * combos.length + comboIndex,
      images: [],
    })),
  )

  return {
    productId: value.modelName || null,
    name: value.name,
    // 안 골랐으면 키를 아예 빼서 수정 때 기존 브랜드를 빈 값으로 덮지 않는다.
    brand: value.brand || undefined,
    optionGroups,
    variants,
    images: value.detailImages.map((image, index) => ({
      imageUrl: image.url,
      alt: image.name,
      sortOrder: index,
      optionValueCode: null,
    })),
    openAt: toIso(value.openAt),
    closeAt: toIso(value.closeAt) ?? null,
    badges: value.isPreorder ? ['PREORDER'] : [],
  }
}

/** 상세 응답을 폼이 편집할 수 있는 모양으로 되돌린다 */
/**
 * 옵션 값 하나의 추가금을 variant 가격에서 되돌린다.
 *
 * 서버 variant에는 추가금 필드가 없고 최종 가격만 있다. toUpsertRequest가
 * `가격 = 기본가 + 고른 값들의 추가금 합`으로 만들므로 그 역이 성립한다 —
 * 이 값을 가진 variant 중 가장 싼 것에서 기본가(최저가)를 빼면 된다.
 *
 * 되돌리지 않으면 수정 탭에서 아무것도 안 바꾸고 저장만 해도 모든 variant가
 * 최저가로 덮어써진다.
 */
function extraPriceOf(
  detail: AdminProductDetail,
  groupCode: string,
  valueCode: string,
) {
  const prices = detail.variants
    .filter((variant) => variant.optionValues[groupCode] === valueCode)
    .map((variant) => variant.price)

  if (prices.length === 0) return 0
  return Math.min(...prices) - detail.priceRange.min
}

export function toFormValue(
  detail: AdminProductDetail,
  stockItems: AdminStockItem[] = [],
): AdminProductFormValue {
  const colorGroup = detail.optionGroups.find(
    (group) => group.groupCode === COLOR_GROUP_CODE,
  )
  const otherGroups = detail.optionGroups.filter(
    (group) => group.groupCode !== COLOR_GROUP_CODE,
  )

  return {
    ...createEmptyProductFormValue(),
    name: detail.name,
    modelName: detail.productId,
    brand: detail.brand,
    isPreorder: detail.badges.includes('PREORDER'),
    openAt: toLocalInput(detail.sale.openAt),
    closeAt: toLocalInput(detail.sale.closeAt),
    colors: colorGroup?.values.map((value) => ({
      id: value.valueCode,
      name: value.name,
      hex: value.colorHex ?? '',
      noColor: false,
      images: [],
    })) ?? [createColorOption()],
    optionGroups: otherGroups.map((group) => ({
      id: group.groupCode,
      name: group.name,
      values: group.values.map((value) => ({
        id: value.valueCode,
        label: value.name,
        extraPrice: extraPriceOf(detail, group.groupCode, value.valueCode),
      })),
    })),
    basePrice: detail.priceRange.min,
    // 재고 응답의 optionCode를 폼의 수량 키(색상|옵션값)로 되돌린다.
    quantities: Object.fromEntries(
      Object.entries(buildOptionCodeByQuantityKey(detail)).flatMap(
        ([quantityKey, optionCode]) => {
          const stock = stockItems.find(
            (item) => item.optionCode === optionCode,
          )
          return stock ? [[quantityKey, stock.initialQuantity]] : []
        },
      ),
    ),
  }
}
