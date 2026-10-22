import type {
  ProductDetailView,
  ProductRegistrationRequest,
  RegistrationCombination,
  RegistrationOptionAxis,
} from '@shared/api/types'
import { comparableValue } from '@shared/lib/comparableValue'

import { getProductVariants, toIso, type AdminProductFormValue } from './form'
import {
  imageUploadIssues,
  toPreviewImages,
  toRegistrationImages,
} from './images'
import { brandCodeOf, COLOR_GROUP_CODE, isStorageValue } from './types'
import { validateProductBasics, type FormIssue } from './validation'

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
 * 보낼 수 없는 값을 칸별로 모은다. 서버가 400을 줄 값을 미리 걸러, 관리자가 고칠 칸을
 * 한 번에 알게 한다 — 첫 문제만 알려 주면 고치고 누를 때마다 다음 문제가 나온다.
 * 칸마다 첫 문제만 담는다.
 */
export function validateRegistration(
  value: AdminProductFormValue,
  now = Date.now(),
): FormIssue[] {
  const issues = validateProductBasics(value)
  const add = (field: FormIssue['field'], message: string) => {
    if (!issues.some((issue) => issue.field === field)) {
      issues.push({ field, message })
    }
  }

  if (!value.categoryId) add('category', '제품 카테고리를 골라 주세요.')

  const axes = registrationAxesOf(value)
  if (axes.length > 5) add('options', '옵션 종류는 5개까지입니다.')
  if (new Set(axes.map((axis) => axis.key)).size !== axes.length) {
    add('options', '같은 이름의 옵션이 두 번 있습니다.')
  }
  for (const axis of axes) {
    if (!axis.label) add('options', '옵션 이름을 적어 주세요.')
    if (axis.values.length > 20) {
      add('options', `${axis.label}은(는) 20개까지입니다.`)
    }
    // 서버는 대소문자·공백만 다른 값도 같은 값으로 보고 400을 준다.
    const seen = new Set<string>()
    for (const { value: name } of axis.values) {
      if (name.length > 60) add('options', `${axis.label} 값은 60자까지입니다.`)
      if (seen.has(comparableValue(name))) {
        add('options', `${axis.label}에 같은 값이 두 번 있습니다. ('${name}')`)
      }
      seen.add(comparableValue(name))
      if (axis.key === 'storage' && !isStorageValue(name)) {
        add(
          'options',
          `용량은 숫자와 MB·GB·TB로 적어 주세요(예: 256GB). ('${name}')`,
        )
      }
    }
  }

  const variants = getProductVariants(value)
  if (variants.length === 0) {
    add('options', "색상을 입력하거나 '색상 없음'을 골라 주세요.")
  } else if (variants.length > 500) {
    add('variants', '조합은 500개까지입니다.')
  } else if (
    variants.every((variant) => value.pausedKeys.includes(variant.key))
  ) {
    add('variants', '판매할 조합을 하나 이상 남겨 주세요.')
  }

  for (const issue of imageUploadIssues(value)) add(issue.field, issue.message)

  if (value.isPreorder) {
    const opensAt = toIso(value.openAt)
    const closesAt = toIso(value.closeAt)
    if (!opensAt || !closesAt) {
      add('schedule', '오픈·마감 일시를 정해 주세요.')
    } else if (Date.parse(opensAt) < now + MIN_OPEN_LEAD_MS) {
      add('schedule', '오픈은 지금부터 30분 뒤 이후여야 합니다.')
    } else if (Date.parse(closesAt) <= Date.parse(opensAt)) {
      add('schedule', '마감은 오픈보다 뒤여야 합니다.')
    }
    const { start, end } = value.firstDelivery
    if (!start || !end) {
      add('firstDelivery', '1차 배송 기간을 정해 주세요.')
    } else if (end < start) {
      add('firstDelivery', '1차 배송 종료일은 시작일 이후여야 합니다.')
    }
  }

  return issues
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

  return getProductVariants(value).map((variant) => {
    const selections = {
      ...(hasColor && { [COLOR_GROUP_CODE]: variant.colorName.trim() }),
      ...Object.fromEntries(
        groupKeys.map((key, index) => [
          key,
          variant.optionLabels[index].trim(),
        ]),
      ),
    }
    // 판매를 끈 조합은 만들지 않는다 — 재고도 받지 않는다(빼면 서버가 만든다).
    if (value.pausedKeys.includes(variant.key)) {
      return { selections, excluded: true }
    }
    // 사전예약은 재고를 받지 않는다(0이어도 보내면 400).
    return value.isPreorder
      ? { selections }
      : { selections, stock: value.quantities[variant.key] ?? 0 }
  })
}

