import { expect, loginAs, MACBOOK_PRO_14, productId, test } from './fixtures'

import type { Page } from '@playwright/test'

// 목 홍보 1(handlers/promotion.ts) — 맥북 프로 14와 NOVA 폴더블 1이 묶인 '오늘 오픈' 사전예약.
// 폴더블 1은 이미 예약해 둔 상태로 시드돼 있다(fixtures/preorder.ts).
const TODAY_PROMOTION = '60000000-0000-4000-8000-000000000001'
const NOVA_FOLDABLE_1 = productId(15)

// 목 대기열만 15초 가까이 걸린다(15~40번에서 시작해 초당 3명씩, 3초마다 조회).
test.describe.configure({ timeout: 60_000 })

test.beforeEach(async ({ page }) => {
  // '오늘 오픈' 목 사전예약은 한국 시간 오늘 09:00에 열린다 — 언제 돌려도 열려 있게 오전 10시로 맞춘다.
  // 시계는 그 시각부터 그대로 흐른다(목 대기열이 시간으로 순번을 줄인다).
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date())
  await page.clock.install({ time: new Date(`${today}T10:00:00+09:00`) })
})

/** 사전예약 상세에서 모델을 골라 대기열을 통과하고, 상품 페이지에서 사전예약을 접수한다. */
async function reserve(page: Page, modelName: string, modelId: string) {
  await page.goto(`/preorder/${TODAY_PROMOTION}`)
  await page.getByRole('button', { name: '사전예약 하러가기' }).click()

  const sheet = page.getByRole('dialog', { name: '사전예약' })
  const reserveButton = page.getByRole('button', { name: '예약하기' })
  await sheet
    .locator('div')
    .filter({ hasText: modelName })
    .filter({ has: reserveButton })
    .last()
    .getByRole('button', { name: '예약하기' })
    .click()

  await expect(page.getByText(/조금만 기다려주세요/)).toBeVisible()
  // 목 대기열은 15~40번에서 시작해 초당 3명씩 줄어든다.
  await expect(page).toHaveURL(`/products/${modelId}`, { timeout: 30_000 })

  await page.getByRole('button', { name: '사전예약하기', exact: true }).click()
}

test('비회원이 사전예약 하러가기를 누르면 모델 대신 로그인 모달이 뜬다', async ({
  page,
}) => {
  await page.goto(`/preorder/${TODAY_PROMOTION}`)
  await page.getByRole('button', { name: '사전예약 하러가기' }).click()

  await expect(page.getByRole('dialog', { name: '로그인' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '사전예약' })).toHaveCount(0)
})

test('대기열을 통과해 접수하면 결제 페이지로 가고 사전예약 내역에 순번이 생긴다', async ({
  page,
}) => {
  await loginAs(page)
  await reserve(page, '맥북 프로 14', MACBOOK_PRO_14)

  // 접수(202) 뒤 외부 등록이 끝나길 최대 5초 기다렸다가 결제로 넘어간다.
  await expect(page).toHaveURL(/\/payment\?preorderId=/, { timeout: 15_000 })

  await page.goto('/mypage?state=preorder-check')
  await expect(page.getByText('예약 순번 1,287번')).toBeVisible()
})

test('이미 예약한 모델을 다시 접수하면 알려 주고 사전예약 내역으로 보낸다', async ({
  page,
}) => {
  await loginAs(page)
  await reserve(page, 'NOVA 폴더블 1', NOVA_FOLDABLE_1)

  await expect(
    page.getByText(
      '이미 접수한 예약이 있어요. 사전예약 내역에서 확인해 주세요.',
    ),
  ).toBeVisible()
  await expect(page).toHaveURL('/mypage?state=preorder-check')
})
