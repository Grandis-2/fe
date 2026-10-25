import {
  confirmPreorder,
  collectPreorderSubmits,
  expect,
  fillPaymentForm,
  kstToday,
  loginAs,
  MACBOOK_PRO_14,
  FOLDABLE_3_PROMOTION,
  NOVA_FOLDABLE_1,
  NOVA_FOLDABLE_3,
  passPreorderQueue,
  preorderSubmitButton,
  setKstClock,
  setMockFault,
  stubDaumPostcode,
  stubTossPayments,
  test,
  TODAY_PROMOTION,
} from './fixtures'

import type { Page } from '@playwright/test'

// 대기열 테스트 시나리오(아티팩트 '대기열 테스트 시나리오')의 A~F 중 목으로 재현할 수 있는 것.
// 앞의 영문·숫자가 그 문서의 시나리오 번호다. 명세와 다르게 동작하는 것은 test.fail로 둔다 —
// 고쳐서 통과하기 시작하면 Playwright가 알려 주니 그때 test.fail을 지운다.

// 목 대기열은 15~40번에서 시작해 초당 3명씩 줄어 15초 가까이 걸린다.
test.describe.configure({ timeout: 120_000 })

test.beforeEach(async ({ page }) => {
  await setKstClock(page, '10:00:00')
  await loginAs(page)
})

const QUEUE_TITLE = '조금만 기다려주세요'
const NEED_QUEUE = '사전예약 페이지에서 대기열을 거쳐야 예약할 수 있어요.'
const queueDialog = (page: Page) =>
  page.getByRole('dialog', { name: new RegExp(QUEUE_TITLE) })
const queuePill = (page: Page) =>
  page.getByRole('button', { name: /내 번호|곧 내 차례|내 차례예요/ })

/** 사전예약 상세의 시트에서 모델의 예약하기를 누른다(대기열 통과는 기다리지 않는다). */
async function pressReserve(page: Page, modelName: string) {
  await page.getByRole('button', { name: '사전예약 하러가기' }).click()
  const reserveButton = page.getByRole('button', { name: '예약하기' })
  await page
    .getByRole('dialog', { name: '사전예약' })
    .locator('div')
    .filter({ hasText: modelName })
    .filter({ has: reserveButton })
    .last()
    .getByRole('button', { name: '예약하기' })
    .click()
}

/** 맥북 줄에 서서 대기열 창이 뜰 때까지 기다린다. */
async function joinMacbookQueue(page: Page) {
  await page.goto(`/preorder/${TODAY_PROMOTION}`)
  await pressReserve(page, '맥북 프로 14')
  await expect(queueDialog(page)).toBeVisible()
}

const closeQueueDialog = (page: Page) =>
  queueDialog(page).getByRole('button', { name: '닫기' }).click()

