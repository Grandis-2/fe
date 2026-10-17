import { fn } from 'storybook/test'

import type { LogEntry } from '@shared/api/requestLog'

import { RequestMonitorPanel } from './RequestMonitor'

import type { Meta, StoryObj } from '@storybook/react-vite'

const NOW = new Date('2026-10-17T12:03:20').getTime()
const QUEUE = '/api/v1/preorders/queue?productId=1'

const request = (
  id: number,
  secondsAgo: number,
  status: number,
  extra: Partial<Extract<LogEntry, { kind: 'request' }>> = {},
): LogEntry => ({
  kind: 'request',
  id,
  startedAt: NOW - secondsAgo * 1000,
  endedAt: NOW - secondsAgo * 1000 + 120,
  method: 'GET',
  path: QUEUE,
  status,
  outcome: status < 400 ? 'ok' : 'fail',
  retryAfter: status < 400 ? 2 : 0,
  repeat: false,
  signature: `GET ${QUEUE} null`,
  ...extra,
})

const wait = (
  id: number,
  secondsAgo: number,
  failureCount: number,
  waitMs: number,
): LogEntry => {
  const minMs = 2000 * 2 ** failureCount
  return {
    kind: 'wait',
    id,
    startedAt: NOW - secondsAgo * 1000,
    waitMs,
    baseMs: 2000,
    failureCount,
    retryAfterMs: 0,
    minMs,
    maxMs: minMs * 1.5,
  }
}

// 순번 조회가 2초마다 성공하다가 503이 이어져 간격이 2→4→8초로 늘어나는 중.
const backingOff: LogEntry[] = [
  request(1, 40, 200),
  request(2, 37.8, 200),
  request(3, 35.6, 200),
  request(4, 33.4, 503),
  wait(5, 33.3, 0, 2600),
  request(6, 30.7, 503, { repeat: true }),
  wait(7, 30.6, 1, 4900),
  request(8, 25.7, 503, { repeat: true }),
  wait(9, 25.6, 2, 9300),
  request(10, 16.3, 503, { repeat: true }),
  wait(11, 16.2, 3, 19_800),
]

const meta = {
  component: RequestMonitorPanel,
  args: {
    entries: backingOff,
    now: NOW,
    fault: 'queue',
    onFault: fn(),
    onClear: fn(),
    onClose: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ padding: 24, background: '#0F1215' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RequestMonitorPanel>

export default meta
type Story = StoryObj<typeof meta>

export const BackingOff: Story = {}

// 결제 승인이 503이라 같은 내용으로 한 번 더 보내고, 그다음 주문 상태를 묻는다.
export const ConfirmResent: Story = {
  args: {
    fault: 'confirm',
    entries: [
      request(1, 12, 503, {
        method: 'POST',
        path: '/api/v1/orders/1/payment-attempts/t1/confirm',
        signature: 'POST confirm',
      }),
      request(2, 11.8, 503, {
        method: 'POST',
        path: '/api/v1/orders/1/payment-attempts/t1/confirm',
        signature: 'POST confirm',
        repeat: true,
      }),
      request(3, 8.7, 200, { path: '/api/v1/orders/1', retryAfter: 0 }),
    ],
  },
}

// 실서버에 붙어 있으면 [장애 내기]가 없다.
export const RealServer: Story = {
  args: { fault: undefined, entries: [] },
}
