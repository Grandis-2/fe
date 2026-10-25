import { expect } from 'storybook/test'

import { FormSection } from '../FormSection'

import { FormToc } from './FormToc'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FormToc,
  tags: ['ai-generated'],
  args: {
    title: '이 상품의 정보',
    items: [
      { id: 'toc-basic', label: '기본 정보' },
      { id: 'toc-price', label: '가격' },
    ],
    children: (
      <div>
        <FormSection id="toc-basic" title="기본 정보">
          <div style={{ height: 800 }} />
        </FormSection>
        <FormSection id="toc-price" title="가격">
          <div style={{ height: 800 }} />
        </FormSection>
      </div>
    ),
  },
} satisfies Meta<typeof FormToc>

export default meta
type Story = StoryObj<typeof meta>

/** 누르면 주소의 #만 바꾸지 않고 그 섹션까지 스크롤한다 */
export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('link', { name: '가격' }))
    await expect(window.location.hash).not.toBe('#toc-price')
  },
}