test.describe('A. 줄 서기', () => {
  test('A4 줄에 선 채로 새로고침하면 대기열이 다시 뜨고 자리를 지켰다고 알린다', async ({
    page,
  }) => {
    await joinMacbookQueue(page)
    await page.reload()

    await expect(queueDialog(page)).toBeVisible()
    await expect(
      page.getByText('전에 서 있던 자리 그대로예요. 순번을 잃지 않았어요.'),
    ).toBeVisible()
  })

  test('A6 진입이 503으로 실패해도 대기열 창을 띄운 채 다시 시도하고, 회복되면 통과한다', async ({
    page,
  }) => {
    await page.goto(`/preorder/${TODAY_PROMOTION}`)
    // 화면이 다 그려진 뒤에 장애를 낸다 — 먼저 내면 홍보 조회가 실패해 버튼이 안 그려진다.
    await expect(
      page.getByRole('button', { name: '사전예약 하러가기' }),
    ).toBeVisible()
    await setMockFault(page, 'all')
    await pressReserve(page, '맥북 프로 14')
    await expect(queueDialog(page)).toBeVisible()

    await setMockFault(page, null)
    await expect(page).toHaveURL(`/products/${MACBOOK_PRO_14}`, {
      timeout: 45_000,
    })
  })

  test('A12 다른 상품 줄에 서 있으면 새 줄을 서지 않고 알린다', async ({
    page,
  }) => {
    await joinMacbookQueue(page)
    await closeQueueDialog(page)
    // 예약이 없는 다른 모델 — 새로 들어가면 저장해 둔 맥북 줄이 대기열 창과 함께 다시 뜬다(A4). 닫고 누른다.
    await page.goto(`/preorder/${FOLDABLE_3_PROMOTION}`)
    await expect(queueDialog(page)).toBeVisible()
    await closeQueueDialog(page)
    await pressReserve(page, 'NOVA 폴더블 3')

    await expect(
      page.getByText(
        "'맥북 프로 14' 대기열에 서 있어요. 끝나거나 나간 뒤 다시 눌러 주세요.",
      ),
    ).toBeVisible()
    await expect(queuePill(page)).toBeVisible()
  })

  test('A13 닫아 둔 대기열의 상품을 다시 누르면 대기열 창이 다시 열린다', async ({
    page,
  }) => {
    await joinMacbookQueue(page)
    await closeQueueDialog(page)
    await expect(queueDialog(page)).toBeHidden()

    await pressReserve(page, '맥북 프로 14')
    await expect(queueDialog(page)).toBeVisible()
  })

  test('A14 오픈 순간 진행 중 예약 확인은 시트·줄 서기·상품 페이지를 통틀어 한 번만 서버에 묻는다', async ({
    page,
  }) => {
    // 이 조회는 대기열을 거치지 않고 서버로 간다 — 모델마다·화면마다 묻으면 오픈 순간 DB에 몰린다.
    const lookups: string[] = []
    page.on('request', (request) => {
      const { pathname, searchParams } = new URL(request.url())
      if (
        pathname === '/api/v1/preorders/active' ||
        (pathname === '/api/v1/preorders' && searchParams.has('productId'))
      )
        lookups.push(`${pathname}${searchParams.size ? '?' : ''}`)
    })

    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    await expect(preorderSubmitButton(page)).toBeVisible()

    expect(lookups).toEqual(['/api/v1/preorders/active'])
  })

  test('A16 보안 연결(https)이 아닌 주소면 줄을 서기 전에 알리고 대기열에 들어가지 않는다', async ({
    page,
  }) => {
    // 내부망 http 주소(http://192.168.x.x)로 연 것처럼 — 보안 연결이 아니고 crypto.subtle도 없다.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'isSecureContext', { get: () => false })
      Object.defineProperty(Crypto.prototype, 'subtle', {
        get: () => undefined,
      })
    })
    const queueRequests: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).pathname === '/api/v1/preorders/queue')
        queueRequests.push(request.method())
    })
    await page.goto(`/preorder/${TODAY_PROMOTION}`)
    await pressReserve(page, '맥북 프로 14')

    await expect(
      page.getByText(
        '보안 연결(https)이 아니라 예약할 수 없어요. 사이트 주소로 다시 접속해 주세요.',
      ),
    ).toBeVisible()
    await expect(queueDialog(page)).toHaveCount(0)
    expect(queueRequests).toEqual([])
  })

  test('A15 접수 키를 만들 수 없으면(crypto.subtle 없음) 100%에서 멈추지 않고 알린다', async ({
    page,
  }) => {
    // 내부망 http 주소(http://192.168.x.x)로 열면 crypto.subtle이 없다.
    await page.addInitScript(() =>
      Object.defineProperty(Crypto.prototype, 'subtle', {
        get: () => undefined,
      }),
    )
    await joinMacbookQueue(page)

    await expect(
      page.getByText(
        '보안 연결(https)이 아니라 예약할 수 없어요. 사이트 주소로 다시 접속해 주세요.',
      ),
    ).toBeVisible({ timeout: 30_000 })
    await expect(queueDialog(page)).toBeHidden()
    await expect(queuePill(page)).toHaveCount(0)
    await expect(page).toHaveURL(`/preorder/${TODAY_PROMOTION}`)
  })
})

