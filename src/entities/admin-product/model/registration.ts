import type {
  ProductBrandCode,
  ProductRegistrationRequest,
  RegistrationCombination,
  RegistrationOptionAxis,
} from '@shared/api/types'

import { getProductVariants, toIso, type AdminProductFormValue } from './form'
import { COLOR_GROUP_CODE, comparableValue, isStorageValue } from './types'

/**
 * 상품 등록 본문. 등록은 한 번에 보낸다 — 사전예약은 회차·배송 차수까지, 일반 상품은
 * 조합별 재고까지 같이 실린다.
 */

// 서버가 목록 필터에 쓰는 축 키는 color·storage뿐이다. 용량은 storage로 보내야 필터에
// 걸린다. 나머지 축은 이름이 한글이라 키로 쓸 수 없어 순서로 짓는다(키는 화면에 안 보인다).
const STORAGE_LABEL = '용량'
const axisKeyOf = (label: string, index: number) =>
  label.trim() === STORAGE_LABEL ? 'storage' : `option${index + 1}`

const MIN_OPEN_LEAD_MS = 30 * 60 * 1000

// 폼 드롭다운(PRODUCT_BRANDS)의 이름을 서버 코드로 바꾼다. 없는 이름이면 undefined.
const BRAND_CODE: Partial<Record<string, ProductBrandCode>> = {
  Apple: 'APPLE',
  Samsung: 'SAMSUNG',
  LG: 'LG',
}

/**
 * 폼을 등록 축으로 편다. 조합 표(getProductVariants)와 같은 규칙을 따른다 — '색상
 * 없음'이면 색상 축이 없고, 이름이 빈 값·값이 없는 옵션은 아직 안 쓴 자리라 뺀다.
 */
function registrationAxesOf(
  value: AdminProductFormValue,
): RegistrationOptionAxis[] {
  const colors = value.colors.some((color) => color.noColor)
    ? []
    : value.colors.filter((color) => color.name.trim() !== '')
  const colorAxis: RegistrationOptionAxis[] =
    colors.length > 0
      ? [
          {
            key: COLOR_GROUP_CODE,
            label: '색상',
            values: colors.map((color) => ({
              value: color.name.trim(),
              ...(color.hex && { hex: color.hex }),
            })),
          },
        ]
      : []

  const groupAxes = value.optionGroups
    .map((group) => ({
      ...group,
      values: group.values.filter((optionValue) => optionValue.label.trim()),
    }))
    .filter((group) => group.values.length > 0)
    .map((group, index) => ({
      key: axisKeyOf(group.name, index),
      label: group.name.trim(),
      values: group.values.map((optionValue) => ({
        value: optionValue.label.trim(),
        surcharge: optionValue.extraPrice,
      })),
    }))

  return [...colorAxis, ...groupAxes]
}

/**
 * 보낼 수 없는 값이면 그 이유를 돌려준다. 서버가 400을 줄 값을 미리 걸러, 관리자가
 * 고칠 자리를 바로 알게 한다.
 */
export function validateRegistration(
  value: AdminProductFormValue,
  now = Date.now(),
): string | null {
  if (!value.categoryId) return '제품 카테고리를 골라 주세요.'

  const title = value.name.trim()
  if (!title || title.length > 100) return '상품명은 1~100자로 적어 주세요.'
  if (!value.modelName.trim()) return '모델명을 적어 주세요.'
  if (!BRAND_CODE[value.brand]) return '브랜드를 골라 주세요.'
  if (value.tags.join(',').length > 500)
    return '태그는 모두 합쳐 500자까지입니다.'

  const axes = registrationAxesOf(value)
  if (axes.length > 5) return '옵션 종류는 5개까지입니다.'
  if (new Set(axes.map((axis) => axis.key)).size !== axes.length) {
    return '같은 이름의 옵션이 두 번 있습니다.'
  }
  for (const axis of axes) {
    if (!axis.label) return '옵션 이름을 적어 주세요.'
    if (axis.values.length > 20) return `${axis.label}은(는) 20개까지입니다.`

    // 서버는 대소문자·공백만 다른 값도 같은 값으로 보고 400을 준다.
    const seen = new Set<string>()
    for (const { value: name } of axis.values) {
      if (name.length > 60) return `${axis.label} 값은 60자까지입니다.`
      if (seen.has(comparableValue(name))) {
        return `${axis.label}에 같은 값이 두 번 있습니다. ('${name}')`
      }
      seen.add(comparableValue(name))
      if (axis.key === 'storage' && !isStorageValue(name)) {
        return `용량은 숫자와 MB·GB·TB로 적어 주세요(예: 256GB). ('${name}')`
      }
    }
  }

  const variants = getProductVariants(value)
  if (variants.length === 0) {
    return "색상을 입력하거나 '색상 없음'을 골라 주세요."
  }
  if (variants.length > 500) return '조합은 500개까지입니다.'

  if (value.isPreorder) {
    const opensAt = toIso(value.openAt)
    const closesAt = toIso(value.closeAt)
    if (!opensAt || !closesAt) return '오픈·마감 일시를 정해 주세요.'
    if (Date.parse(opensAt) < now + MIN_OPEN_LEAD_MS) {
      return '오픈은 지금부터 30분 뒤 이후여야 합니다.'
    }
    if (Date.parse(closesAt) <= Date.parse(opensAt)) {
      return '마감은 오픈보다 뒤여야 합니다.'
    }
    const { start, end } = value.firstDelivery
    if (!start || !end) return '1차 배송 기간을 정해 주세요.'
    if (end < start) return '1차 배송 종료일은 시작일 이후여야 합니다.'
  }

  return null
}

