import {
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

test('대기열을 통과해 접수하면 결제 페이지로 가고 사전예약 내역에 순번이 생긴다', async ({
  page,
}) => {
  await loginAs(page)
  await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
  await preorderSubmitButton(page).click()

  // 접수(202) 뒤 외부 등록이 끝나길 최대 5초 기다렸다가 결제로 넘어간다.
  await expect(page).toHaveURL(/\/payment\?preorderId=/, { timeout: 15_000 })

  await page.goto('/mypage?state=preorder-check')
  await expect(page.getByText('예약 순번 1,287번')).toBeVisible()
})

test('이미 예약한 모델을 다시 접수하면 알려 주고 사전예약 내역으로 보낸다', async ({
  page,
}) => {
  await loginAs(page)
  await passPreorderQueue(page, 'NOVA 폴더블 1', NOVA_FOLDABLE_1)
  await preorderSubmitButton(page).click()

  await expect(
    page.getByText(
      '이미 접수한 예약이 있어요. 사전예약 내역에서 확인해 주세요.',
    ),
  ).toBeVisible()
  await expect(page).toHaveURL('/mypage?state=preorder-check')
})