test.describe('B. 기다리는 중', () => {
  test('B4·B5 창을 닫으면 순번 알약이 뜨고 다른 페이지로 가도 따라온다', async ({
    page,
  }) => {
    await joinMacbookQueue(page)
    await closeQueueDialog(page)
    await expect(queuePill(page)).toBeVisible()

    await page.getByRole('link', { name: '모바일' }).first().click()
    await expect(page).toHaveURL(/\/search/)
    await expect(queuePill(page)).toBeVisible()
  })

  test('B7 나가기를 확인하면 대기열 창과 알약이 사라진다', async ({ page }) => {
    await joinMacbookQueue(page)
    await queueDialog(page)
      .getByRole('button', { name: '대기열 나가기' })
      .click()
    await page.getByRole('button', { name: '나가기', exact: true }).click()

    await expect(queueDialog(page)).toBeHidden()
    await expect(queuePill(page)).toHaveCount(0)
  })

  test('B8 순번 조회가 잠깐 실패하면 안내하고, 회복되면 안내를 거둔다', async ({
    page,
  }) => {
    await joinMacbookQueue(page)
    await setMockFault(page, 'queue')
    const unstable = page.getByText('연결이 불안정해 다시 확인하고 있어요.')
    await expect(unstable).toBeVisible({ timeout: 15_000 })

    await setMockFault(page, null)
    await expect(unstable).toBeHidden({ timeout: 45_000 })
  })

  test('B13 창을 닫아 둔 채 차례가 오면 알약이 이동까지 남은 초를 세고 상품으로 간다', async ({
    page,
  }) => {
    await joinMacbookQueue(page)
    await closeQueueDialog(page)

    await expect(page.getByText(/\d초 뒤 이동/)).toBeVisible({
      timeout: 45_000,
    })
    await expect(page).toHaveURL(`/products/${MACBOOK_PRO_14}`)
  })
})

test.describe('C. 입장권을 받은 뒤', () => {
  test('C1 상품 페이지에서 새로고침해도 남은 시간이 이어지고 그대로 접수된다', async ({
    page,
  }) => {
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    await page.reload()

    await expect(page.getByText(/안에 사전예약을 눌러 주세요/)).toBeVisible()
    await preorderSubmitButton(page).click()
    await expect(page).toHaveURL(/\/(payment|result)\?/, { timeout: 15_000 })
  })

  test('C2 입장권 시간이 지나면 알리고, 그 자리에서 다시 줄을 세운다', async ({
    page,
  }) => {
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    await page.clock.fastForward(125_000)

    await expect(page.getByText(/예약 가능 시간이 지났어요/)).toBeVisible()
    await page.getByRole('button', { name: '다시 줄 서기' }).click()
    await expect(queueDialog(page)).toBeVisible()
    await expect(page).toHaveURL(`/products/${MACBOOK_PRO_14}`)
  })

  test('C3 새 창에는 입장권이 없어 사전예약 페이지로 보낸다', async ({
    page,
    context,
  }) => {
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    const other = await context.newPage()
    await other.clock.install({ time: kstToday('10:00:30') })
    await other.goto(`/products/${MACBOOK_PRO_14}`)
    await preorderSubmitButton(other).click()

    await expect(other.getByText(NEED_QUEUE)).toBeVisible()
    await expect(other).toHaveURL('/preorder')
  })

  test('C4 다른 상품 페이지에서 사전예약하기를 누르면 사전예약 페이지로 보낸다', async ({
    page,
  }) => {
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    await page.goto(`/products/${NOVA_FOLDABLE_3}`)
    await preorderSubmitButton(page).click()

    await expect(page.getByText(NEED_QUEUE)).toBeVisible()
    await expect(page).toHaveURL('/preorder')
  })
})