/**
 * 일반 상품의 조합별 재고. 제외하지 않은 모든 조합에 재고가 필요해서 조합마다 하나씩
 * 보낸다. selections는 optionAxes에 쓴 값과 같은 글자여야 해서 같은 방식으로 다듬는다.
 */
function toCombinations(
  value: AdminProductFormValue,
  axes: RegistrationOptionAxis[],
): RegistrationCombination[] {
  const hasColor = axes[0]?.key === COLOR_GROUP_CODE
  const groupKeys = axes
    .filter((axis) => axis.key !== COLOR_GROUP_CODE)
    .map((axis) => axis.key)

  return getProductVariants(value).map((variant) => ({
    selections: {
      ...(hasColor && { [COLOR_GROUP_CODE]: variant.colorName.trim() }),
      ...Object.fromEntries(
        groupKeys.map((key, index) => [
          key,
          variant.optionLabels[index].trim(),
        ]),
      ),
    },
    stock: value.quantities[variant.key] ?? 0,
  }))
}

/** 폼 값을 등록 본문으로 바꾼다. validateRegistration을 통과한 값이어야 한다 */
export function toRegistrationRequest(
  value: AdminProductFormValue,
): ProductRegistrationRequest {
  const axes = registrationAxesOf(value)
  const tags = value.tags.join(',')

  const common = {
    categoryId: value.categoryId,
    // validateRegistration을 통과했으면 늘 있다.
    brand: BRAND_CODE[value.brand] ?? 'APPLE',
    modelName: value.modelName.trim(),
    title: value.name.trim(),
    // 사전예약은 공개로 보낸다 — 서버가 접수 기간(오픈~마감)에만 구매자에게 보여주므로
    // 오픈 시각에 관리자가 따로 공개하지 않아도 된다. 일반 상품은 등록하면 바로 보이니
    // 관리자가 고른 대로 보낸다(기본 숨김).
    visible: value.isPreorder || value.publishOnCreate,
    basePrice: value.basePrice,
    ...(tags && { tags }),
    ...(axes.length > 0 && { optionAxes: axes }),
  }

  if (!value.isPreorder) {
    return {
      ...common,
      saleMode: 'IN_STOCK',
      combinations: toCombinations(value, axes),
    }
  }

  return {
    ...common,
    saleMode: 'PREORDER',
    // 사전예약은 재고를 받지 않는다(stock을 보내면 400). 조합은 생략하면 서버가 모두 만든다.
    campaign: {
      opensAt: toIso(value.openAt) ?? '',
      closesAt: toIso(value.closeAt) ?? '',
    },
    // 서버는 마지막 차수의 끝이 열려 있어야 한다(positionTo null). 등록 때는 1차만
    // 보내므로 1차가 모든 순번을 덮는다 — 1차 물량에서 끊으려면 배송 구간 설정에서
    // 2차를 더한다.
    shipmentBatches: [
      {
        batchNumber: 1,
        positionFrom: 1,
        positionTo: null,
        estimatedShipStart: value.firstDelivery.start,
        estimatedShipEnd: value.firstDelivery.end,
      },
    ],
  }
}
