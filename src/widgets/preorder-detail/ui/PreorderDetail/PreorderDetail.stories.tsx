import { expect, within } from 'storybook/test'

import { useSessionStore } from '@entities/auth/model/sessionStore'
import type { Preorder } from '@entities/preorder'
import { useModalStore } from '@shared/model/modalStore'

import { PreorderPromotion } from './PreorderDetail'

import type { Meta, StoryObj } from '@storybook/react-vite'

// 상태는 오늘 날짜로 정해지므로 날짜를 오늘 기준으로 다시 잡는다.
const fromToday = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

// 화면 확인용 — 실제 응답엔 아직 혜택·결제 마감일이 없다(빈 값이면 섹션·단계를 뺀다).
const BASE: Preorder = {
  id: 'story',
  imageSrc: '/images/banner1.png',
  title: '아이폰 18 Pro · Pro Max',
  opensAt: '',
  openTime: '10:00',
  closesAt: '',
  benefits: [
    {
      title: '사전예약 시 맥세이프 케이스 증정',
      description: '사전예약 고객 전원에게 드려요.',
    },
    {
      title: '제휴 카드 최대 10만 원 할인',
      description: '제휴 카드로 일시불 또는 할부 결제 시 적용돼요.',
    },
  ],
  models: [
    {
      id: 'ip18p',
      name: '아이폰 18 Pro',
      imageSrc: '/images/banner1.png',
      price: 2278100,
      productId: '20000000-0000-4000-8000-000000000001',
    },
  ],
}

const withDates = ([open, close, payment, release]: [
  number,
  number,
  number,
  number,
]): Preorder => ({
  ...BASE,
  opensAt: fromToday(open),
  closesAt: fromToday(close),
  paymentEndsAt: fromToday(payment),
  releaseAt: fromToday(release),
})

const meta = {
  component: PreorderPromotion,
  tags: ['ai-generated'],
  parameters: { layout: 'fullscreen', dark: true },
} satisfies Meta<typeof PreorderPromotion>

export default meta
type Story = StoryObj<typeof meta>

// 모델 시트(BottomSheet)는 body에 포털로 그려져 canvas 밖에서 찾는다.
const body = within(document.body)

// 비회원이 예약하려 하면 시트 대신 로그인 모달을 연다(useRequireLogin).
export const Live: Story = {
  args: { preorder: withDates([-9, 5, 9, 12]) },
  beforeEach: () => {
    useSessionStore.getState().clearSession()
    return () => useModalStore.getState().close()
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '사전예약 하러가기' }),
    )
    await expect(useModalStore.getState().isOpen).toBe(true)
    await expect(useModalStore.getState().content?.title).toBe('로그인')
  },
}

// 회원은 시트에서 모델별 오픈 알림을 켠다.
export const Soon: Story = {
  args: { preorder: withDates([15, 28, 32, 35]) },
  beforeEach: () => {
    useSessionStore.setState({ sessionToken: 'story-session' })
    return () => useSessionStore.getState().clearSession()
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '오픈 알림 받기' }),
    )
    await userEvent.click(
      await body.findByRole('button', { name: '알림 받기' }),
    )
    const subscribed = await body.findByRole('button', { name: '신청됨' })
    await expect(subscribed).toHaveAttribute('aria-pressed', 'true')
  },
}

// 마감 후 일반 구매는 로그인 없이 시트가 열린다.
export const Done: Story = {
  args: { preorder: withDates([-34, -21, -18, -16]) },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '일반 구매하러 가기' }),
    )
    await expect(
      await body.findByText('구매할 모델을 선택해주세요.'),
    ).toBeVisible()
  },
}
