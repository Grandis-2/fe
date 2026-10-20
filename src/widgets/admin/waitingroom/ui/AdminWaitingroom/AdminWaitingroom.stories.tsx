import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, within } from 'storybook/test'

import { AdminWaitingroom } from './AdminWaitingroom'

import type { Meta, StoryObj } from '@storybook/react-vite'

const IPHONE = 'p-iphone'
const GALAXY = 'p-galaxy'

const setting = (value: number | null, source = 'DEFAULT') => ({
  value,
  source,
})

const product = (productId: string, waiting: number, credit: number) => ({
  productId,
  phase: 'OPEN',
  runtime: 'QUEUEING',
  waiting,
  credit,
  cap: 150,
  opensAt: '2026-10-08T05:00:00Z',
  closesAt: '2026-10-08T07:00:00Z',
})

// Storybook엔 MSW가 없어 조회가 실패한다 — 캐시를 미리 채워 값이 있는 화면을 본다.
const withData =
  ({
    maxWait = null,
    globalCredit = 150,
  }: { maxWait?: number | null; globalCredit?: number } = {}) =>
  (Story: () => React.ReactNode) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(['admin', 'waitingroom', 'status'], {
      nodeId: 'node-1',
      leaderNodeId: 'node-1',
      snapshotStale: false,
      snapshotAgeSeconds: 0,
      gateways: 2,
      globalCredit,
      brakeFactor: 1,
      maxWaitSeconds: maxWait,
      leaveGraceSeconds: 250,
      products: [product(IPHONE, 5920, 150), product(GALAXY, 2410, 0)],
    })
    queryClient.setQueryData(['admin', 'waitingroom', 'rates'], {
      globalCredit: setting(150),
      maxGlobalCredit: 1500,
      maxWaitSeconds: setting(maxWait, maxWait ? 'OPERATIONAL' : 'DEFAULT'),
      leaveGraceSeconds: setting(250),
      products: [
        { productId: IPHONE, cap: setting(150), queueLimit: null },
        { productId: GALAXY, cap: setting(150), queueLimit: null },
      ],
    })
    return (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    )
  }

const meta = {
  component: AdminWaitingroom,
  tags: ['ai-generated'],
  args: {
    productNames: new Map([
      [IPHONE, '아이폰 18 Pro'],
      [GALAXY, '갤럭시 S27'],
    ]),
  },
} satisfies Meta<typeof AdminWaitingroom>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 판정 줄 · 입장 속도 · 상품별 상한 · 오른쪽 설정. 속도는 숫자를 넣어야 적용이 열리고, 상한에
 * 닿은 상품엔 표시가 붙는다. 최대 대기 시간은 꺼져 있으면 꺼짐만 보인다
 */
export const Default: Story = {
  decorators: [withData()],
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: '대기열 관리' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('heading', { name: '입장 속도' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('heading', { name: '자리 지켜 주기' }),
    ).toBeVisible()
    await expect(canvas.getByText('꺼짐')).toBeVisible()

    const apply = canvas.getByRole('button', { name: '적용' })
    await expect(apply).toBeDisabled()
    const input = canvas.getByLabelText('바꿀 속도(명/초)')
    await userEvent.type(input, '3a0')
    await expect(input).toHaveValue('30')
    await expect(apply).toBeEnabled()
    await expect(canvas.getByText(/바꾸면 맨 뒤 대기/)).toBeVisible()

    const caps = within(
      canvas.getByRole('region', { name: '상품별 입장 상한' }),
    )
    await expect(caps.getByText(/상한에 닿음/)).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: /4분 10초 · 기본/ }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

/** 줄이 있는데 입장이 0이면 판정 줄이 입장 멈춤과 다시 열기를 보인다 */
export const Stopped: Story = {
  decorators: [withData({ globalCredit: 0 })],
  play: async ({ canvas }) => {
    const status = within(canvas.getByRole('region', { name: '지금 상태' }))
    // 맨 뒤 예상 대기 칸도 '입장 멈춤'이라 판정 제목(span)만 고른다.
    await expect(
      status.getByText('입장 멈춤', { selector: 'span' }),
    ).toBeVisible()
    await expect(
      status.getByRole('button', { name: '다시 열기' }),
    ).toBeVisible()
  },
}

/** 최대 대기 시간이 걸려 있으면 오른쪽 카드가 빨갛게 알리고 해제 버튼을 둔다 */
export const MaxWaitSet: Story = {
  decorators: [withData({ maxWait: 600 })],
  play: async ({ canvas }) => {
    await expect(canvas.getByText('켜짐 · 10분')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '제한 해제' }),
    ).toBeVisible()
  },
}
