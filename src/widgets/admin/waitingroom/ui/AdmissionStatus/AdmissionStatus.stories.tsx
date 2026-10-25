import { expect, fn } from 'storybook/test'

import { AdmissionStatus } from './AdmissionStatus'

import type { AdmissionSignals } from '../../lib/admissionSignals'
import type { Meta, StoryObj } from '@storybook/react-vite'

const signals: AdmissionSignals = {
  at: 60_000,
  coveredSeconds: 30,
  received: 40,
  processed: 30,
  backlog: 820,
  backlogPerMinute: 600,
  judged: true,
  judgedInSeconds: 0,
  congested: true,
}

const flow = {
  waiting: 9600,
  admitting: 40,
  signals,
  verdict: {
    kind: 'congested' as const,
    tone: 'warning' as const,
    title: '외부 등록이 밀리고 있어요',
    hint: '접수가 처리보다 초당 10건 빨라요 · 낮추세요',
  },
}

const meta = {
  component: AdmissionStatus,
  tags: ['ai-generated'],
  args: { flow, loading: false },
} satisfies Meta<typeof AdmissionStatus>

export default meta
type Story = StoryObj<typeof meta>

/** 밀리는 중 — 판정 한 문장, 숫자 넷, 외부 등록 대기의 분당 변화 */
export const Congested: Story = {
  args: { action: { label: '속도 낮추기', onClick: fn() } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('외부 등록이 밀리고 있어요')).toBeVisible()
    await expect(canvas.getByText('외부 등록 대기')).toBeVisible()
    await expect(canvas.getByText('분당 +600건')).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: '속도 낮추기' }),
    ).toBeVisible()
  },
}

export const Following: Story = {
  args: {
    flow: {
      ...flow,
      admitting: 15,
      signals: {
        ...signals,
        received: 14,
        processed: 14,
        backlog: 7,
        backlogPerMinute: 0,
        congested: false,
      },
      verdict: {
        kind: 'following',
        tone: 'success',
        title: '외부 등록이 따라가고 있어요',
        hint: '들어온 만큼 바로 등록되고 있어요',
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('그대로')).toBeVisible()
  },
}

/** 입장이 멈추면 다시 열기가 붙는다 */
export const Stopped: Story = {
  args: {
    flow: {
      ...flow,
      admitting: 0,
      verdict: {
        kind: 'stopped',
        tone: 'danger',
        title: '입장 멈춤',
        hint: '9,600명이 기다리는데 아무도 못 들어가요',
      },
    },
    action: { label: '다시 열기', onClick: fn() },
  },
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '다시 열기' }))
    await expect(args.action?.onClick).toHaveBeenCalled()
  },
}

/** 화면을 막 열어 판단 전 */
export const Measuring: Story = {
  args: {
    flow: {
      ...flow,
      signals: {
        ...signals,
        received: null,
        processed: null,
        backlogPerMinute: null,
        judged: false,
        judgedInSeconds: 25,
        congested: false,
      },
      verdict: {
        kind: 'measuring',
        tone: 'muted',
        title: '재는 중',
        hint: '약 25초 뒤 외부 등록이 따라가는지 알려 드려요',
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('추세 재는 중')).toBeVisible()
  },
}

export const Loading: Story = { args: { loading: true } }
