import type {
  OptionAxis,
  OptionValueAddRequest,
  OptionValueEditRequest,
  PreorderCampaignRequest,
  ProductEditRequest,
  ProductSaleStatus,
  StockOverviewItem,
  StockRequest,
  VariantAddRequest,
} from '@shared/api/types'

import { buildVariantKey, toIso, type AdminProductFormValue } from './form'
import { COLOR_GROUP_CODE, type AdminProductDetailModel } from './types'

/**
 * 수정 화면의 저장 계획.
 *
 * 수정 API가 하나가 아니다 — 상품(PATCH), 일정(PUT campaign), 옵션 값·조합(각자),
 * 재고(PUT stock)가 따로 있다. 그래서 폼 값을 서버 상세와 비교해 바뀐 것만 섹션별로
 * 요청으로 나눈다. 여기는 무엇을 보낼지만 정하고, 보내는 건 api의 훅이 한다.
 *
 * 비교 기준은 늘 "방금 받은 서버 상세"다. 저장이 일부 실패해도 성공한 건 서버에
 * 반영돼 다음 비교에서 빠지므로, 다시 저장하면 실패한 것만 간다 — 무엇이 성공했는지
 * 따로 적어 두지 않는다.
 */

/** 저장을 나누는 단위. 실패도 이 단위로 알린다 */
export type EditSection = 'basic' | 'schedule' | 'options' | 'stock'

export const editSectionLabel: Record<EditSection, string> = {
  basic: '기본 정보',
  schedule: '판매 일정',
  options: '옵션',
  stock: '재고',
}

// 서버 정규화값과 같은 규칙 — 공백만 뗀다(256 GB → 256GB).
const normalize = (value: string) => value.replace(/\s+/g, '')

/* ------------------------------------------------------------------ *
 * 잠금
 * ------------------------------------------------------------------ */

const LOCK_LEAD_MS = 3 * 60 * 1000

/**
 * 수정할 수 없는 이유. 수정할 수 있으면 null.
 *
 * 사전예약은 회차 오픈 3분 전부터 공개 여부 말고는 고칠 수 없다(서버 409). 오픈 뒤와
 * 회차가 취소된 상품도 같다. 회차가 만들어지기 전에는 잠기지 않고, 일반 상품은 잠금이
 * 없다.
 */
export function editLockReason(
  product: Pick<AdminProductDetailModel, 'saleMode' | 'campaign'>,
  now = Date.now(),
): string | null {
  const { campaign } = product
  if (product.saleMode !== 'PREORDER' || !campaign) return null

  const locked =
    campaign.status !== 'BEFORE_OPEN' ||
    now >= Date.parse(campaign.opensAt) - LOCK_LEAD_MS
  return locked
    ? '사전예약은 오픈 3분 전부터 공개 여부 말고는 바꿀 수 없습니다.'
    : null
}

/* ------------------------------------------------------------------ *
 * 기본 정보 — PATCH /admin/products/{id}
 * ------------------------------------------------------------------ */

/**
 * 바뀐 필드만 담는다 — 서버는 보낸 필드만 바꾸고, 하나도 없으면 400이다.
 * 태그를 다 지웠으면 빈 문자열을 보낸다(서버가 빈 문자열을 비우라는 뜻으로 받는다).
 */
export function planBasic(
  value: AdminProductFormValue,
  server: AdminProductDetailModel,
): ProductEditRequest | null {
  const body: ProductEditRequest = {}
  const title = value.name.trim()
  if (title !== server.name) body.title = title
  const tags = value.tags.join(',')
  if (tags !== server.tags.join(',')) body.tags = tags
  if (value.basePrice !== server.basePrice) body.basePrice = value.basePrice
  return Object.keys(body).length > 0 ? body : null
}

/* ------------------------------------------------------------------ *
 * 일정 — PUT /admin/preorders/products/{id}/campaign
 * ------------------------------------------------------------------ */

export type SchedulePlan = { body: PreorderCampaignRequest } | { error: string }

const MIN_OPEN_LEAD_MS = 10 * 60 * 1000

// 분 단위로 비교한다 — 폼(datetime-local)은 분까지만 들고 있어서, 초가 붙은 서버 시각과
// 그대로 비교하면 손대지 않아도 바뀐 것으로 보인다.
const minuteOf = (iso: string) => Math.floor(Date.parse(iso) / 60_000)

/**
 * 일정이 바뀌었으면 보낼 본문을, 보낼 수 없는 값이면 그 이유를 돌려준다. 서버가 400을
 * 줄 값을 미리 걸러 낸다 — 마감은 오픈보다 뒤, 오픈은 지금부터 10분 뒤 이후.
 */
