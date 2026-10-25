import {
  collectPreorderSubmits,
  expect,
  expectSingleNewReservation,
  loginAs,
  MACBOOK_PRO_14,
  passPreorderQueue,
  preorderSubmitButton,
  setKstClock,
  setMockFault,
  test,
  TODAY_PROMOTION,
} from './fixtures'

// 페르소나 최하늘(불안정한 네트워크에서 다시 누름) — e2e/persona-scenarios.md H2·H3·H4
// 목 기준 새 예약은 순번 1,287번을 받는다. 중복 접수되면 1,288번이 생긴다.

// 목 대기열만 15초 가까이 걸린다.
test.describe.configure({ timeout: 90_000 })

test.beforeEach(async ({ page }) => {
  await setKstClock(page, '10:00:00')
  await loginAs(page)
})

test('H2 사전예약하기를 같은 순간에 두 번 눌러도 예약은 하나만 생긴다', async ({
  page,
}) => {
  const submits = collectPreorderSubmits(page)
  await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)

  // 화면이 비활성으로 바뀌기 전에 두 번 누른다(Playwright의 dblclick보다 확실하게 겹친다).
  await preorderSubmitButton(page).evaluate((button: HTMLButtonElement) => {
    button.click()
    button.click()
  })

  await expect(page).toHaveURL(/\/result\?status=preorder&preorderId=/, {
    timeout: 15_000,
  })
  // 요청이 두 번 나갔다면 같은 멱등키여야 한다.
  expect(submits.length).toBeGreaterThanOrEqual(1)
  expect(submits[0].idempotencyKey).toBeTruthy()
  expect(new Set(submits.map((submit) => submit.idempotencyKey)).size).toBe(1)
  await expectSingleNewReservation(page)
})

test('H3 서버가 잠깐 실패한 뒤 다시 누르면 같은 멱등키로 한 번만 접수된다', async ({
  page,
}) => {
  const submits = collectPreorderSubmits(page)
  await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)

  await setMockFault(page, 'all')
  await preorderSubmitButton(page).click()
  await expect(
    page
      .getByText(
        '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      )
      .first(),
  ).toBeVisible()

  await setMockFault(page, null)
  await preorderSubmitButton(page).click()

  await expect(page).toHaveURL(/\/result\?status=preorder&preorderId=/, {
    timeout: 15_000,
  })
  expect(submits).toHaveLength(2)
  expect(submits[0].idempotencyKey).toBeTruthy()
  expect(submits[1].idempotencyKey).toBe(submits[0].idempotencyKey)
  await expectSingleNewReservation(page)
})

test('H4 응답을 못 받고 같은 내용을 다시 보내면 처음 예약번호를 그대로 돌려준다', async ({
  page,
}) => {
  const submits = collectPreorderSubmits(page)
  await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
  await preorderSubmitButton(page).click()
  await expect(page).toHaveURL(/\/result\?status=preorder&preorderId=/, {
    timeout: 15_000,
  })
  const preorderId = new URL(page.url()).searchParams.get('preorderId')

  // 접수는 서버에 반영됐는데 응답을 잃어버린 클라이언트가 같은 요청을 다시 보낸 상황.
  // 목은 Authorization이 Bearer로 시작하는지만 본다.
  const [first] = submits
  const replay = await page.evaluate(async (submit) => {
    const response = await fetch(submit.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer e2e',
        'Idempotency-Key': submit.idempotencyKey ?? '',
        'X-Admission-Ticket': submit.admissionTicket ?? '',
      },
      body: JSON.stringify(submit.body),
    })
    return { status: response.status, body: await response.json() }
  }, first)

  expect(replay.status).toBe(202)
  expect(replay.body.data.preorderId).toBe(preorderId)
  expect(replay.body.data.replayed).toBe(true)
  await expectSingleNewReservation(page)
})

test('대기열 진입 응답이 늦어도 눌렀을 때 대기 모달이 먼저 뜬다', async ({
  page,
}) => {
  // 진입(POST /preorders/queue)만 5초 늦게 보낸다 — axios는 XHR이라 send를 미룬다.
  await page.addInitScript(() => {
    const { open, send } = XMLHttpRequest.prototype
    const slow = new WeakSet<XMLHttpRequest>()
    XMLHttpRequest.prototype.open = function (
      this: XMLHttpRequest,
      method: string,
      url: string | URL,
      ...rest: [boolean?, string?, string?]
    ) {
      if (method === 'POST' && String(url).includes('/preorders/queue'))
        slow.add(this)
      return open.call(this, method, url, ...(rest as [boolean]))
    } as typeof open
    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest, body) {
      if (slow.has(this)) setTimeout(() => send.call(this, body), 5_000)
      else send.call(this, body)
    }
  })

  await page.goto(`/preorder/${TODAY_PROMOTION}`)
  await page.getByRole('button', { name: '사전예약 하러가기' }).click()
  await page
    .getByRole('dialog', { name: '사전예약' })
    .getByRole('button', { name: '예약하기' })
    .first()
    .click()

  // 진입 응답(5초)보다 먼저 떠야 한다.
  await expect(page.getByText(/조금만 기다려주세요/)).toBeVisible({
    timeout: 2_000,
  })
})
