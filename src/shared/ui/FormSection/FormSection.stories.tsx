import { expect } from 'storybook/test'

import { Input } from '../Input'

import { FormSection } from './FormSection'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: FormSection,
  tags: ['ai-generated'],
} satisfies Meta<typeof FormSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: '프로모션 명',
    children: <Input label="프로모션 명" />,
  },
}

export const WithDescription: Story = {
  args: {
    title: '진행 기간',
    description: '프로모션 페이지가 보이는 기간입니다.',
    children: <Input label="기간" />,
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText('프로모션 페이지가 보이는 기간입니다.'),
    ).toBeVisible()
  },
}
