import { expect, fn } from 'storybook/test'

import { NumberSettingForm } from './NumberSettingForm'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: NumberSettingForm,
  tags: ['ai-generated'],
  args: {
    label: '전역 입장 속도',
    unit: '명/초',
    min: 0,
    max: 1500,
    initial: 150,
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof NumberSettingForm>

export default meta
type Story = StoryObj<typeof meta>

/** 지금 값이 채워져 있고, 바꾼 값을 숫자로 넘긴다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const input = canvas.getByLabelText('전역 입장 속도(명/초)')
    await expect(input).toHaveValue(150)
    await userEvent.clear(input)
    await userEvent.type(input, '300')
    await userEvent.click(canvas.getByRole('button', { name: '변경' }))
    await expect(args.onConfirm).toHaveBeenCalledWith(300)
  },
}

/** 범위를 벗어나면 확인을 막고 이유를 보인다 */
export const OutOfRange: Story = {
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('전역 입장 속도(명/초)')
    await userEvent.clear(input)
    await userEvent.type(input, '2000')
    await expect(canvas.getByRole('button', { name: '변경' })).toBeDisabled()
    await expect(
      canvas.getByText('0~1,500 사이의 정수로 적어 주세요.'),
    ).toBeVisible()
  },
}

/** 값이 없던 설정(제한 없음)은 빈 칸으로 시작해 확인이 막혀 있다 */
export const Empty: Story = {
  args: {
    label: '최대 대기 시간',
    unit: '초',
    min: 1,
    max: 86400,
    initial: null,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: '변경' })).toBeDisabled()
  },
}

/** 비교를 넘기면 올바른 값일 때 "지금 → 바꾸면"을 보인다 */
export const WithPreview: Story = {
  args: {
    preview: (value: number) => `바꾸면 초당 ${value}명`,
  },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByLabelText('전역 입장 속도(명/초)')
    await userEvent.clear(input)
    await userEvent.type(input, '120')
    await expect(canvas.getByText('바꾸면 초당 120명')).toBeVisible()
    await userEvent.clear(input)
    await userEvent.type(input, '2000')
    await expect(canvas.queryByText(/바꾸면/)).toBeNull()
  },
}
