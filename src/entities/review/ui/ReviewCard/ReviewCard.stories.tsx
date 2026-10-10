import placeholderImage from '@shared/assets/macbook_neo_sliver1.png'

import { ReviewCard, type ReviewCardProps } from './ReviewCard'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ReviewCard,
  tags: ['ai-generated'],
} satisfies Meta<typeof ReviewCard>

export default meta
type Story = StoryObj<typeof meta>

const review: ReviewCardProps['review'] = {
  imageUrl: null,
  rating: 5,
  body: '좋아요',
  productTitle: '아이폰 17 Pro',
  optionTitle: '블랙 / 256GB',
  authorName: '김**',
  createdAt: '2026-07-02T05:00:00Z',
}

export const Default: Story = {
  args: { review },
}

export const WithThumbnail: Story = {
  args: { review: { ...review, imageUrl: placeholderImage } },
}

export const PartialRating: Story = {
  args: { review: { ...review, rating: 3 } },
}

export const LongText: Story = {
  args: {
    review: {
      ...review,
      body: '배송도 빠르고 포장도 꼼꼼했어요. 색상이 사진이랑 똑같고 화면도 정말 선명해서 만족합니다. 사전예약으로 받아서 더 기분 좋네요!',
    },
  },
}
