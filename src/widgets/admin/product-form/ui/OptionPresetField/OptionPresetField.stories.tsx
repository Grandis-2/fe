import { expect, fn } from 'storybook/test'

import { OPTION_PRESETS } from '@entities/admin-product'

import { OptionPresetField } from './OptionPresetField'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: OptionPresetField,
  tags: ['ai-generated'],
  args: { value: undefined, onSelect: fn() },
} satisfies Meta<typeof OptionPresetField>

export default meta
type Story = StoryObj<typeof meta>

/** 아직 고르지 않음 — 고르면 옵션이 깔린다는 안내가 보인다 */
export const Empty: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(/고르면 자주 쓰는 옵션이 깔립니다/),
    ).toBeVisible()
  },
}

/** 고른 종류가 그대로 보인다(Dropdown은 내부 상태가 없다) */
export const Selected: Story = {
  args: { value: OPTION_PRESETS[0] },
  play: async ({ canvas }) => {
    const [preset] = OPTION_PRESETS
    await expect(
      canvas.getByText(`${preset.category} · ${preset.name}`),
    ).toBeVisible()
  },
}
