import { expect, NOVA_PHONE_1, test } from './fixtures'

// ?mock=500이면 목의 모든 API가 500으로 실패한다(handlers/forceError.ts).
// 5xx는 재시도(1초, 2초)를 마친 뒤에야 실패 화면이 되므로 기다리는 시간을 넉넉히 둔다.
const AFTER_RETRIES = { timeout: 15_000 }

const RANKING_TITLE = /많이 찾는 상품 TOP/

// 아래 '숨는다' 확인의 대조군 — 랭킹이 원래부터 안 그려지면 숨김 확인은 아무것도 증명하지 못한다.
test('홈: 랭킹을 불러오면 많이 찾는 상품 구간이 보인다', async ({ page }) => {
  await page.goto('/')

  const ranking = page.getByRole('region', { name: RANKING_TITLE })
  await expect(ranking).toBeVisible()
  await expect(ranking).not.toHaveAttribute('aria-busy', 'true')
  await expect(ranking.getByRole('link').first()).toBeVisible()
})

test('홈: 상품 목록이 실패해도 화면은 남고, 카테고리 구간엔 실패 문구가 뜨고 랭킹은 숨는다', async ({
  page,
}) => {
  // 랭킹이 실제로 실패했는지 확인한다 — 요청이 안 나가 숨은 것과 구분한다.
  const rankingFailed = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/v1/products/ranking' &&
      response.status() === 500,
  )
  await page.goto('/?mock=500')
  await rankingFailed

  await expect(page.getByText('모바일 상품을 불러오지 못했어요')).toBeVisible(
    AFTER_RETRIES,
  )
  // 랭킹은 집계를 읽지 못하면 명세대로 영역째 숨긴다(ProductRanking).
  await expect(page.getByText(RANKING_TITLE)).toHaveCount(0)
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
