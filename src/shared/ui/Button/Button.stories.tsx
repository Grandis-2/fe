import { expect, waitFor } from 'storybook/test'

import { Button } from './Button'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Button,
  tags: ['ai-generated'],
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: '구매하기',
    color: 'primary',
    variant: 'solid',
    size: 'medium',
  },
}

export const Secondary: Story = {
  args: {
    children: '장바구니',
    color: 'secondary',
    variant: 'solid',
    size: 'medium',
  },
}

export const Cancel: Story = {
  args: { children: '취소', color: 'cancel', variant: 'solid', size: 'medium' },
}

export const Outline: Story = {
  args: {
    children: '자세히 보기',
    color: 'primary',
    variant: 'outline',
    size: 'medium',
  },
}

export const WithIcon: Story = {
  args: {
    children: '장바구니',
    color: 'primary',
    variant: 'solid',
    size: 'small',
    icon: 'shopping-cart',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '장바구니' })
    // size='small' -> icon size = spacing[16] = 16px
    await waitFor(() =>
      expect(button.querySelector('svg')).toHaveAttribute('width', '16px'),
    )
  },
}

export const IconSizes: Story = {
  args: {
    children: '장바구니',
    color: 'primary',
    variant: 'solid',
    size: 'medium',
    icon: 'shopping-cart',
  },
}

export const Small: Story = {
  args: { children: '담기', color: 'primary', variant: 'solid', size: 'small' },
}

export const Disabled: Story = {
  args: {
    children: '품절',
    color: 'primary',
    variant: 'solid',
    size: 'medium',
    disabled: true,
  },
}

// Exactly one CssCheck story for the whole project — proves the global theme
// import in .storybook/preview.tsx actually resolves the design tokens.
export const CssCheck: Story = {
  args: {
    children: '구매하기',
    color: 'primary',
    variant: 'solid',
    size: 'medium',
  },
  play: async ({ canvas }) => {
    const button = canvas.getByRole('button', { name: '구매하기' })
    // color.primary.base = #3F4891 (see
    // src/shared/config/theme/tokens/color/semantic.css.ts) once the theme module is loaded.
    await expect(getComputedStyle(button).backgroundColor).toBe(
      'rgb(63, 72, 145)',
    )
  },
}

export const Close: Story = {
  args: { children: '닫기', color: 'close', variant: 'solid', size: 'medium' },
  parameters: { backgrounds: { default: 'dark' } },
}
