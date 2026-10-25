import { expect, waitFor, within } from 'storybook/test'

import { useSessionStore } from '@entities/auth/model/sessionStore'
import type { Preorder } from '@entities/preorder'
import { products } from '@shared/api/mock/fixtures/product'
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
  openTime: '09:00',
  closesAt: '',
  closeTime: '23:59',
  detailImageSrcs: [],
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

// 관리자 미리보기 — 뒤로 가기가 없고 하단 버튼이 눌리지 않는다.
export const Preview: Story = {
  args: { preorder: withDates([-9, 5, 9, 12]), preview: true },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole('link', { name: /사전예약/ })).toBeNull()
    await expect(
      canvas.getByRole('button', { name: '사전예약 하러가기' }),
    ).toBeDisabled()
  },
}

// 회원은 시트에서 모델별 오픈 알림을 켠다.
// 알림 신청은 목 서버로 간다 — 목의 오픈 전 상품이어야 409 없이 신청된다.
const beforeOpenProduct = products.find(
  ({ campaign }) => campaign?.status === 'BEFORE_OPEN',
)!

export const Soon: Story = {
  args: {
    preorder: {
      ...withDates([15, 28, 32, 35]),
      models: [
        {
          ...BASE.models[0],
          id: beforeOpenProduct.productId,
          productId: beforeOpenProduct.productId,
        },
      ],
    },
  },
  beforeEach: () => {
    useSessionStore.setState({
      sessionToken: 'story-session',
      role: 'USER',
      profileComplete: true,
    })
    return () => useSessionStore.getState().clearSession()
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: '오픈 알림 받기' }),
    )
    const toggle = await body.findByRole('button', {
      name: '아이폰 18 Pro 오픈 알림',
    })
    await userEvent.click(toggle)
    await waitFor(() => expect(toggle).toHaveAttribute('aria-pressed', 'true'))
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

// 한 홍보에 모델끼리 예약 시간이 다르면 진행 일정의 사전예약 단계 아래에 모델별 기간이 붙는다.
export const ModelPeriods: Story = {
  args: {
    preorder: {
      ...withDates([0, 1, 9, 12]),
      openTime: '14:01',
      closeTime: '02:31',
      models: [
        {
          ...BASE.models[0],
          id: 'lt-0531',
          name: '[부하 시험] 무선 이어폰 LT 1020-0531 (진입)',
          opensAt: fromToday(0),
          openTime: '14:31',
          closeTime: '02:31',
        },
        {
          ...BASE.models[0],
          id: 'lt-0501',
          name: '[부하 시험] 무선 이어폰 LT 1020-0501 (준비)',
          opensAt: fromToday(0),
          openTime: '14:01',
          closeTime: '02:31',
        },
      ],
    },
  },
  play: async ({ canvas }) => {
    const schedule = within(
      canvas.getByRole('heading', { name: '진행 일정' }).parentElement!,
    )
    await expect(
      schedule.getByText('[부하 시험] 무선 이어폰 LT 1020-0531 (진입)'),
    ).toBeVisible()
  },
}

// 오픈 1시간 전부터 오픈까지 — 알림 신청은 닫히고, 시트의 예약하기는 보이지만 오픈 순간까지 막혀 있다.
const inMinutes = (minutes: number) => {
  const date = new Date(Date.now() + minutes * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    opensAt: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    openTime: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  }
}

export const BeforeOpen: Story = {
  args: {
    preorder: {
      ...withDates([0, 1, 9, 12]),
      ...inMinutes(30),
    },
  },
  beforeEach: () => {
    useSessionStore.setState({
      sessionToken: 'story-session',
      role: 'USER',
      profileComplete: true,
    })
    return () => useSessionStore.getState().clearSession()
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText('오픈까지')).toBeVisible()
    // 시트는 열리고, 그 안의 예약하기만 오픈 순간까지 막힌다.
    await userEvent.click(
      canvas.getByRole('button', { name: '사전예약 하러가기' }),
    )
    await expect(
      await body.findByRole('button', { name: '예약하기' }),
    ).toBeDisabled()
  },
}
