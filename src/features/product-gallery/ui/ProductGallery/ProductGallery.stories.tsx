import macbook1 from '@shared/assets/macbook_neo_sliver1.png'
import macbook2 from '@shared/assets/macbook_neo_sliver2.png'

import { ProductGallery } from './ProductGallery'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: ProductGallery,
  decorators: [
    (Story) => (
      <div style={{ width: 600 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductGallery>

export default meta
type Story = StoryObj<typeof meta>

// 웹 폭에서는 슬라이더 밑에 미리보기가 보이고, 누르면 슬라이더가 그 이미지로 넘어간다.
export const Default: Story = {
  args: {
    images: [macbook1, macbook2],
    productName: 'MacBook Pro 14',
  },
}
