import { useMutation, useQueryClient } from '@tanstack/react-query'

import { getErrorMessage } from '@shared/api/client'

import {
  editSectionLabel,
  hasOptionChanges,
  planBasic,
  planOptions,
  planSchedule,
  planStock,
  type EditSection,
  type OptionsPlan,
} from '../model/edit'
import { hasImageChanges, planImages, type ImagesPlan } from '../model/images'

import {
  addOptionValue,
  addVariant,
  editAdminProduct,
  editOptionValue,
  editVariant,
  getAdminProduct,
  putPreorderCampaign,
} from './adminProduct'
import { getAdminProductStock, putAdminProductStock } from './adminStock'
import {
  ADMIN_PRODUCTS_KEY,
  adminProductKey,
  adminProductStockKey,
} from './keys'
import { addProductImage, removeProductImage } from './productImages'
import { toAdminProductDetail } from './toAdminProduct'

import type { AdminProductFormValue } from '../model/form'

export type EditFailure = { section: EditSection; message: string }

export type EditSaveResult = {
  /** 보낼 게 하나라도 있었는지 */
  changed: boolean
  /** 저장하지 못한 섹션. 비어 있으면 전부 반영됐다 */
  failures: EditFailure[]
}

/**
 * 옵션 섹션을 보낸다 — 값 수정 → 값 추가 → 조합 추가 → 조합 판매 상태. 조합은 축에
 * 있는 값으로만 만들 수 있어서 순서가 있다. 하나가 실패하면 뒤는 그 값에 기대고 있을
 * 수 있어 여기서 멈춘다 — 다시 저장하면 남은 것만 다시 계산해 보낸다.
 */
async function applyOptions(productId: string, plan: OptionsPlan) {
  for (const { valueId, body } of plan.valueEdits) {
    await editOptionValue(productId, valueId, body)
  }
  for (const body of plan.valueAdds) {
    await addOptionValue(productId, body)
  }
  for (const body of plan.variantAdds) {
    await addVariant(productId, body)
  }
  for (const { variantId, status } of plan.variantStatus) {
    await editVariant(productId, variantId, { status })
  }
}

/**
 * 사진을 한 장씩 빼고 넣는다. 빼기를 먼저 한다 — 묶음 상한(10장)에 걸리지 않게.
 * 한 상품에 동시에 보내면 서버가 충돌(409)로 거절할 수 있어 하나씩 보낸다.
 */
async function applyImages(productId: string, plan: ImagesPlan) {
  for (const url of plan.removes) {
    await removeProductImage(productId, url)
  }
  for (const body of plan.adds) {
    await addProductImage(productId, body)
  }
}

/**
 * 수정 화면의 저장. 버튼은 하나지만 요청은 섹션마다 따로 간다 — 기본 정보, 판매 일정,
 * 옵션, 재고, 사진. 바뀐 섹션만 보내고, 실패한 섹션은 모아서 돌려준다.
 *
 * 무엇이 성공했는지 기억하지 않는다. 비교 기준이 늘 방금 받은 서버 상세라서, 일부만
 * 반영됐어도 다시 저장하면 반영된 건 차이에서 빠지고 실패한 것만 다시 간다.
 *
 * 한 상품에 요청을 동시에 보내면 서버가 충돌(409)로 거절할 수 있어 하나씩 보낸다.
 * 순서는 결과에 영향이 없다 — 기본가와 추가금을 바꾸면 옵션 가격은 서버가 계산한다.
 */
export const useSaveAdminProductEdits = (productId: string) => {
  const queryClient = useQueryClient()

  // 캐시가 오래됐으면 이미 반영된 걸 또 보내게 되므로 저장할 때마다 새로 받는다.
  const fetchDetail = () =>
    queryClient
      .fetchQuery({
        queryKey: adminProductKey(productId),
        queryFn: ({ signal }) => getAdminProduct(productId, signal),
        staleTime: 0,
      })
      .then(toAdminProductDetail)
  const fetchStock = () =>
    queryClient
      .fetchQuery({
        queryKey: adminProductStockKey(productId),
        queryFn: ({ signal }) => getAdminProductStock(productId, signal),
        staleTime: 0,
      })
      .then((response) => response.items)

  return useMutation({
    mutationFn: async (
      value: AdminProductFormValue,
    ): Promise<EditSaveResult> => {
      const server = await fetchDetail()
      const failures: EditFailure[] = []
      let changed = false

      const send = async (
        section: EditSection,
        request: () => Promise<unknown>,
      ) => {
        changed = true
        try {
          await request()
        } catch (caught) {
          failures.push({
            section,
            message: getErrorMessage(
              caught,
              `${editSectionLabel[section]}을(를) 저장하지 못했습니다.`,
            ),
          })
        }
      }
      // 보내기 전에 걸러 낸 문제 — 서버가 400을 줄 값이라 보내지 않는다.
      const refuse = (section: EditSection, message: string) => {
        changed = true
        failures.push({ section, message })
      }

      const basic = planBasic(value, server)
      if (basic) await send('basic', () => editAdminProduct(productId, basic))

      const schedule = planSchedule(value, server)
      if (schedule) {
        if ('error' in schedule) refuse('schedule', schedule.error)
        else {
          await send('schedule', () =>
            putPreorderCampaign(productId, schedule.body),
          )
        }
      }

      const options = planOptions(value, server)
      if (options.error) refuse('options', options.error)
      else if (hasOptionChanges(options)) {
        await send('options', () => applyOptions(productId, options))
      }

      // 재고·사진은 옵션이 새로 만든 조합·색상까지 맞춰야 해서, 옵션을 보낸 뒤 다시 받아
      // 계산한다(새 색상의 사진은 그 색상 값이 서버에 있어야 넣을 수 있다).
      const fresh = await fetchDetail()
      if (server.saleMode === 'IN_STOCK') {
        const stock = planStock(value, fresh, await fetchStock())
        if (stock) {
          await send('stock', () => putAdminProductStock(productId, stock))
        }
      }

      // 사진은 사전예약 수정 잠금과 상관없이 고칠 수 있다(서버 규칙).
      const images = planImages(value, fresh)
      if (hasImageChanges(images)) {
        await send('images', () => applyImages(productId, images))
      }

      return { changed, failures }
    },
    // 성공·실패와 상관없이 다시 받는다 — 일부만 반영됐어도 화면이 서버와 맞아야 한다.
    // 목록·상세·재고가 모두 이 접두사 아래라 한 번에 받아진다(keys.ts).
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: ADMIN_PRODUCTS_KEY }),
  })
}
