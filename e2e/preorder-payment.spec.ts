import {
  expect,
  expectSingleNewReservation,
  fillPaymentForm,
  loginAs,
  MACBOOK_PRO_14,
  passPreorderQueue,
  preorderSubmitButton,
  setKstClock,
  stubDaumPostcode,
  stubTossPayments,
  test,
} from './fixtures'

// 페르소나 김아영(결제 실패로 차례가 날아갈까 불안함) — e2e/persona-scenarios.md A2

// 목 대기열만 15초 가까이 걸린다.
test.describe.configure({ timeout: 90_000 })

test('A2 사전예약 결제가 실패해도 예약 순번이 남아 다시 결제할 수 있다', async ({
  page,
}) => {
  await setKstClock(page, '10:00:00')
  await stubDaumPostcode(page)
  // 첫 결제는 카드사가 거절한 것처럼 토스가 실패로 돌려보낸다.
  await stubTossPayments(page, {
    failFirst: {
      code: 'REJECT_CARD_COMPANY',
      message: '카드사에서 결제를 거절했어요.',
    },
  })
  await loginAs(page)
  await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
  await preorderSubmitButton(page).click()
  await expect(page).toHaveURL(/\/payment\?preorderId=/, { timeout: 15_000 })
  const paymentUrl = page.url()

  await fillPaymentForm(page)
  await page.getByRole('button', { name: /결제하기$/ }).click()

  await expect(
    page.getByRole('heading', { name: '결제에 실패했어요' }),
  ).toBeVisible()
  await expect(page.getByText('카드사에서 결제를 거절했어요.')).toBeVisible()
  await expect(page.getByText('결제 금액은 청구되지 않았어요.')).toBeVisible()

  // 같은 예약의 결제 페이지로 돌아가 다시 결제한다.
  await page.getByRole('button', { name: '다시 결제하기' }).click()
  await expect(page).toHaveURL(paymentUrl)
  await fillPaymentForm(page)
  await page.getByRole('button', { name: /결제하기$/ }).click()

  await expect(
    page.getByRole('heading', { name: '사전예약 구매가 완료되었어요' }),
  ).toBeVisible()
  // 처음 받은 순번 그대로 하나만 있다 — 실패했다고 새로 줄 서지 않았다.
  await expectSingleNewReservation(page)
})
