import { expect, fn } from 'storybook/test'

import { AdmissionStatus } from './AdmissionStatus'

import type { Meta, StoryObj } from '@storybook/react-vite'

const flow = {
  waiting: 18240,
  admitting: 120,
  processing: 160 as number | null,
  verdict: {
    tone: 'warning' as const,
    title: '한계에 가까워요',
    hint: '더 올리면 밀려요',
  },
}

const meta = {
  component: AdmissionStatus,
  tags: ['ai-generated'],
  args: { flow, loading: false },
} satisfies Meta<typeof AdmissionStatus>

export default meta
type Story = StoryObj<typeof meta>

/** 판정 한 문장과 숫자 넷 */
export const Tight: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('한계에 가까워요')).toBeVisible()
    await expect(canvas.getByText('약 3분')).toBeVisible()
    await expect(canvas.getByText('외부 등록 처리')).toBeVisible()
  },
}

export const Room: Story = {
  args: {
    flow: {
      ...flow,
      admitting: 80,
      verdict: { tone: 'success', title: '여유 있어요', hint: '올려도 돼요' },
    },
  },
}

/** 입장이 멈추면 다시 열기가 붙는다 */
export const Stopped: Story = {
  args: {
    flow: {
      ...flow,
      admitting: 0,
      verdict: {
        tone: 'danger',
        title: '입장 멈춤',
        hint: '18,240명이 기다리는데 아무도 못 들어가요',
      },
    },
    action: { label: '다시 열기', onClick: fn() },
  },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '다시 열기' }))
    await expect(args.action?.onClick).toHaveBeenCalled()
  },
}

/** 처리 속도를 아직 못 쟀다 */
export const Measuring: Story = {
  args: {
    flow: {
      ...flow,
      processing: null,
      verdict: {
        tone: 'muted',
        title: '재는 중',
        hint: '30초쯤 지나면 판단해요',
      },
    },
  },
}

export const Loading: Story = { args: { loading: true } }
