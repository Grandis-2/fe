import { expect, NOVA_PHONE_1, test } from './fixtures'

// ?mock=500이면 목의 모든 API가 500으로 실패한다(handlers/forceError.ts).
// 5xx는 재시도(1초, 2초)를 마친 뒤에야 실패 화면이 되므로 기다리는 시간을 넉넉히 둔다.
const AFTER_RETRIES = { timeout: 15_000 }

test('홈: 상품 목록이 실패해도 화면은 남고 구간마다 실패 문구가 뜬다', async ({
  page,
}) => {
  await page.goto('/?mock=500')

  await expect(
    page.getByText('많이 찾는 상품을 불러오지 못했어요.'),
  ).toBeVisible(AFTER_RETRIES)
  await expect(page.getByText('모바일 상품을 불러오지 못했어요')).toBeVisible(
    AFTER_RETRIES,
  )
  await expect(page.getByRole('banner')).toBeVisible()
})

test('상품 상세: 상품을 못 불러오면 알리고 결제·장바구니 버튼을 그리지 않는다', async ({
  page,
}) => {
  await page.goto(`/products/${NOVA_PHONE_1}?mock=500`)

  await expect(page.getByText('상품을 불러오지 못했어요.')).toBeVisible(
    AFTER_RETRIES,
  )
  await expect(
    page.getByRole('button', { name: '결제하기', exact: true }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '장바구니', exact: true }),
  ).toHaveCount(0)
})
