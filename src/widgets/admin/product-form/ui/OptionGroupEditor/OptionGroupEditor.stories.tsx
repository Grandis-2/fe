import { expect, fn } from 'storybook/test'

import { OptionGroupEditor } from './OptionGroupEditor'

import type { Meta, StoryObj } from '@storybook/react-vite'

const groups = [
  {
    id: 'g-1',
    name: '용량',
    values: [
      { id: 'v-1', label: '256GB', extraPrice: 0 },
      { id: 'v-2', label: '512GB', extraPrice: 200000 },
    ],
  },
]

const meta = {
  component: OptionGroupEditor,
  tags: ['ai-generated'],
  args: { groups, onChange: fn() },
} satisfies Meta<typeof OptionGroupEditor>

export default meta
type Story = StoryObj<typeof meta>

/** 옵션을 더하면 빈 옵션 하나가 뒤에 붙는다 */
export const AddGroup: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await expect(canvas.getByDisplayValue('용량')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: '옵션 추가' }))
    await expect(args.onChange).toHaveBeenCalledWith([
      groups[0],
      expect.objectContaining({ name: '' }),
    ])
  },
}

/** 옵션 안에서 값을 더하면 그 옵션의 값만 늘어난다 */
export const AddValue: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(
      canvas.getByRole('button', { name: /옵션 타입 추가/ }),
    )
    await expect(args.onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'g-1',
        values: [...groups[0].values, expect.objectContaining({ label: '' })],
      }),
    ])
  },
}

/** 수정 화면 — 옵션 종류는 새로 만들거나 지울 수 없다 */
export const Existing: Story = {
  args: { existingIds: new Set(['g-1', 'v-1', 'v-2']) },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('button', { name: '옵션 추가' }),
    ).not.toBeInTheDocument()
    await expect(
      canvas.queryByRole('button', { name: '옵션 1 삭제' }),
    ).not.toBeInTheDocument()
  },
}
