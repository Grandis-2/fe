import {
  expect,
  kstToday,
  loginAs,
  setKstClock,
  test,
  TODAY_PROMOTION,
} from './fixtures'

// 페르소나 이진우(0초 폰켓팅) — e2e/persona-scenarios.md J1

test('J1 오픈 시각이 되면 새로고침 없이 시트의 예약하기 버튼이 열린다', async ({
  page,
}) => {
  // '오늘 오픈' 사전예약은 09:00에 열린다. 화면을 다 불러온 뒤 오픈 10초 전에 시계를 멈추고
  // 그다음부터는 손으로 흘린다(불러오는 시간과 상관없이 같은 순간을 본다).
  await setKstClock(page, '08:58:00')
  // 예약 시트는 회원만 연다.
  await loginAs(page)
  await page.goto(`/preorder/${TODAY_PROMOTION}`)
  const cta = page.getByRole('button', { name: '사전예약 하러가기' })
  await expect(cta).toBeVisible()

  await page.clock.pauseAt(kstToday('08:59:50'))
  await expect(page.getByText('1분 후 시작')).toBeVisible()
  // 오픈 전에도 시트는 열리고, 그 안의 예약하기만 막혀 있다.
  await cta.click()
  const reserve = page
    .getByRole('dialog', { name: '사전예약' })
    .getByRole('button', { name: '예약하기' })
    .first()
  await expect(reserve).toBeDisabled()

  await page.clock.runFor(11_000)
  await expect(reserve).toBeEnabled()
  await expect(page.getByText('1분 후 시작')).toHaveCount(0)
})
