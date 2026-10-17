import { expect, fn } from 'storybook/test'

import { ColorOptionEditor } from './ColorOptionEditor'

import type { Meta, StoryObj } from '@storybook/react-vite'

const colors = [
  { id: 'c-1', name: '블랙', hex: '#111111', noColor: false, images: [] },
  { id: 'c-2', name: '실버', hex: '#C0C0C0', noColor: false, images: [] },
]

const meta = {
  component: ColorOptionEditor,
  tags: ['ai-generated'],
  args: {
    colors,
    onChange: fn(),
    noColorImages: [],
    onNoColorImagesChange: fn(),
  },
} satisfies Meta<typeof ColorOptionEditor>

export default meta
type Story = StoryObj<typeof meta>

/** 색상 이름을 고치면 그 색상만 바뀐 목록을 넘긴다 */
export const Default: Story = {
  play: async ({ canvas, args, userEvent }) => {
    const [first] = canvas.getAllByLabelText('색상 입력')
    await expect(first).toHaveValue('블랙')
    await userEvent.type(first, '1')
    await expect(args.onChange).toHaveBeenLastCalledWith([
      { ...colors[0], name: '블랙1' },
      colors[1],
    ])
  },
}

/** 색상을 지우면 그 색상이 빠진다 */
export const Remove: Story = {
  play: async ({ canvas, args, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: '색상 2 삭제' }))
    await expect(args.onChange).toHaveBeenCalledWith([colors[0]])
  },
}

/** 수정 화면 — 서버에 있는 색상은 지울 수 없다(지우는 API가 없다) */
export const Existing: Story = {
  args: { existingIds: new Set(['c-1']) },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole('button', { name: '색상 1 삭제' }),
    ).not.toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: '색상 2 삭제' }),
    ).toBeVisible()
  },
}