/** 폼 값을 등록 본문으로 바꾼다. validateRegistration을 통과한 값이어야 한다 */
export function toRegistrationRequest(
  value: AdminProductFormValue,
): ProductRegistrationRequest {
  const axes = registrationAxesOf(value)
  const tags = value.tags.join(',')
  const images = toRegistrationImages(value)

  const common = {
    categoryId: value.categoryId,
    // validateRegistration을 통과했으면 늘 있다.
    brand: brandCodeOf(value.brand) ?? 'APPLE',
    modelName: value.modelName.trim(),
    title: value.name.trim(),
    // 사전예약은 공개로 보낸다 — 서버가 접수 기간(오픈~마감)에만 구매자에게 보여주므로
    // 오픈 시각에 관리자가 따로 공개하지 않아도 된다. 일반 상품은 등록하면 바로 보이니
    // 관리자가 고른 대로 보낸다(기본 숨김).
    visible: value.isPreorder || value.publishOnCreate,
    basePrice: value.basePrice,
    // 0이면 생략해도 같다 — 서버 기본값이 0이다.
    ...(value.discountRate > 0 && { discountRate: value.discountRate }),
    ...(tags && { tags }),
    ...(value.description.trim() && { description: value.description.trim() }),
    // 팔지 않으면 생략한다 — 서버 기본이 '보증 없음'이다.
    ...(value.warranty.offered && {
      warranty: { offered: true, surcharge: value.warranty.surcharge },
    }),
    ...(axes.length > 0 && { optionAxes: axes }),
    ...(images && { images }),
  }

  if (!value.isPreorder) {
    return {
      ...common,
      saleMode: 'IN_STOCK',
      combinations: toCombinations(value, axes),
    }
  }

  // 사전예약은 뺀 조합이 있을 때만 조합을 싣는다 — 생략하면 서버가 모두 만든다.
  const combinations = toCombinations(value, axes)
  return {
    ...common,
    saleMode: 'PREORDER',
    ...(combinations.some((combo) => combo.excluded) && { combinations }),
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

/**
 * 미리보기에 그릴 상품 — 폼 값만으로 구매자 상세 응답 모양을 만든다. 저장 전 값도, 상품
 * id가 없는 등록 전에도 그대로 보인다. 축·조합은 등록 본문과 같은 규칙으로 펴고, 정규화값은
 * 서버처럼 대소문자·공백을 무시한다. 판매를 끈 조합은 판매 중지로 보인다.
 */
export function toPreviewProduct(
  value: AdminProductFormValue,
): ProductDetailView {
  const axes = registrationAxesOf(value)
  const formVariants = getProductVariants(value)
  const images = toPreviewImages(value)
  // toCombinations는 getProductVariants와 같은 순서로 조합을 낸다.
  const variants = toCombinations(value, axes).map(
    (combo, index): ProductDetailView['variants'][number] => {
      const { key, colorName, optionLabels, price } = formVariants[index]
      return {
        variantId: key,
        sku: key,
        title:
          [colorName, ...optionLabels]
            .map((name) => name.trim())
            .filter(Boolean)
            .join(' / ') || value.name,
        // 서버처럼 정가에 할인율을 걸고 100원 단위로 버린다.
        price: Math.floor((price * (100 - value.discountRate)) / 10000) * 100,
        listPrice: price,
        filterAttributes: {},
        selections: Object.fromEntries(
          Object.entries(combo.selections).map(([axisKey, name]) => [
            axisKey,
            comparableValue(name),
          ]),
        ),
        status: combo.excluded ? 'PAUSED' : 'ACTIVE',
        // 사전예약은 재고 제한이 없다(null).
        availableQuantity: combo.stock ?? null,
      }
    },
  )

  return {
    productId: 'preview',
    saleMode: value.isPreorder ? 'PREORDER' : 'IN_STOCK',
    title: value.name,
    brand: brandCodeOf(value.brand) ?? 'APPLE',
    imageUrl: images.gallery[0]?.items[0]?.url ?? null,
    status: 'ACTIVE',
    sellable: variants.some((variant) => variant.status === 'ACTIVE'),
    soldOut: false,
    modelNumber: value.modelName,
    categoryId: value.categoryId,
    description: value.description.trim() || null,
    visible: true,
    basePrice: value.basePrice,
    discountRate: value.discountRate,
    warranty: value.warranty.offered
      ? value.warranty
      : { offered: false, surcharge: 0 },
    campaign: value.isPreorder
      ? {
          opensAt: toIso(value.openAt) ?? '',
          closesAt: toIso(value.closeAt) ?? '',
          status: 'BEFORE_OPEN',
        }
      : null,
    optionAxes: axes.map((axis) => ({
      key: axis.key,
      label: axis.label,
      values: axis.values.map((axisValue, index) => ({
        valueId: `${axis.key}-${index}`,
        value: axisValue.value,
        normalizedValue: comparableValue(axisValue.value),
        hex: axisValue.hex ?? null,
        surcharge: axisValue.surcharge ?? 0,
      })),
    })),
    variants,
    images,
  }
}
