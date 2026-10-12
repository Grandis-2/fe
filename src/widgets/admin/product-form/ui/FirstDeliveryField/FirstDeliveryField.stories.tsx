import { expect, fn, userEvent } from 'storybook/test'

import { FirstDeliveryField } from './FirstDeliveryField'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FirstDeliveryField,
  tags: ['ai-generated'],
  args: { onChange: fn(), onEditDispatchWindow: fn() },
} satisfies Meta<typeof FirstDeliveryField>

export default meta
type Story = StoryObj<typeof meta>

/** 등록할 때는 날짜를 고른다. 안 고르면 미정이다. */
export const Editable: Story = {
  args: { editable: true, value: '' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent('미정')
  },
}

export const EditablePicked: Story = {
  args: { editable: true, value: '2026-09-20' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button')).toHaveTextContent(
      '2026년 9월 20일 (일)',
    )
  },
}

/**
 * 등록 뒤에는 고를 수 없다 — 차수 저장이 전체 덮어쓰기라 여기서 1차만 고치면
 * 2차 이후가 지워진다. 어디서 고치는지 알려주고 그 탭으로 보낸다.
 */
export const Locked: Story = {
  args: { editable: false, value: '2026-09-20' },
  play: async ({ canvas, args }) => {
    await expect(canvas.queryByRole('button', { name: /미정/ })).toBeNull()
    await expect(canvas.getByText(/배송 차수 수정이/)).toBeVisible()

    await userEvent.click(
      canvas.getByRole('button', { name: '배송 구간 설정으로 이동' }),
    )
    await expect(args.onEditDispatchWindow).toHaveBeenCalled()
  },
}

/** 이동 버튼은 콜백을 받았을 때만 나온다 — 등록 화면 등에서는 갈 곳이 없다. */
export const LockedWithoutLink: Story = {
  args: { editable: false, value: '', onEditDispatchWindow: undefined },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/배송 차수 수정이/)).toBeVisible()
    await expect(canvas.queryAllByRole('button')).toHaveLength(0)
  },
}
