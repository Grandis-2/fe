import {
  CircleCheck,
  CircleX,
  Info as InfoIcon,
  TriangleAlert,
} from 'lucide-react'

import { PlanetIcon as PlanetSvg } from '../PlanetIcon'

import { InlineAlert } from './InlineAlert'

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = {
  component: InlineAlert,
  tags: ['ai-generated'],
} satisfies Meta<typeof InlineAlert>

export default meta
type Story = StoryObj<typeof meta>

export const Info: Story = {
  args: { status: 'info', icon: InfoIcon, children: '알아두면 좋은 정보예요.' },
}

export const Warning: Story = {
  args: {
    status: 'warning',
    icon: TriangleAlert,
    children: '주의가 필요해요.',
  },
}

export const Error: Story = {
  args: { status: 'error', icon: CircleX, children: '문제가 발생했어요.' },
}

export const Success: Story = {
  args: { status: 'success', icon: CircleCheck, children: '완료됐어요.' },
}

export const PlanetIcon: Story = {
  args: {
    status: 'info',
    icon: PlanetSvg,
    children: '커스텀 아이콘도 쓸 수 있어요.',
  },
}

export const Big: Story = {
  args: {
    status: 'error',
    icon: CircleX,
    variant: 'big',
    children: '큰 박스는 어두운 페이지용이에요.',
  },
  parameters: { backgrounds: { default: 'dark' } },
}
