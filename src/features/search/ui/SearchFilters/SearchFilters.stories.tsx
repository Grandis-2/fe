import { expect, userEvent } from 'storybook/test'

import { SearchFilters } from './SearchFilters'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  title: 'Features/Search/SearchFilters',
  component: SearchFilters,
  parameters: { dark: true },
} satisfies Meta<typeof SearchFilters>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// 헤더 메뉴의 브랜드 링크로 들어오면 그 브랜드가 골라져 있다.
export const Selected: Story = {
  parameters: {
    initialEntries: ['/search?category=모바일&brand=Apple&storage=256GB'],
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('button', { name: 'Apple' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await userEvent.click(canvas.getByRole('button', { name: '필터 초기화' }))
    await expect(canvas.getByRole('button', { name: 'Apple' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  },
}
