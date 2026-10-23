import { BannerPreview } from './BannerPreview'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: BannerPreview,
  tags: ['ai-generated'],
} satisfies Meta<typeof BannerPreview>

export default meta
type Story = StoryObj<typeof meta>

/** 아직 아무것도 안 쓴 칸은 흐린 자리 표시로 보인다 */
export const Empty: Story = {
  args: {
    value: {
      badge: '',
      title: '',
      description: '',
      tabLabel: '',
      icon: null,
      image: [],
      imageAlt: '',
    },
  },
}

export const Filled: Story = {
  args: {
    value: {
      badge: '사전예약',
      title: 'Nova 1 Pro\n지금 사전예약',
      description: '가장 먼저 만나는 새 Nova',
      tabLabel: 'Nova 1 Pro 사전예약',
      icon: 'Smartphone',
      image: [],
      imageAlt: '',
    },
  },
}