export function planSchedule(
  value: AdminProductFormValue,
  server: AdminProductDetailModel,
  now = Date.now(),
): SchedulePlan | null {
  if (server.saleMode !== 'PREORDER') return null

  const opensAt = toIso(value.openAt)
  const closesAt = toIso(value.closeAt)
  const current = server.campaign

  const unchanged = current
    ? !!opensAt &&
      !!closesAt &&
      minuteOf(opensAt) === minuteOf(current.opensAt) &&
      minuteOf(closesAt) === minuteOf(current.closesAt)
    : !opensAt && !closesAt
  if (unchanged) return null

  if (!opensAt || !closesAt) {
    return { error: '오픈·마감 일시를 모두 정해 주세요.' }
  }
  if (Date.parse(closesAt) <= Date.parse(opensAt)) {
    return { error: '마감은 오픈보다 뒤여야 합니다.' }
  }
  if (Date.parse(opensAt) < now + MIN_OPEN_LEAD_MS) {
    return { error: '오픈은 지금부터 10분 뒤 이후여야 합니다.' }
  }
  return { body: { opensAt, closesAt } }
}

/* ------------------------------------------------------------------ *
 * 옵션 — 값 수정·추가, 조합 추가, 조합 판매 중지
 * ------------------------------------------------------------------ */

type FormAxisValue = {
  formId: string
  name: string
  /** 색상이 아닌 축만 */
  surcharge?: number
  /** 색상 축만 */
  hex?: string
}

type FormAxis = { key: string; values: FormAxisValue[] }

/**
 * 폼을 서버 축 단위로 편다. 색상은 별도 칸(colors)이라 color 축으로, 나머지는 옵션
 * 그룹을 서버 축 키(그룹 id)로 짝짓는다.
 *
 * 축 순서는 폼의 조합 키(buildVariantKey)와 같게 둔다 — 색상 다음 옵션 그룹 순서.
 * 이름이 빈 값은 아직 안 쓴 자리라 뺀다(getProductVariants와 같은 규칙).
 */
function formAxesOf(
  value: AdminProductFormValue,
  server: AdminProductDetailModel,
): FormAxis[] {
  const hasColorAxis = server.optionAxes.some(
    (axis) => axis.key === COLOR_GROUP_CODE,
  )
  const colorAxis: FormAxis[] = hasColorAxis
    ? [
        {
          key: COLOR_GROUP_CODE,
          values: value.colors
            .filter((color) => !color.noColor && color.name.trim() !== '')
            .map((color) => ({
              formId: color.id,
              name: color.name.trim(),
              hex: color.hex,
            })),
        },
      ]
    : []

  const groupAxes = value.optionGroups
    .map((group) => ({
      key: group.id,
      values: group.values
        .filter((optionValue) => optionValue.label.trim() !== '')
        .map((optionValue) => ({
          formId: optionValue.id,
          name: optionValue.label.trim(),
          surcharge: optionValue.extraPrice,
        })),
    }))
    .filter((axis) => axis.values.length > 0)

  return [...colorAxis, ...groupAxes]
}

/**
 * 폼의 값마다 서버 값 id를 찾는다. 먼저 id로(원래 있던 값), 없으면 정규화한 이름으로
 * 찾는다 — 지난 저장에서 값 추가까지는 됐는데 뒤가 실패했다면 서버엔 이미 그 이름이
 * 있다. 이름으로 찾지 않으면 다시 저장할 때 같은 값을 또 추가하려다 중복 400이 난다.
 * id로 이미 짝지어진 서버 값은 이름 찾기에서 뺀다.
 */
function resolveValueIds(axis: FormAxis, serverAxis: OptionAxis | undefined) {
  const resolved = new Map<string, string>()
  if (!serverAxis) return resolved

  for (const formValue of axis.values) {
    const hit = serverAxis.values.find(
      (serverValue) => serverValue.valueId === formValue.formId,
    )
    if (hit) resolved.set(formValue.formId, hit.valueId)
  }
  const claimed = new Set(resolved.values())
  for (const formValue of axis.values) {
    if (resolved.has(formValue.formId)) continue
    const hit = serverAxis.values.find(
      (serverValue) =>
        !claimed.has(serverValue.valueId) &&
        serverValue.normalizedValue === normalize(formValue.name),
    )
    if (hit) {
      resolved.set(formValue.formId, hit.valueId)
      claimed.add(hit.valueId)
    }
  }
  return resolved
}

type Combination = {
  /** 폼의 조합 키(quantities·pausedKeys와 같은 키) */
  key: string
  /** 축마다 서버 값 id. 아직 서버에 없는 값은 'new:<이름>' */
  identity: string
  /** 이번 수정에서 새로 더한 값이 들어 있는지 */
  hasAddedValue: boolean
  selections: Record<string, string>
}

const IDENTITY_SEPARATOR = '\u0000'

