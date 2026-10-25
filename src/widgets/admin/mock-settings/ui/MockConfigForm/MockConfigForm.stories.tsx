import { expect, fn } from 'storybook/test'

import { MockConfigForm } from './MockConfigForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const config = {
  registerLatencyMs: 500,
  latencyJitter: 0.4,
  latencyTailRate: 0,
  latencyTailMinMs: 0,
  latencyTailMaxMs: 0,
  bodyLatencyMs: 500,
  failureRate: 0.05,
  failureMode: 'HTTP_5XX' as const,
  mixedResponses: [],
  configVersion: 3,
  appliedAt: '2026-10-11T04:50:12.031Z',
  timeoutHoldMs: 7000,
  workerReadTimeoutMs: 5000,
}

const meta = {
  component: MockConfigForm,
  tags: ['ai-generated'],
  args: { config, onSave: fn() },
} satisfies Meta<typeof MockConfigForm>

export default meta
type Story = StoryObj<typeof meta>

/** 지금 값으로 채워지고, 비율은 %로 받아 0~1로 보낸다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByLabelText('일시 실패 확률(%)')).toHaveValue(5)
    const latency = canvas.getByLabelText('평균 응답 시간(ms)')
    await userEvent.clear(latency)
    await userEvent.type(latency, '800')
    await userEvent.click(canvas.getByRole('button', { name: '팀에 적용' }))
    await expect(args.onSave).toHaveBeenCalledWith({
      registerLatencyMs: 800,
      failureRate: 0.05,
      failureMode: 'HTTP_5XX',
    })
  },
}

/** 꼬리를 켜면 세 칸을 함께 보내고, 평균을 넘는 꼬리는 막는다 */
export const Tail: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('switch', { name: /느린 꼬리/ }))
    await userEvent.clear(canvas.getByLabelText('걸릴 확률(%)'))
    await userEvent.type(canvas.getByLabelText('걸릴 확률(%)'), '50')
    await userEvent.clear(canvas.getByLabelText('최소(ms)'))
    await userEvent.type(canvas.getByLabelText('최소(ms)'), '2000')
    await userEvent.clear(canvas.getByLabelText('최대(ms)'))
    await userEvent.type(canvas.getByLabelText('최대(ms)'), '4000')
    await expect(
      canvas.getByRole('button', { name: '팀에 적용' }),
    ).toBeDisabled()

    await userEvent.clear(canvas.getByLabelText('걸릴 확률(%)'))
    await userEvent.type(canvas.getByLabelText('걸릴 확률(%)'), '2')
    await userEvent.click(canvas.getByRole('button', { name: '팀에 적용' }))
    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        latencyTailRate: 0.02,
        latencyTailMinMs: 2000,
        latencyTailMaxMs: 4000,
      }),
    )
  },
}

/** 저장 중엔 다시 누를 수 없다 */
export const Saving: Story = {
  args: { saving: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '저장 중…' }),
    ).toBeDisabled()
  },
}
