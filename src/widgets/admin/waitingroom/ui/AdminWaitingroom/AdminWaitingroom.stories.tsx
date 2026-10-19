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
  ({ maxWait = null }: { maxWait?: number | null } = {}) =>
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
      globalCredit: 150,
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
 * 입장 속도와 자리 지켜 주기 두 덩어리. 속도는 숫자를 넣어야 적용이 열리고, 넣으면 바꿨을 때
 * 맨 뒤 대기가 먼저 보인다. 상한에 닿은 상품엔 표시가 붙는다
 */
export const Default: Story = {
  decorators: [withData()],
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole('heading', { name: '입장 속도' }),
    ).toBeVisible()
    await expect(
      canvas.getByRole('heading', { name: '자리 지켜 주기' }),
    ).toBeVisible()
    // 최대 대기 시간은 칸이 없다.
    await expect(canvas.queryByText(/최대 대기 시간/)).toBeNull()

    const apply = canvas.getByRole('button', { name: '적용' })
    await expect(apply).toBeDisabled()
    const input = canvas.getByLabelText('바꿀 속도(명/초)')
    // 숫자만 받는다.
    await userEvent.type(input, '3a0')
    await expect(input).toHaveValue('30')
    await expect(apply).toBeEnabled()
    await expect(canvas.getByText(/바꾸면 · 맨 뒤 대기/)).toBeVisible()
    // 지금과 같은 값이면 적용할 게 없다.
    await userEvent.clear(input)
    await userEvent.type(input, '150')
    await expect(apply).toBeDisabled()

    const table = within(canvas.getByRole('table'))
    await expect(table.getByText('상한에 닿음')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: /4분 10초 · 기본/ }),
    ).toHaveAttribute('aria-pressed', 'true')
  },
}

/** 최대 대기 시간이 걸려 있을 때만 경고와 해제 버튼이 나온다(모두 받으므로) */
export const MaxWaitSet: Story = {
  decorators: [withData({ maxWait: 600 })],
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(/최대 대기 시간\(10분\)이 걸려 있어요/),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '제한 해제' }),
    ).toBeVisible()
  },
}