test.describe('D. 접수', () => {
  test('D5 입장권이 무효면 다시 입장하라고 알리고, 다음에 누를 땐 줄부터 서게 한다', async ({
    page,
  }) => {
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    await page.evaluate(() => {
      const admission = JSON.parse(
        sessionStorage.getItem('preorder_admission') ?? '{}',
      )
      sessionStorage.setItem(
        'preorder_admission',
        JSON.stringify({ ...admission, admissionTicket: 'et_invalid' }),
      )
    })
    await page.reload()
    await preorderSubmitButton(page).click()
    await expect(page.getByText('대기열에 다시 입장해 주세요.')).toBeVisible()

    await preorderSubmitButton(page).click()
    await expect(page).toHaveURL('/preorder')
  })

  test('D12 접수 뒤 결제 화면에서 나갔다가 다시 들어오면, 그 모델은 예약하기 대신 구매 확정하기로 보이고 기존 예약의 결제로 간다', async ({
    page,
  }) => {
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    await preorderSubmitButton(page).click()
    await confirmPreorder(page)
    const firstPreorderId = new URL(page.url()).searchParams.get('preorderId')

    // 결제하지 않고 나갔다가 사전예약 시트를 다시 연다 — 서버는 회원·모델마다 예약 하나라 다시 예약할 수 없다.
    await page.goto(`/preorder/${TODAY_PROMOTION}`)
    await page.getByRole('button', { name: '사전예약 하러가기' }).click()
    const macbookRow = page
      .getByRole('dialog', { name: '사전예약' })
      .locator('div')
      .filter({ hasText: '맥북 프로 14' })
      .filter({ has: page.getByRole('button') })
      .last()
    await expect(
      macbookRow.getByRole('button', { name: '구매 확정하기' }),
    ).toBeVisible()
    await macbookRow.getByRole('button', { name: '구매 확정하기' }).click()

    await expect(page).toHaveURL(`/payment?preorderId=${firstPreorderId}`)
    await expect(queueDialog(page)).toBeHidden()
  })

  test('D13 목록 카드에서 이미 예약한 모델을 누르면 줄을 서지 않고 상품 페이지로 가서 알린다', async ({
    page,
  }) => {
    await page.goto(`/search?category=${encodeURIComponent('모바일')}`)
    await page
      .getByRole('link', { name: /NOVA 폴더블 1/ })
      .first()
      .click()

    await expect(page.getByText('이미 예약한 모델이에요.')).toBeVisible()
    await expect(page).toHaveURL(`/products/${NOVA_FOLDABLE_1}`)
    await expect(
      page.getByRole('button', { name: '구매 확정하기' }).first(),
    ).toBeVisible()
  })

  test.fail(
    'D3 응답을 못 받은 뒤 입장권 시간이 지나도, 다시 누르면 같은 키로 재전송한다(명세: 만료 후 10분까지)',
    async ({ page }) => {
      const submits = collectPreorderSubmits(page)
      await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
      await setMockFault(page, 'all')
      await preorderSubmitButton(page).click()
      await expect.poll(() => submits.length).toBe(1)

      await page.clock.fastForward(125_000)
      await setMockFault(page, null)
      await preorderSubmitButton(page).click()

      // 지금은 만료로 보고 그 자리에서 다시 줄을 세워 재전송이 나가지 않는다.
      await expect.poll(() => submits.length, { timeout: 5_000 }).toBe(2)
      expect(submits[1].idempotencyKey).toBe(submits[0].idempotencyKey)
    },
  )
})

