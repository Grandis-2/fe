import {
  confirmPreorder,
  expect,
  loginAs,
  MACBOOK_PRO_14,
  NOVA_FOLDABLE_1,
  passPreorderQueue,
  preorderSubmitButton,
  setKstClock,
  test,
  TODAY_PROMOTION,
} from './fixtures'

// 목 대기열만 15초 가까이 걸리고(15~40번에서 시작해 초당 3명씩), 여러 테스트가 같이 돌면 더 느려진다.
test.describe.configure({ timeout: 90_000 })

test.beforeEach(async ({ page }) => {
  // 언제 돌려도 '오늘 오픈' 사전예약이 열려 있게 오전 10시로 맞춘다.
  await setKstClock(page, '10:00:00')
})

test('비회원이 사전예약 하러가기를 누르면 모델 대신 로그인 모달이 뜬다', async ({
  page,
}) => {
  await page.goto(`/preorder/${TODAY_PROMOTION}`)
  await page.getByRole('button', { name: '사전예약 하러가기' }).click()

  await expect(page.getByRole('dialog', { name: '로그인' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: '사전예약' })).toHaveCount(0)
})

test('대기열을 통과해 접수하면 5초 안에 등록이 끝나 결제로 바로 가고, 사전예약 내역에 순번이 생긴다', async ({
  page,
}) => {
  await loginAs(page)
  await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
  await preorderSubmitButton(page).click()

  // 접수 뒤 외부 등록을 기다리는 동안 버튼이 진행 단계를 알린다(목은 2초 뒤 등록).
  await expect(
    page.getByRole('button', { name: '예약 처리 중… (최대 5초)' }).first(),
  ).toBeVisible()
  await confirmPreorder(page)

  await page.goto('/mypage?state=preorder-check')
  await expect(page.getByText('예약 순번 1,287번')).toBeVisible()
})

test('이미 예약한 모델은 시트에서 예약하기 대신 구매 확정하기로 보이고, 누르면 대기열 없이 그 예약의 결제로 간다', async ({
  page,
}) => {
  await loginAs(page)
  await page.goto(`/preorder/${TODAY_PROMOTION}`)
  await page.getByRole('button', { name: '사전예약 하러가기' }).click()
  const foldableRow = page
    .getByRole('dialog', { name: '사전예약' })
    .locator('div')
    .filter({ hasText: 'NOVA 폴더블 1' })
    .filter({ has: page.getByRole('button') })
    .last()

  await expect(
    foldableRow.getByRole('button', { name: '구매 확정하기' }),
  ).toBeVisible()
  await expect(
    foldableRow.getByRole('button', { name: '예약하기' }),
  ).toHaveCount(0)
  await foldableRow.getByRole('button', { name: '구매 확정하기' }).click()
  await expect(page).toHaveURL(/\/payment\?preorderId=/)
})

test('이미 예약한 모델의 상품 페이지는 사전예약하기 대신 구매 확정하기를 보인다', async ({
  page,
}) => {
  await loginAs(page)
  await page.goto(`/products/${NOVA_FOLDABLE_1}`)

  const checkout = preorderSubmitButton(page)
  await expect(
    page.getByRole('button', { name: '구매 확정하기' }).first(),
  ).toBeVisible()
  await expect(checkout).toHaveCount(0)
  await page.getByRole('button', { name: '구매 확정하기' }).first().click()
  await expect(page).toHaveURL(/\/payment\?preorderId=/)
})

test('입장권이 남아 있어 진입에서 바로 입장(200)하면 대기열을 띄우지 않고 상품으로 간다', async ({
  page,
}) => {
  await loginAs(page)
  await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)

  // 새로고침 없이 돌아가야 목 대기열이 발급한 입장권을 기억한다 — 다시 서면 같은 입장권을 200으로 준다.
  await page.goBack()
  // 대기열 모달은 닫혀도 DOM에 남아 있어서, 한 번이라도 열렸는지를 기록해 둔다.
  await page.evaluate(() => {
    new MutationObserver(() => {
      const opened = document.querySelector('dialog[open]')
      if (opened?.textContent?.includes('조금만 기다려주세요'))
        document.body.dataset.queueShown = 'true'
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
    })
  })
  await page.getByRole('button', { name: '사전예약 하러가기' }).click()
  const sheet = page.getByRole('dialog', { name: '사전예약' })
  await sheet
    .locator('div')
    .filter({ hasText: '맥북 프로 14' })
    .filter({ has: page.getByRole('button', { name: '예약하기' }) })
    .last()
    .getByRole('button', { name: '예약하기' })
    .click()

  await expect(page).toHaveURL(`/products/${MACBOOK_PRO_14}`)
  await expect(page.locator('body')).not.toHaveAttribute(
    'data-queue-shown',
    'true',
  )
})
