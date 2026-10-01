import placeholderImage from '@/shared/assets/macbook_neo_sliver1.png'

import { ReviewCard } from './ReviewCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReviewCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof ReviewCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    rating: 5,
    reviewText: '좋아요',
    productName: '아이폰 17 Pro',
    maskedAuthorName: '김**',
    date: '2026.07.02',
  },
}

export const WithThumbnail: Story = {
  args: { ...Default.args, thumbnailSrc: placeholderImage },
}

export const PartialRating: Story = {
  args: { ...Default.args, rating: 3 },
}

export const LongText: Story = {
  args: {
    ...Default.args,
    reviewText:
      '배송도 빠르고 포장도 꼼꼼했어요. 색상이 사진이랑 똑같고 화면도 정말 선명해서 만족합니다. 사전예약으로 받아서 더 기분 좋네요!',
  },
}