test.describe('E. 여러 창', () => {
  test('E2 두 창이 같은 입장권을 받고 한 창이 접수하면, 다른 창은 같은 예약으로 이어진다', async ({
    page,
    context,
  }) => {
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)

    // 목 대기열은 창별 저장소라, 실서버의 "같은 회원은 같은 입장권"을 흉내 내려 대기열 상태만 넘긴다.
    // 입장권은 넘기지 않는다 — 창 2가 화면 흐름대로 같은 입장권을 직접 받는다.
    const { mock_waitingroom: queue } = await page.evaluate(
      () => ({ ...sessionStorage }) as Record<string, string>,
    )
    const other = await context.newPage()
    await other.clock.install({ time: kstToday('10:00:30') })
    await other.addInitScript((waitingroom) => {
      if (sessionStorage.getItem('e2e:seeded')) return
      sessionStorage.setItem('mock_waitingroom', waitingroom)
      sessionStorage.setItem('e2e:seeded', '1')
    }, queue)
    await other.goto(`/preorder/${TODAY_PROMOTION}`)
    await pressReserve(other, '맥북 프로 14')
    await expect(other).toHaveURL(`/products/${MACBOOK_PRO_14}`)

    // 창 1이 먼저 접수한다.
    await preorderSubmitButton(page).click()
    await confirmPreorder(page)
    const firstPreorderId = new URL(page.url()).searchParams.get('preorderId')

    // 창 2는 다시 볼 때 그 예약을 알아본다(목 예약 DB는 창마다 메모리라 새로고침으로 다시 읽힌다).
    await other.reload()
    await other.getByRole('button', { name: '구매 확정하기' }).first().click()
    await expect(other).toHaveURL(`/payment?preorderId=${firstPreorderId}`)
  })
})

test.describe('F. 접수 뒤', () => {
  test('F2 접수하면 결제로 바로 가지 않고, 예약 접수 화면이 처리 중에서 구매 확정 가능으로 바뀌는 걸 보여 준다', async ({
    page,
  }) => {
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    await preorderSubmitButton(page).click()
    await expect(page).toHaveURL(/\/result\?status=preorder&preorderId=/)

    // 접수(202)는 외부 등록을 기다리지 않는다 — 목은 접수 5초 뒤 등록이 끝난다.
    await expect(
      page.getByRole('heading', { name: '예약 순서를 확보했어요' }),
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: '예약 처리 중이에요' }),
    ).toBeDisabled()

    await expect(
      page.getByRole('heading', { name: '예약이 접수되었어요' }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByRole('button', { name: '지금 구매 확정하기' }),
    ).toBeEnabled()
    await expect(page.getByText('구매 확정 마감까지')).toBeVisible()
  })

  test('F6 주소의 예약 id가 틀리면 처리 중이라 하지 않고 불러오지 못했다고 알린다', async ({
    page,
  }) => {
    await page.goto(`/result?status=preorder&preorderId=${crypto.randomUUID()}`)

    await expect(
      page.getByRole('heading', { name: '예약을 불러오지 못했어요' }),
    ).toBeVisible({ timeout: 15_000 })
    await expect(
      page.getByRole('button', { name: '예약을 확인할 수 없어요' }),
    ).toBeDisabled()
  })

  test('F9 결제한 예약을 취소하면 환불을 안내하고 환불 중임을 보여 준다', async ({
    page,
  }) => {
    await stubDaumPostcode(page)
    await stubTossPayments(page)
    await passPreorderQueue(page, '맥북 프로 14', MACBOOK_PRO_14)
    await preorderSubmitButton(page).click()
    await confirmPreorder(page)
    await fillPaymentForm(page)
    await page.getByRole('button', { name: /결제하기$/ }).click()
    await expect(
      page.getByRole('heading', { name: '사전예약 구매가 완료되었어요' }),
    ).toBeVisible()

    await page.goto('/mypage?state=preorder-check')
    await page
      .getByRole('article')
      .filter({ hasText: '예약 순번 1,287번' })
      .getByRole('button', { name: '예약 취소' })
      .click()
    const confirm = page.getByRole('dialog', { name: '예약을 취소할까요?' })
    await expect(
      confirm.getByText(
        /결제한 금액은 환불되고, 환불이 끝나면 취소가 완료돼요/,
      ),
    ).toBeVisible()
    await confirm.getByRole('button', { name: '예약 취소' }).click()

    await expect(page.getByText(/결제한 금액을 환불하고 있어요/)).toBeVisible()
  })
})
