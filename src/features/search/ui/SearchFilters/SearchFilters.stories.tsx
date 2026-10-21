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

// 카테고리 둘러보기면 맨 위에 하위 분류 줄이 붙는다 — 고르면 '전체'가 풀리고, 브랜드 필터는 그대로다.
export const SubCategory: Story = {
  args: { category: '모바일' },
  parameters: {
    initialEntries: ['/search?category=모바일&brand=Apple'],
  },
  play: async ({ canvas }) => {
    const all = canvas.getByRole('button', { name: '전체' })
    await expect(all).toHaveAttribute('aria-pressed', 'true')
    await userEvent.click(canvas.getByRole('button', { name: '스마트폰' }))
    await expect(
      canvas.getByRole('button', { name: '스마트폰' }),
    ).toHaveAttribute('aria-pressed', 'true')
    await expect(all).toHaveAttribute('aria-pressed', 'false')
    await expect(canvas.getByRole('button', { name: 'Apple' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  },
}