/** 축 값의 곱집합. 축이 없으면 조합이 하나다(상품 자체) */
function combinationsOf(
  axes: FormAxis[],
  resolvedByAxis: Map<string, Map<string, string>>,
  addedIds: Set<string>,
): Combination[] {
  const picks = axes.reduce<FormAxisValue[][]>(
    (acc, axis) =>
      acc.flatMap((combo) => axis.values.map((value) => [...combo, value])),
    [[]],
  )

  return picks.map((combo) => {
    const colorPick = axes[0]?.key === COLOR_GROUP_CODE ? combo[0] : undefined
    const groupPicks = colorPick ? combo.slice(1) : combo
    return {
      key: buildVariantKey(
        colorPick?.name ?? '',
        groupPicks.map((pick) => pick.name),
      ),
      identity: combo
        .map(
          (pick, index) =>
            resolvedByAxis.get(axes[index].key)?.get(pick.formId) ??
            `new:${normalize(pick.name)}`,
        )
        .join(IDENTITY_SEPARATOR),
      hasAddedValue: combo.some((pick) => addedIds.has(pick.formId)),
      selections: Object.fromEntries(
        combo.map((pick, index) => [axes[index].key, pick.name]),
      ),
    }
  })
}

/** 서버 조합의 정체 — 축마다 고른 값의 id */
function serverIdentityOf(
  variant: AdminProductDetailModel['variants'][number],
  axes: FormAxis[],
  server: AdminProductDetailModel,
) {
  return axes
    .map(
      (axis) =>
        server.optionAxes
          .find((serverAxis) => serverAxis.key === axis.key)
          ?.values.find(
            (value) => value.normalizedValue === variant.selections[axis.key],
          )?.valueId ?? '?',
    )
    .join(IDENTITY_SEPARATOR)
}

const STORAGE_PATTERN = /^\d+(MB|GB|TB)$/i

export type OptionsPlan = {
  valueEdits: { valueId: string; body: OptionValueEditRequest }[]
  valueAdds: OptionValueAddRequest[]
  /** 새로 만들 조합. 판매 중지로 골라 뒀으면 만든 뒤 바로 중지한다 */
  variantAdds: { body: VariantAddRequest; paused: boolean }[]
  variantStatus: { variantId: string; status: ProductSaleStatus }[]
  /** 보내기 전에 걸러 낸 문제. 있으면 옵션 섹션을 보내지 않는다 */
  error: string | null
}

/**
 * 옵션 섹션의 요청들. 보내는 순서는 값 수정 → 값 추가 → 조합 추가 → 조합 판매 상태다
 * — 조합은 축에 있는 값으로만 만들 수 있어서 값이 먼저다.
 *
 * 조합은 이번에 더한 값이 들어간 것만 만든다. 기존 값끼리의 빠진 조합은 등록 때
 * 일부러 뺀 것이라(excluded) 건드리지 않는다 — 안 그러면 수정 저장마다 생겨난다.
 */
