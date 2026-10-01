import { useState } from 'react'

import { expect, waitFor } from 'storybook/test'

import { Dropdown } from './Dropdown'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: Dropdown,
  tags: ['ai-generated'],
} satisfies Meta<typeof Dropdown>

export default meta
type Story = StoryObj<typeof meta>

const options = ['서울특별시', '경기도', '부산광역시']

export const Closed: Story = {
  args: { label: '지역 선택', options, open: false },
}

export const Open: Story = {
  args: { label: '지역 선택', options, open: true, selectedOption: '경기도' },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole('button', { name: '경기도', expanded: true }),
    ).toBeInTheDocument()
    await waitFor(() => expect(canvas.getByText('부산광역시')).toBeVisible())
  },
}

export const Interactive: Story = {
  args: { label: '지역 선택', options },
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    const [selectedOption, setSelectedOption] = useState<string | undefined>(
      undefined,
    )
    return (
      <Dropdown
        {...args}
        open={open}
        selectedOption={selectedOption}
        onToggle={() => setOpen((prev) => !prev)}
        onSelect={(option) => {
          setSelectedOption(option)
          setOpen(false)
        }}
      />
    )
  },
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: '지역 선택' })

    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(canvas.queryByText('부산광역시')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const busanOption = canvas.getByRole('button', { name: '부산광역시' })
    await waitFor(() => expect(busanOption).toBeVisible())

    await userEvent.click(busanOption)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toHaveTextContent('부산광역시')

    await expect(
      canvas.getAllByRole('button', { name: '부산광역시' }),
    ).toHaveLength(1)

    await userEvent.click(trigger)
    const buttonsAfterReopen = canvas.getAllByRole('button', {
      name: '부산광역시',
    })
    await expect(buttonsAfterReopen).toHaveLength(2)
    const reopenedOption = buttonsAfterReopen.find(
      (button) => button !== trigger,
    )
    await expect(reopenedOption).toHaveStyle({
      backgroundColor: 'rgb(232, 233, 245)',
    })
  },
}
