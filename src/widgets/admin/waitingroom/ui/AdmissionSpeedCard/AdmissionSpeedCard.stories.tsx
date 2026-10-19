import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect, fn } from 'storybook/test'

import { AdmissionSpeedCard } from './AdmissionSpeedCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const view = (brakeFactor = 1) => ({
  nodeId: 'node-1',
  leaderNodeId: 'node-1',
  snapshotStale: false,
  snapshotAgeSeconds: 0,
  gateways: 2,
  globalCredit: Math.round(150 * brakeFactor),
  brakeFactor,
  maxWaitSeconds: null,
  leaveGraceSeconds: 250,
  products: [
    {
      productId: 'p-iphone',
      phase: 'OPEN' as const,
      runtime: 'QUEUEING' as const,
      waiting: 3000,
      credit: 150,
      cap: 150,
      opensAt: '2026-10-08T05:00:00Z',
      closesAt: '2026-10-08T07:00:00Z',
    },
  ],
})

// Storybook엔 MSW가 없어 집계 조회가 실패한다 — 새 QueryClient로 감싸 재시도만 끈다.
const withClient = (Story: () => React.ReactNode) => (
  <QueryClientProvider
    client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
  >
    <Story />
  </QueryClientProvider>
)

const meta = {
  component: AdmissionSpeedCard,
  tags: ['ai-generated'],
  decorators: [withClient],
  args: {
    view: view(),
    loading: false,
    globalSetting: { value: 150, source: 'DEFAULT' },
    maxCredit: 1500,
    refreshInterval: false,
    admission: { apply: fn(), confirm: fn(), isPending: false, error: null },
  },
} satisfies Meta<typeof AdmissionSpeedCard>

export default meta
type Story = StoryObj<typeof meta>

/**
 * 숫자만 받고, 지금 값과 다른 올바른 값일 때만 적용이 열린다. 넣으면 바꿨을 때의 맨 뒤 대기를
 * 먼저 보인다
 */
export const TypeToApply: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const apply = canvas.getByRole('button', { name: '적용' })
    await expect(apply).toBeDisabled()
    const input = canvas.getByLabelText('바꿀 속도(명/초)')
    await userEvent.type(input, '3a0')
    await expect(input).toHaveValue('30')
    await expect(canvas.getByText(/바꾸면 · 맨 뒤 대기/)).toBeVisible()
    await userEvent.click(apply)
    await expect(args.admission.apply).toHaveBeenCalledWith(
      { kind: 'globalCredit', value: 30 },
      '전역 입장 속도를 바꿨습니다.',
      expect.any(Function),
    )
    // 지금과 같은 값이면 적용할 게 없다.
    await userEvent.clear(input)
    await userEvent.type(input, '150')
    await expect(apply).toBeDisabled()
  },
}

/** 범위를 넘으면 칸 아래에 알리고 적용을 막는다 */
export const OutOfRange: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText('바꿀 속도(명/초)'), '9999')
    await expect(canvas.getByText(/1~1,500 사이로/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: '적용' })).toBeDisabled()
  },
}

/** 브레이크가 걸리면 판정이 원인부터 보라고 하고 칩이 붙는다 */
export const Braking: Story = {
  args: { view: view(0.5) },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/원인부터 보세요/)).toBeVisible()
    await expect(canvas.getByText(/브레이크 0.5×/)).toBeVisible()
  },
}

/** 운영값이면 기본값으로 되돌리기가 보이고, 입장 멈춤은 언제나 확인을 거친다 */
export const Operational: Story = {
  args: { globalSetting: { value: 300, source: 'OPERATIONAL' } },
  play: async ({ canvas, args, userEvent }) => {
    await expect(
      canvas.getByRole('button', { name: '기본값으로' }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '입장 멈춤' }))
    await expect(args.admission.confirm).toHaveBeenCalled()
  },
}

export const Loading: Story = { args: { loading: true, view: undefined } }
