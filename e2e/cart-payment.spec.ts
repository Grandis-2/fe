import {
  CART_TOTAL,
  CART_TOTAL_TEXT,
  cartPayButton,
  expect,
  fillPaymentForm,
  loginAs,
  NOVA_PHONE_1,
  openCartPayment,
  PROFILE,
  readTossRequest,
  setMockFault,
  stubDaumPostcode,
  stubTossPayments,
  test,
} from './fixtures'

import type { Page } from '@playwright/test'

const summaryTotal = (page: Page) =>
  page.getByText('결제 예정 금액').locator('..')

test.describe('장바구니', () => {
  test('전체 선택하면 살 수 있는 상품만 골라 합계를 낸다', async ({ page }) => {
    await loginAs(page, '/mypage?state=cart')
    const payButtonInCart = page.getByRole('button', {
      name: '결제하기',
      exact: true,
    })
    await expect(payButtonInCart).toBeDisabled()

    await page.getByText('전체 선택').click()

    await expect(page.getByText('선택 상품').locator('..')).toContainText('3개')
    await expect(summaryTotal(page)).toContainText(CART_TOTAL_TEXT)
    await expect(payButtonInCart).toBeEnabled()
  })
})

test.describe('장바구니 → 결제 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await stubDaumPostcode(page)
    await stubTossPayments(page)
  })

  test('고른 상품과 금액, 회원 정보가 채워져 있다', async ({ page }) => {
    await openCartPayment(page)

    await expect(page.getByText('상품 수').locator('..')).toContainText('4개')
    await expect(page.getByText('결제 기한').locator('..')).toContainText(
      '주문 후 10분 안에 결제',
    )
    await expect(summaryTotal(page)).toContainText(CART_TOTAL_TEXT)
    await expect(page.getByLabel('이름')).toHaveValue(PROFILE.name)
  })

  test('약관에 다 동의하기 전엔 결제할 수 없고, 빈 칸이 있으면 알려 준다', async ({
    page,
  }) => {
    await openCartPayment(page)
    await expect(cartPayButton(page)).toBeDisabled()

    await page.getByText('아래 내용에 모두 동의합니다.').click()
    await cartPayButton(page).click()

    await expect(
      page.getByText('기본 주소을(를) 필수로 작성해주세요'),
    ).toBeVisible()
    await expect(
      page.getByText('상세 주소을(를) 필수로 작성해주세요'),
    ).toBeVisible()
    expect(await readTossRequest(page)).toBeNull()
  })

  test('결제창에는 화면에 보인 금액 그대로 넘긴다', async ({ page }) => {
    await openCartPayment(page)
    await fillPaymentForm(page)
    await cartPayButton(page).click()

    await expect(page).toHaveURL(/\/result\?status=paid/)
    const request = await readTossRequest(page)
    expect(request.amount.value).toBe(CART_TOTAL)
    expect(request.orderName).toContain('NOVA 스마트폰 1')
  })
})

test.describe('상품 상세 → 결제', () => {
  test('비회원이 결제하기를 누르면 로그인 모달이 뜬다', async ({ page }) => {
    await page.goto(`/products/${NOVA_PHONE_1}`)
    await page.getByRole('button', { name: '결제하기', exact: true }).click()

    await expect(page.getByRole('dialog', { name: '로그인' })).toBeVisible()
    await expect(page).toHaveURL(`/products/${NOVA_PHONE_1}`)
  })

  test('회원이 결제하기를 누르면 고른 옵션으로 결제 페이지에 간다', async ({
    page,
  }) => {
    await loginAs(page)
    await page.goto(`/products/${NOVA_PHONE_1}`)
    await page.getByRole('button', { name: '결제하기', exact: true }).click()

    await expect(page).toHaveURL('/payment')
    await expect(page.getByText('실버 · 256GB')).toBeVisible()
  })
})

test.describe('결제 승인', () => {
  test.beforeEach(async ({ page }) => {
    await stubDaumPostcode(page)
  })

  test('승인되면 주문 완료 화면이 뜨고, 산 상품은 장바구니에서 빠진다', async ({
    page,
  }) => {
    await stubTossPayments(page)
    await openCartPayment(page)
    await fillPaymentForm(page)
    await cartPayButton(page).click()

    await expect(
      page.getByRole('heading', { name: '주문이 완료되었어요' }),
    ).toBeVisible()
    await expect(page.getByText('총 결제 금액').locator('..')).toContainText(
      CART_TOTAL_TEXT,
    )

    await page.goto('/mypage?state=cart')
    await expect(page.getByText('NOVA 노트북 1')).toHaveCount(0)
    await expect(page.getByText('NOVA 마우스 (판매 중지)')).toBeVisible()
  })

  test('승인된 콜백 주소를 다시 열어도 두 번 결제되지 않고 완료 화면이 뜬다', async ({
    page,
  }) => {
    await stubTossPayments(page)
    await openCartPayment(page)
    await fillPaymentForm(page)
    await cartPayButton(page).click()
    await expect(page).toHaveURL(/\/result\?status=paid/)

    const request = await readTossRequest(page)
    const callback = new URL(request.successUrl)
    callback.searchParams.set('paymentKey', 'e2e_payment_key')
    callback.searchParams.set('orderId', request.orderId)
    callback.searchParams.set('amount', String(request.amount.value))
    await page.goto(callback.toString())

    await expect(page).toHaveURL(/\/result\?status=paid/)
    await expect(
      page.getByRole('heading', { name: '주문이 완료되었어요' }),
    ).toBeVisible()
  })

  test('금액을 바꿔 돌아오면 승인하지 않고 실패 사유를 보여 준다', async ({
    page,
  }) => {
    await stubTossPayments(page, { amountOverride: 1000 })
    await openCartPayment(page)
    await fillPaymentForm(page)
    await cartPayButton(page).click()

    await expect(
      page.getByRole('heading', { name: '결제에 실패했어요' }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByText('결제 금액이 주문 금액과 다릅니다.'),
    ).toBeVisible()
    await expect(page.getByText('결제 금액은 청구되지 않았어요.')).toBeVisible()
  })

  test('승인 서버가 계속 실패하면 실패 화면으로 간다', async ({ page }) => {
    await stubTossPayments(page)
    await openCartPayment(page)
    await setMockFault(page, 'confirm')
    await fillPaymentForm(page)
    await cartPayButton(page).click()

    await expect(
      page.getByRole('heading', { name: '결제에 실패했어요' }),
    ).toBeVisible({ timeout: 20_000 })
    await expect(
      page.getByText('결제가 완료되지 않았어요. 다시 시도해 주세요.'),
    ).toBeVisible()
  })
})

test('결제창을 닫으면 실패 화면 대신 결제 대기 주문이 있는 주문 내역으로 간다', async ({
  page,
}) => {
  await stubDaumPostcode(page)
  await stubTossPayments(page, {
    failFirst: { code: 'PAY_PROCESS_CANCELED', message: '결제를 취소했어요.' },
  })
  await openCartPayment(page)
  await fillPaymentForm(page)
  await cartPayButton(page).click()

  await expect(page).toHaveURL(/\/mypage\?state=history/)
  await expect(
    page.getByRole('heading', { name: '결제에 실패했어요' }),
  ).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: '결제하기', exact: true }).first(),
  ).toBeVisible()
})
