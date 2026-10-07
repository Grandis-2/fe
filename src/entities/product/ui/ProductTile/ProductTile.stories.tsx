import { color } from '@shared/config/theme'

import { ProductTile, ProductTileSkeleton } from './ProductTile'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ProductTile,
  tags: ['ai-generated'],
  decorators: [
    (Story) => (
      <div
        style={{
          width: '200px',
          padding: '16px',
          background: color.backgroundDark.base,
          color: color.text.inverse,
        }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    productId: 'MB-NEO',
    name: '맥북 네오',
    imageUrl: '/images/macbook_neo_sliver1.png',
    price: 1690000,
  },
} satisfies Meta<typeof ProductTile>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// 이미지가 없으면 빈 타일로 둔다.
export const WithoutImage: Story = { args: { imageUrl: null } }

export const Skeleton: Story = { render: () => <ProductTileSkeleton /> }
