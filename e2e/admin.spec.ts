import {
  cartPayButton,
  expect,
  fillPaymentForm,
  loginAs,
  loginAsAdmin,
  openCartPayment,
  readTossRequest,
  stubDaumPostcode,
  stubTossPayments,
  test,
} from './fixtures'

import type { Page } from '@playwright/test'

// 페르소나 박성민(운영 & 트래픽 관리자) — e2e/persona-scenarios.md M2·M7
// 관리자 목 데이터는 메모리에만 있어 page.goto/새로고침이면 시드로 돌아간다. 화면 사이는 사이드바로 옮긴다.

const openAdminMenu = (page: Page, name: string) =>
  page
    .getByRole('navigation', { name: '관리자 메뉴' })
    .getByRole('link', { name })
    .click()

test('M2 예약 현황에서 외부 등록 실패 건을 찾아 실패 사유를 본다', async ({
  page,
}) => {
  await loginAsAdmin(page)
  await openAdminMenu(page, '예약 현황')

  // 시드: 외부 등록 실패 3건(RSV-93355·93297·93260), 모두 503으로 세 번 실패.
  // 탭 이름 뒤에 건수 배지가 붙는다('외부 등록 실패 3').
  await page.getByRole('button', { name: /^외부 등록 실패/ }).click()
  await page.getByRole('button', { name: 'RSV-93355 상세 보기' }).click()

  await expect(page.getByRole('heading', { name: /RSV-93355/ })).toBeVisible()
  await expect(
    page.getByText(/HTTP 503 — Service Unavailable/).first(),
  ).toBeVisible()
  await expect(page.getByText(/시도 3회 모두 실패/)).toBeVisible()
})

test('M2 예약 현황은 20건이 넘으면 쪽을 넘겨 끝까지 본다', async ({ page }) => {
  await loginAsAdmin(page)
  await openAdminMenu(page, '예약 현황')

  // 시드: 확정 33건(결제 대기 + 결제 완료) — 서버는 상태를 하나씩 걸러서 두 목록을 이어 붙인다.
  await page.getByRole('button', { name: /^확정/ }).click()
  await page.getByRole('button', { name: '2', exact: true }).click()

  await expect(page).toHaveURL(/page=2/)
  // 머리 줄 + 남은 13건
  await expect(page.getByRole('row')).toHaveCount(14)
})

test('M7 회원이 결제한 주문을 관리자가 배송 완료까지 처리하면 회원 주문 내역도 바뀐다', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await stubDaumPostcode(page)
  await stubTossPayments(page)
  await openCartPayment(page)
  await fillPaymentForm(page)
  await cartPayButton(page).click()
  await expect(
    page.getByRole('heading', { name: '주문이 완료되었어요' }),
  ).toBeVisible()
  const orderId = new URL(
    (await readTossRequest(page)).successUrl,
  ).searchParams.get('orderToken')!

  // 관리자로 로그인하면 회원 로그인은 풀린다.
  await loginAsAdmin(page)
  await openAdminMenu(page, '주문 관리')
  await page.getByLabel('주문 id로 열기').fill(orderId)
  await page.getByRole('button', { name: '열기', exact: true }).click()

  for (const step of ['배송 준비 시작', '포장 완료', '출고', '배송 완료']) {
    await page.getByRole('button', { name: step, exact: true }).click()
    await page
      .getByRole('dialog', { name: step })
      .getByRole('button', { name: step, exact: true })
      .click()
    await expect(page.getByText(`${step} 처리했습니다.`)).toBeVisible()
  }

  // 요약 칸·필터 칩에도 '배송 완료'가 늘 있으니, 이 주문의 카드 안에서 찾는다(주문번호 = id 끝 8자리).
  await loginAs(page, '/mypage?state=history')
  const orderCard = page
    .getByRole('article')
    .filter({ hasText: `주문번호 ${orderId.slice(-8).toUpperCase()}` })
  await expect(orderCard.getByText('배송 완료', { exact: true })).toBeVisible()
})