export function planOptions(
  value: AdminProductFormValue,
  server: AdminProductDetailModel,
): OptionsPlan {
  const axes = formAxesOf(value, server)
  const plan: OptionsPlan = {
    valueEdits: [],
    valueAdds: [],
    variantAdds: [],
    variantStatus: [],
    error: null,
  }

  // 등록 뒤에는 축을 새로 만들 수 없다 — 화면이 막지만 여기서도 거른다.
  const unknownAxis = axes.find(
    (axis) =>
      !server.optionAxes.some((serverAxis) => serverAxis.key === axis.key),
  )
  if (unknownAxis) {
    return {
      ...plan,
      error: '등록 뒤에는 옵션 종류를 새로 추가할 수 없습니다.',
    }
  }

  const resolvedByAxis = new Map<string, Map<string, string>>()
  const addedIds = new Set<string>()

  for (const axis of axes) {
    const serverAxis = server.optionAxes.find(
      (candidate) => candidate.key === axis.key,
    )
    const resolved = resolveValueIds(axis, serverAxis)
    resolvedByAxis.set(axis.key, resolved)

    for (const formValue of axis.values) {
      // 원래 있던 값인지 — id가 그대로면 있던 값, 아니면 이번에 더한 값이다(이름으로
      // 서버 값을 찾았더라도 지난 저장에서 추가된 것뿐이다).
      const original = serverAxis?.values.some(
        (serverValue) => serverValue.valueId === formValue.formId,
      )
      if (!original) addedIds.add(formValue.formId)

      if (
        axis.key === 'storage' &&
        !STORAGE_PATTERN.test(normalize(formValue.name))
      ) {
        return {
          ...plan,
          error: `용량은 숫자와 MB·GB·TB로 적어 주세요(예: 256GB). '${formValue.name}'`,
        }
      }

      const serverValue = serverAxis?.values.find(
        (candidate) => candidate.valueId === resolved.get(formValue.formId),
      )
      if (serverValue) {
        const body: OptionValueEditRequest = {}
        if (serverValue.value !== formValue.name) body.value = formValue.name
        if (
          formValue.surcharge !== undefined &&
          formValue.surcharge !== serverValue.surcharge
        ) {
          body.surcharge = formValue.surcharge
        }
        // 서버는 hex를 대문자로 저장한다 — 대소문자만 다른 건 바뀐 게 아니다.
        if (
          axis.key === COLOR_GROUP_CODE &&
          (formValue.hex ?? '').toUpperCase() !==
            (serverValue.hex ?? '').toUpperCase()
        ) {
          body.hex = formValue.hex ?? ''
        }
        if (Object.keys(body).length > 0) {
          plan.valueEdits.push({ valueId: serverValue.valueId, body })
        }
      } else {
        plan.valueAdds.push({
          axisKey: axis.key,
          value: formValue.name,
          ...(formValue.surcharge !== undefined && {
            surcharge: formValue.surcharge,
          }),
          ...(axis.key === COLOR_GROUP_CODE &&
            formValue.hex && { hex: formValue.hex }),
        })
      }
    }
  }

  // 원래 있던 값의 이름을 지웠으면 그 값이 빠진 것처럼 보이는데, 서버엔 값을 지우는
  // API가 없다. 화면이 막지만 여기서도 거른다. 한 축의 값을 전부 지우면 그 축이 폼에서
  // 통째로 빠지므로(formAxesOf) 축이 없어진 경우도 여기서 같이 걸린다.
  for (const serverAxis of server.optionAxes) {
    const kept = new Set(resolvedByAxis.get(serverAxis.key)?.values() ?? [])
    const dropped = serverAxis.values.filter(
      (serverValue) => !kept.has(serverValue.valueId),
    )
    if (dropped.length > 0) {
      return {
        ...plan,
        error: `등록 뒤에는 옵션 값을 지울 수 없습니다. 그만 팔 조합은 판매 중지로 두세요. ('${dropped[0].value}')`,
      }
    }
  }

  const serverByIdentity = new Map(
    server.variants.map((variant) => [
      serverIdentityOf(variant, axes, server),
      variant,
    ]),
  )
  const paused = new Set(value.pausedKeys)

  for (const combination of combinationsOf(axes, resolvedByAxis, addedIds)) {
    const variant = serverByIdentity.get(combination.identity)
    const wantPaused = paused.has(combination.key)

    if (!variant) {
      if (combination.hasAddedValue) {
        plan.variantAdds.push({
          body: { selections: combination.selections },
          paused: wantPaused,
        })
      }
      continue
    }

    const status: ProductSaleStatus = wantPaused ? 'PAUSED' : 'ACTIVE'
    if (variant.status !== status) {
      plan.variantStatus.push({ variantId: variant.variantId, status })
    }
  }

  return plan
}

export const hasOptionChanges = (plan: OptionsPlan) =>
  plan.error !== null ||
  plan.valueEdits.length > 0 ||
  plan.valueAdds.length > 0 ||
  plan.variantAdds.length > 0 ||
  plan.variantStatus.length > 0

/* ------------------------------------------------------------------ *
 * 재고 — PUT /admin/products/{id}/stock (일반 상품만)
 * ------------------------------------------------------------------ */

/**
 * 총량이 바뀐 조합만 담는다. 옵션 섹션이 조합을 새로 만들었을 수 있어서, 반드시
 * 옵션을 보낸 뒤 다시 받은 상세로 계산한다 — 새 조합의 옵션 id는 그때 생긴다.
 * 사전예약은 재고를 세지 않아 보낼 게 없다.
 */
export function planStock(
  value: AdminProductFormValue,
  server: AdminProductDetailModel,
  stockItems: StockOverviewItem[],
): StockRequest | null {
  if (server.saleMode !== 'IN_STOCK') return null

  const axes = formAxesOf(value, server)
  const resolvedByAxis = new Map(
    axes.map((axis) => [
      axis.key,
      resolveValueIds(
        axis,
        server.optionAxes.find((candidate) => candidate.key === axis.key),
      ),
    ]),
  )
  const serverByIdentity = new Map(
    server.variants.map((variant) => [
      serverIdentityOf(variant, axes, server),
      variant,
    ]),
  )

  const items = combinationsOf(axes, resolvedByAxis, new Set()).flatMap(
    (combination) => {
      const variant = serverByIdentity.get(combination.identity)
      if (!variant) return []
      const wanted = value.quantities[combination.key] ?? 0
      const current =
        stockItems.find((item) => item.optionId === variant.variantId)
          ?.stockTotal ?? 0
      return wanted === current
        ? []
        : [{ optionId: variant.variantId, stockTotal: wanted }]
    },
  )

  return items.length > 0 ? { items } : null
}
