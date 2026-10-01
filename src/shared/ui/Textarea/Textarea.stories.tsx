import { expect } from 'storybook/test'

import { Textarea } from './Textarea'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Textarea,
  tags: ['ai-generated'],
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { label: '내부 메모', placeholder: '처리 메모를 남겨주세요.' },
  play: async ({ canvas }) => {
    // 화면에 보이는 제목은 호출부가 따로 두므로, 이름은 aria-label로만 붙는다.
    const field = canvas.getByRole('textbox', { name: '내부 메모' })
    await expect(field).toBeVisible()
    await expect(field).toHaveStyle({ backgroundColor: 'rgb(255, 255, 255)' })
  },
}

export const Small: Story = {
  args: { label: '처리 사유', size: 'small', placeholder: '예: 앱 오류' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toHaveStyle({
      borderRadius: '8px',
    })
  },
}

export const Typing: Story = {
  args: { label: '내부 메모' },
  play: async ({ canvas, userEvent }) => {
    const field = canvas.getByRole('textbox')
    await userEvent.type(field, '고객센터 요청으로 대리 접수')
    await expect(field).toHaveValue('고객센터 요청으로 대리 접수')
  },
}

export const Disabled: Story = {
  args: { label: '내부 메모', disabled: true, defaultValue: '수정 불가' },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('textbox')).toBeDisabled()
  },
}
