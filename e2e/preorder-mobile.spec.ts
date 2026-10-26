import {
  expect,
  loginAs,
  MACBOOK_PRO_14,
  preorderSubmitButton,
  queueFromPreorderDetail,
  setKstClock,
  test,
} from './fixtures'

// 페르소나 이진우(0초 폰켓팅, 모바일로 신청) — e2e/persona-scenarios.md J2
// 사이트 모바일 구간(743px 이하). 상품 상세는 799px 이하에서 하단 고정바로만 신청한다.
test.use({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
})

// 목 대기열만 15초 가까이 걸린다.
test.describe.configure({ timeout: 90_000 })

test('J2 휴대폰에서 하단 탭으로 들어가 사전예약을 접수하고 결제 페이지까지 간다', async ({
  page,
}) => {
  await setKstClock(page, '10:00:00')
  await loginAs(page)

  await page
    .getByRole('navigation', { name: '하단 메뉴' })
    .getByRole('link', { name: '사전예약' })
    .click()
  await expect(page).toHaveURL(/\/preorder/)
  await page.getByRole('link', { name: /맥북 프로 14 사전예약/ }).click()

  await queueFromPreorderDetail(page, '맥북 프로 14', MACBOOK_PRO_14)
  // 데스크톱 옵션 패널의 버튼은 숨고 하단 고정바의 버튼만 남는다.
  await preorderSubmitButton(page).click()

  await expect(page).toHaveURL(/\/result\?status=preorder&preorderId=/, {
    timeout: 15_000,
  })
})
