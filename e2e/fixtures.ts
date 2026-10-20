import { test as base, expect } from '@playwright/test'

import type { Page } from '@playwright/test'

export { expect }

// 목 상품 id — fixtures/product.ts의 mockUuid(2, n). 순서가 바뀌면 같이 고친다.
export const productId = (n: number) =>
  `20000000-0000-4000-8000-${String(n).padStart(12, '0')}`
export const MACBOOK_PRO_14 = productId(1) // 사전예약(오늘 오픈)
export const NOVA_PHONE_1 = productId(2) // 일반 구매, 첫 옵션 실버 / 256GB

// 테스트마다 새 브라우저 컨텍스트라 localStorage가 비어 있다 — 처음 온 사용자로 취급돼
// 홈(/)이 온보딩으로 넘어가지 않게 본 것으로 둔다.
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      localStorage.setItem('nova:onboardingSeen', '1')
    })
    await use(page)
  },
})

export const PROFILE = {
  name: '김테스트',
  email: 'e2e@example.com',
  phoneNumber: '01012345678',
}

/**
 * 가입을 마친 회원으로 로그인한다. 목 인증 DB(nova-auth-mock-db)에 프로필을 미리 채워
 * 회원가입 화면을 건너뛴다 — 가입 흐름 자체는 login.spec.ts가 본다.
 * 회원 전용 경로(path)로 들어가면 홈으로 튕기며 로그인 모달이 뜨고, 로그인 뒤 그 경로로 돌아온다.
 * 공개 화면에서 시작하려면 로그인한 뒤 따로 이동한다.
 */
export async function loginAs(page: Page, path = '/mypage') {
  await page.addInitScript((profile) => {
    // 새로고침마다 다시 심으면 세션 기록을 지우므로 처음 한 번만.
    if (localStorage.getItem('nova-auth-mock-db')) return
    localStorage.setItem(
      'nova-auth-mock-db',
      JSON.stringify({
        sessions: [],
        refreshTokens: [],
        usedCodes: [],
        profile,
      }),
    )
  }, PROFILE)
  await page.goto(path)
  await page
    .getByRole('dialog', { name: '로그인' })
    .getByRole('button', { name: '카카오 로그인' })
    .click()
  await expect(page).toHaveURL(path)
}

/**
 * 토스 결제창 대신 바로 콜백으로 돌려보내는 가짜 SDK. 토스 SDK는 window.TossPayments가
 * 이미 있으면 스크립트를 받지 않고 그걸 쓴다.
 * 결제창에 넘긴 값은 sessionStorage 'e2e:toss-request'에 남긴다.
 * amountOverride를 주면 콜백 금액을 그 값으로 바꿔 보낸다(위조 확인용).
 */
export async function stubTossPayments(
  page: Page,
  { amountOverride }: { amountOverride?: number } = {},
) {
  await page.addInitScript((override) => {
    type PaymentRequest = {
      orderId: string
      orderName: string
      amount: { value: number }
      successUrl: string
    }
    const requestPayment = (request: PaymentRequest) => {
      sessionStorage.setItem('e2e:toss-request', JSON.stringify(request))
      const url = new URL(request.successUrl)
      url.searchParams.set('paymentKey', 'e2e_payment_key')
      url.searchParams.set('orderId', request.orderId)
      url.searchParams.set('amount', String(override ?? request.amount.value))
      location.href = url.toString()
      // 진짜 결제창처럼 페이지를 떠나므로 끝나지 않는다.
      return new Promise(() => {})
    }
    Object.assign(window, {
      TossPayments: () => ({ payment: () => ({ requestPayment }) }),
    })
  }, amountOverride ?? null)
}

export const readTossRequest = (page: Page) =>
  page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('e2e:toss-request') ?? 'null'),
  )

export const TEST_ADDRESS = {
  postcode: '06236',
  roadAddress: '서울 강남구 테헤란로 152',
}

/**
 * 다음 우편번호 검색 대신 버튼 하나를 그리는 가짜 스크립트. "테스트 주소 선택"을 누르면
 * TEST_ADDRESS를 고른 것으로 돌려준다.
 */
export async function stubDaumPostcode(page: Page) {
  await page.addInitScript((address) => {
    type Options = {
      oncomplete: (data: {
        zonecode: string
        roadAddress: string
        jibunAddress: string
        userSelectedType: 'R' | 'J'
      }) => void
    }
    class Postcode {
      options: Options
      constructor(options: Options) {
        this.options = options
      }
      open() {}
      embed(element: HTMLElement) {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = '테스트 주소 선택'
        button.onclick = () =>
          this.options.oncomplete({
            zonecode: address.postcode,
            roadAddress: address.roadAddress,
            jibunAddress: address.roadAddress,
            userSelectedType: 'R',
          })
        element.replaceChildren(button)
      }
    }
    Object.assign(window, { daum: { Postcode } })
  }, TEST_ADDRESS)
}

/** 요청 모니터의 [장애 내기]와 같다 — 고른 요청이 503으로 실패한다(탭을 닫을 때까지). */
export const setMockFault = (page: Page, fault: 'all' | 'queue' | 'confirm') =>
  page.evaluate((value) => sessionStorage.setItem('mock-fault', value), fault)
