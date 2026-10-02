import { ProductColorSwatches } from './ProductColorSwatches'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ProductColorSwatches,
  tags: ['ai-generated'],
} satisfies Meta<typeof ProductColorSwatches>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    colorName: '미드나이트',
    size: 'small',
    colors: [
      { hex: '#1A1A1D', label: '미드나이트', selected: true },
      { hex: '#F5F5F0', label: '스타라이트', selected: false },
      { hex: '#3F4891', label: '코발트', selected: false },
    ],
  },
}

export const MediumInteractive: Story = {
  args: {
    colorName: '미드나이트',
    size: 'medium',
    colors: [
      { hex: '#1A1A1D', label: '미드나이트', selected: true },
      { hex: '#F5F5F0', label: '스타라이트' },
      { hex: '#3F4891', label: '코발트' },
    ],
    onSelect: () => {},
  },
}
