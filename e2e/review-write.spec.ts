import { expect, loginAs, NOVA_PHONE_1, test } from './fixtures'

import type { Page } from '@playwright/test'

const DELIVERED_ITEM = '70000000-0000-4000-8000-000000000001'

// 주문 목업 DB(fixtures/preorder.ts의 nova-order-mock-db-v3)를 배송 완료된 바로 구매 주문 하나와
// 배송 중 주문 하나로 시작한다 — 목 주문은 관리자 화면에서 단계를 올려야 배송 완료가 된다.
async function seedOrders(page: Page) {
  await page.addInitScript(
    ({ productId, orderItemId }) => {
      if (localStorage.getItem('nova-order-mock-db-v3')) return
      const order = (n: number, status: string, itemId: string) => ({
        orderId: `71000000-0000-4000-8000-00000000000${n}`,
        preorderId: null,
        cartItems: null,
        status,
        source: 'BUY_NOW',
        totalAmount: 1_000_000,
        paymentDueAt: null,
        items: [
          {
            orderItemId: itemId,
            productId,
            optionId: '30000000-0000-4000-8000-000000000201',
            productTitle: `노바폰 ${n}`,
            optionTitle: '실버 / 256GB',
            unitPrice: 1_000_000,
            quantity: 1,
            warrantyQuantity: 0,
            warrantyUnitPrice: 0,
            lineAmount: 1_000_000,
          },
        ],
        shipTo: {
          name: '홍길동',
          phone: '01012345678',
          postalCode: '06236',
          line1: '서울특별시 강남구 테헤란로 152',
          line2: null,
        },
        createdAt: new Date().toISOString(),
        events: [],
      })
      localStorage.setItem(
        'nova-order-mock-db-v3',
        JSON.stringify({
          preorders: [],
          orders: [
            order(1, 'DELIVERED', orderItemId),
            order(2, 'SHIPPED', '70000000-0000-4000-8000-000000000002'),
          ],
          attempts: [],
          cart: [],
        }),
      )
    },
    { productId: NOVA_PHONE_1, orderItemId: DELIVERED_ITEM },
  )
}

test.describe('주문 내역에서 리뷰 쓰기', () => {
  test.beforeEach(async ({ page }) => {
    await seedOrders(page)
    await loginAs(page, '/mypage?state=history')
  })

  test('배송 완료 주문상품에만 리뷰 쓰기가 붙는다', async ({ page }) => {
    const delivered = page.getByRole('article').filter({ hasText: '노바폰 1' })
    const shipping = page.getByRole('article').filter({ hasText: '노바폰 2' })
    await expect(
      delivered.getByRole('button', { name: '리뷰 쓰기' }),
    ).toBeEnabled()
    await expect(shipping.getByRole('button', { name: /리뷰/ })).toHaveCount(0)
  })

  test('리뷰를 등록하면 버튼이 리뷰 수정으로 바뀌고 쓴 내용으로 열린다', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '리뷰 쓰기' }).click()
    const dialog = page.getByRole('dialog', { name: '리뷰 쓰기' })
    await dialog.getByRole('button', { name: '5점' }).click()
    await dialog.getByLabel('리뷰 내용').fill('배송도 빠르고 화면이 선명해요.')
    await dialog.getByRole('button', { name: '리뷰 등록하기' }).click()

    await expect(page.getByText('리뷰가 등록되었어요.')).toBeVisible()
    // 다시 받은 내 리뷰에서 이 주문상품의 리뷰를 찾아 수정으로 연다.
    await page.getByRole('button', { name: '리뷰 수정' }).click()
    await expect(
      page.getByRole('dialog', { name: '리뷰 수정' }).getByLabel('리뷰 내용'),
    ).toHaveValue('배송도 빠르고 화면이 선명해요.')
  })
})
