import {
  confirmPreorder,
  expect,
  kstToday,
  loginAs,
  MACBOOK_PRO_14,
  passPreorderQueue,
  preorderSubmitButton,
  setKstClock,
  test,
  TODAY_PROMOTION,
} from './fixtures'

import type { BrowserContext, Page } from '@playwright/test'

// 같은 브라우저의 여러 창 — 로그인은 창끼리 같이 쓰고, 대기열·입장권은 창별 sessionStorage에 있다.
// 목 대기열도 창별 sessionStorage(mock_waitingroom)라 새 창은 다른 줄이 된다. 실서버의 "같은 회원은
// 같은 자리·같은 입장권"은 창 1의 저장소를 창 2에 넘겨 흉내 낸다.

// 목 대기열만 15초 가까이 걸린다.
test.describe.configure({ timeout: 90_000 })

test.beforeEach(async ({ page }) => {
  await setKstClock(page, '10:00:00')
})

/** 같은 브라우저(컨텍스트)의 새 창. sessionStorage는 넘겨준 것만 갖고 시작한다. */
async function openWindow(
  context: BrowserContext,
  session: Record<string, string> = {},
) {
  const page = await context.newPage()
  await page.clock.install({ time: kstToday('10:00:30') })
  await page.addInitScript((items) => {
    if (sessionStorage.getItem('e2e:seeded')) return
    for (const [key, value] of Object.entries(items))
      sessionStorage.setItem(key, value)
    sessionStorage.setItem('e2e:seeded', '1')
  }, session)
  return page
}

const readSession = (page: Page) =>
  page.evaluate(() => ({ ...sessionStorage }) as Record<string, string>)

test('E6 탭을 복제해 같은 입장권·같은 접수 키로 다시 접수하면 기존 예약으로 이어진다', async ({
  page,
  context,
}) => {
  await loginAs(page)
  await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
  // 접수하면 입장권을 지우므로 그 전에 복제할 값을 잡아 둔다.
  const { preorder_admission: admission } = await readSession(page)
  await preorderSubmitButton(page).click()
  await confirmPreorder(page)
  const firstPreorderId = new URL(page.url()).searchParams.get('preorderId')
  // 접수 뒤의 목 대기열 — 입장권이 쓰인 상태다.
  const { mock_waitingroom: queue } = await readSession(page)

  const copy = await openWindow(context, {
    preorder_admission: admission,
    mock_waitingroom: queue,
  })
  await copy.goto(`/products/${MACBOOK_PRO_14}`)
  // 진행 중 예약 조회가 먼저 오면 버튼이 구매 확정하기로 바뀌고, 그 전에 누르면 같은 키로 재전송한다.
  // 어느 쪽이든 새 예약 없이 처음 예약의 결제로 가야 한다.
  await copy
    .getByRole('button', { name: /^(사전예약하기|구매 확정하기)$/ })
    .first()
    .click()

  // 같은 키 재전송이라 새 예약 없이 처음 예약의 결제로 간다.
  await expect(copy).toHaveURL(new RegExp(`preorderId=${firstPreorderId}$`), {
    timeout: 15_000,
  })
  await expect(copy.getByText('대기열에 다시 입장해 주세요')).toHaveCount(0)
})

test('B15 줄 서는 중 다른 창에서 로그아웃하면 대기열이 닫히고 로그인이 필요하다고 알린다', async ({
  page,
  context,
}) => {
  await loginAs(page)
  await page.goto(`/preorder/${TODAY_PROMOTION}`)
  await page.getByRole('button', { name: '사전예약 하러가기' }).click()
  const reserveButton = page.getByRole('button', { name: '예약하기' })
  await page
    .getByRole('dialog', { name: '사전예약' })
    .locator('div')
    .filter({ hasText: '맥북 프로 14' })
    .filter({ has: reserveButton })
    .last()
    .getByRole('button', { name: '예약하기' })
    .click()
  await expect(page.getByText('조금만 기다려주세요')).toBeVisible()

  const other = await openWindow(context)
  await other.goto('/mypage')
  await other.getByRole('button', { name: '로그아웃' }).click()
  await expect(other).toHaveURL('/')

  // 로그아웃이 창 1에도 전해져 다음 순번 조회가 401이 되면 대기열을 끝낸다.
  await expect(page.getByText('로그인이 필요합니다.')).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('조금만 기다려주세요')).toBeHidden()
  await expect(page.getByText(/내 번호|곧 내 차례/)).toHaveCount(0)

  // 줄 정보는 새로고침에 대비해 저장소에도 있다 — 거기서도 지워져야 새로고침했을 때 대기열이 되살아나지 않는다.
  const queueRequests: string[] = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/v1/preorders/queue')
      queueRequests.push(request.method())
  })
  await page.reload()
  await expect(page.getByRole('banner')).toBeVisible()
  await page.waitForTimeout(2_000)
  expect(queueRequests).toEqual([])
})
