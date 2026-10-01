import { expect, userEvent } from 'storybook/test'

import { Tag } from '@/shared/ui/Tag'

import { Table, type TableColumn, type TableProps } from './Table'

import type { Meta, StoryObj } from '@storybook/react-vite'

type Row = {
  id: string
  name: string
  type: string
  count: number
}

const rows: Row[] = [
  { id: '1', name: '모델 A', type: '사전 예약', count: 4 },
  { id: '2', name: '모델 B', type: '일반 판매', count: 2 },
]

const columns: TableColumn<Row>[] = [
  { key: 'name', header: '상품명', render: (row) => row.name },
  {
    key: 'type',
    header: '유형',
    align: 'center',
    render: (row) => (
      <Tag
        variant="subtle"
        size="medium"
        color={row.type === '사전 예약' ? 'primary' : 'gray'}
      >
        {row.type}
      </Tag>
    ),
  },
  {
    key: 'count',
    header: '옵션',
    align: 'center',
    render: (row) => `${row.count}종`,
  },
]

const meta = {
  component: Table,
  tags: ['ai-generated'],
} satisfies Meta<TableProps<Row>>

export default meta
type Story = StoryObj<TableProps<Row>>

export const Default: Story = {
  args: { columns, rows, rowKey: (row: Row) => row.id },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('table')).toBeVisible()
    await expect(canvas.getAllByRole('row')).toHaveLength(3) // 헤더 1 + 본문 2
    await expect(canvas.getByText('모델 A')).toBeVisible()
  },
}

export const Empty: Story = {
  args: { columns, rows: [], rowKey: (row: Row) => row.id },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('데이터가 없습니다.')).toBeVisible()
  },
}

const manyRows: Row[] = Array.from({ length: 23 }, (_, index) => ({
  id: `${index + 1}`,
  name: `상품 ${index + 1}`,
  type: index % 2 === 0 ? '사전 예약' : '일반 판매',
  count: (index % 4) + 1,
}))

/** pageSize를 주면 그만큼 끊어서 보여주고, 넘칠 때만 표 아래에 Navigator가 붙는다. */
export const Paginated: Story = {
  args: { columns, rows: manyRows, rowKey: (row: Row) => row.id, pageSize: 10 },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole('row')).toHaveLength(11) // 헤더 1 + 10
    await expect(canvas.getByText('상품 1')).toBeVisible()

    // 23개 / 10개 = 3페이지. 마지막 페이지는 3개만 남는다.
    await userEvent.click(canvas.getByRole('button', { name: 'last page' }))
    await expect(canvas.getAllByRole('row')).toHaveLength(4)
    await expect(canvas.getByText('상품 21')).toBeVisible()
  },
}

/** 행이 pageSize 이하면 Navigator 자체가 나오지 않는다. */
export const WithoutPagination: Story = {
  args: { columns, rows, rowKey: (row: Row) => row.id, pageSize: 10 },
  play: async ({ canvas }) => {
    await expect(canvas.queryByLabelText('pagination')).toBeNull()
  },
}
