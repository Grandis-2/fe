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

test('M2 예약 현황은 10건이 넘으면 쪽을 넘겨 끝까지 본다', async ({ page }) => {
  await loginAsAdmin(page)
  await openAdminMenu(page, '예약 현황')

  // 시드: 확정 33건(결제 대기 + 결제 완료) — 서버는 상태를 하나씩 걸러서 두 목록을 이어 붙인다.
  await page.getByRole('button', { name: /^확정/ }).click()
  await page.getByRole('button', { name: '4', exact: true }).click()

  await expect(page).toHaveURL(/page=4/)
  // 머리 줄 + 남은 3건
  await expect(page.getByRole('row')).toHaveCount(4)
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

test('M8 외부 예약 대조에서 서버 검사 결과를 보고 고친 뒤 다시 검사하면 줄어든다', async ({
  page,
}) => {
  test.setTimeout(90_000)
  await loginAsAdmin(page)
  await openAdminMenu(page, '외부 예약 대조')

  // 시드: 한 시간 전 정기 검사에서 불일치 — 브라우저는 결과만 받는다.
  const summary = page.getByRole('region', { name: '최근 검사 결과' })
  await expect(summary).toContainText(/불일치 \d+건/)
  const before = Number(
    (await summary.textContent())?.match(/불일치 (\d+)건/)?.[1],
  )

  // 재처리는 서버가 뒤에서 한다 — '처리 중'이었다가 예약이 등록되면 '완료'로 바뀐다.
  await page.getByRole('button', { name: /^재처리 필요/ }).click()
  await page.getByRole('button', { name: '재처리', exact: true }).click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: '재처리', exact: true })
    .click()
  await expect(page.getByText('처리 중').first()).toBeVisible()
  await expect(page.getByText('완료', { exact: true })).toBeVisible({
    timeout: 20_000,
  })

  // 예약 취소는 사유를 받는다(기본 문구로 확인만 눌러도 된다).
  await page.getByRole('button', { name: /^예약 취소 필요/ }).click()
  await page.getByRole('button', { name: '예약 취소', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('취소 사유')).toHaveValue('외부에서 취소됨')
  await dialog.getByRole('button', { name: '예약 취소', exact: true }).click()
  await expect(page.getByText('완료', { exact: true })).toBeVisible({
    timeout: 20_000,
  })

  // 다시 검사하면 고친 두 건이 빠진다.
  await page.getByRole('button', { name: '지금 검사' }).click()
  await expect(page.getByRole('button', { name: '검사 중…' })).toBeDisabled()
  await expect(summary).toContainText(`불일치 ${before - 2}건`, {
    timeout: 20_000,
  })
  await expect(page.getByText(/· 직접 요청 ·/)).toBeVisible()
})

test('M9 이벤트 DLQ에서 결제 서비스를 고르면 결제 쪽 멈춘 메시지와 관련 주문이 보인다', async ({
  page,
}) => {
  await loginAsAdmin(page)
  // 사이드바 아래쪽 메뉴는 개발용 요청 모니터 창에 가린다 — 주소로 들어간다.
  await page.goto('/admin/dead-letters')

  // 시드: 결제 DLQ에 처리 대기 환불 요청 1건.
  await page.getByRole('button', { name: '서비스: 예약 서비스' }).click()
  await page.getByRole('button', { name: '결제 서비스', exact: true }).click()
  await expect(page).toHaveURL(/service=payment/)
  await expect(
    page.getByRole('columnheader', { name: '관련 주문' }),
  ).toBeVisible()

  // 행의 이벤트 칸을 눌러 상세로 — 관련 주문 칸은 주문 상세 링크다.
  await page
    .getByRole('row', { name: /환불 요청 처리/ })
    .getByText('환불 요청 처리')
    .click()
  await expect(
    page.getByRole('heading', { name: '환불 요청 처리' }),
  ).toBeVisible()
  await expect(page).toHaveURL(/service=payment/)
  await expect(page.getByText(/관련 주문/).first()).toBeVisible()
})
