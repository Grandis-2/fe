import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { expect } from 'storybook/test'

import { AdminRecovery } from './AdminRecovery'

import type { Meta, StoryObj } from '@storybook/react-vite'

const open = { PENDING: 0, PROCESSING: 0, RETRY_SCHEDULED: 0, DEAD_LETTER: 0 }

// Storybook엔 MSW가 없어 조회가 실패한다 — 캐시를 미리 채워 값이 있는 화면을 본다.
const withFailures =
  (groups: { errorCode: string; count: number }[]) =>
  (Story: () => React.ReactNode) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    queryClient.setQueryData(['admin', 'reservations', 'stats', undefined], {
      productId: null,
      preorders: {
        PENDING_SYNC: 900,
        REGISTERED: 3000,
        RESERVED: 400,
        CANCELING: 0,
        CANCELED: 12,
      },
      syncJobs: {
        REGISTER: {
          ...open,
          DEAD_LETTER: groups.reduce((total, group) => total + group.count, 0),
        },
        CANCEL: open,
      },
      deadLetters: { waiting: 0, oldestWaitingAt: null },
      paymentOverdue: 0,
      oldestPendingSyncAt: null,
      countedAt: '2026-10-08T05:00:00Z',
    })
    queryClient.setQueryData(
      ['admin', 'reservations', 'sync-job-errors'],
      groups,
    )
    return (
      <QueryClientProvider client={queryClient}>
        <Story />
      </QueryClientProvider>
    )
  }

const meta = {
  component: AdminRecovery,
  tags: ['ai-generated'],
} satisfies Meta<typeof AdminRecovery>

export default meta
type Story = StoryObj<typeof meta>

/** 원인은 많은 순이고 기본으로 모두 골라져 있다. 하나를 빼면 보낼 건수가 줄어든다 */
export const PickCauses: Story = {
  decorators: [
    withFailures([
      { errorCode: 'TIMEOUT', count: 40 },
      { errorCode: 'HTTP_503', count: 820 },
    ]),
  ],
  play: async ({ canvas, userEvent }) => {
    const [first] = canvas.getAllByRole('checkbox')
    await expect(first.closest('label')).toHaveTextContent('HTTP_503')
    await expect(
      canvas.getByRole('button', { name: '860건 다시 보내기' }),
    ).toBeEnabled()

    await userEvent.click(canvas.getByRole('checkbox', { name: /TIMEOUT/ }))
    await expect(
      canvas.getByRole('button', { name: '820건 다시 보내기' }),
    ).toBeEnabled()
    await expect(canvas.getByText(/약 41초 걸려요/)).toBeVisible()

    // 속도를 올리면 예상 시간이 줄어든다.
    await userEvent.click(canvas.getByRole('button', { name: '초당 50건' }))
    await expect(canvas.getByText(/약 17초 걸려요/)).toBeVisible()
  },
}

/** 다시 보낼 실패가 없으면 안내만 하고 보내기를 막는다 */
export const NothingToSend: Story = {
  decorators: [withFailures([])],
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('지금 다시 보낼 외부 등록 실패가 없어요.'),
    ).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '0건 다시 보내기' }),
    ).toBeDisabled()
  },
}
