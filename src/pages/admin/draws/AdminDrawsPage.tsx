import { useState } from 'react'

import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  drawPhaseColor,
  drawPhaseLabel,
  drawPhaseLabels,
  drawPhases,
  type AdminDraw,
  type AdminDrawPhase,
  useAdminDraws,
} from '@entities/admin-draw'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_DRAW_NEW_PATH, adminDrawPath } from '@shared/config/routes'
import { formatDotDateTime } from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { Button, SegmentedTabs, Table, Tag } from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminDrawsPage.css'

type PhaseFilter = AdminDrawPhase | 'all'

const phaseFilters: { value: PhaseFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  ...drawPhases.map((phase) => ({
    value: phase,
    label: drawPhaseLabel[phase],
  })),
]

const columns: TableColumn<AdminDraw>[] = [
  {
    key: 'title',
    header: '회차 제목',
    render: (draw) => <span className={styles.drawTitle}>{draw.title}</span>,
  },
  {
    key: 'gift',
    header: '증정품',
    render: (draw) => `${draw.gift.productTitle} · ${draw.gift.optionTitle}`,
  },
  {
    key: 'fee',
    header: '응모비',
    align: 'right',
    render: (draw) => formatWon(draw.entryFee),
  },
  {
    key: 'winners',
    header: '당첨 인원',
    align: 'right',
    render: (draw) => `${formatNumber(draw.winnerCount)}명`,
  },
  {
    key: 'period',
    header: '응모 기간',
    align: 'center',
    render: (draw) =>
      `${formatDotDateTime(draw.opensAt)} ~ ${formatDotDateTime(draw.closesAt)}`,
  },
  {
    key: 'phase',
    header: '단계',
    align: 'center',
    render: (draw) => (
      <Tag
        variant="subtle"
        size="medium"
        rounded={false}
        widthOptions={drawPhaseLabels}
        color={drawPhaseColor[draw.phase]}
      >
        {drawPhaseLabel[draw.phase]}
      </Tag>
    ),
  },
]

export function AdminDrawsPage() {
  const navigate = useNavigate()
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all')
  const draws = useAdminDraws()

  const visibleDraws = (draws.data ?? []).filter(
    (draw) => phaseFilter === 'all' || draw.phase === phaseFilter,
  )
  const openDetail = (draw: AdminDraw) => navigate(adminDrawPath(draw.drawId))

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>럭키드로우 관리</div>
        <Button
          icon={Plus}
          size="medium"
          onClick={() => navigate(ADMIN_DRAW_NEW_PATH)}
        >
          회차 만들기
        </Button>
      </div>

      <SegmentedTabs
        items={phaseFilters}
        value={phaseFilter}
        onChange={setPhaseFilter}
      />

      <Table
        columns={columns}
        rows={visibleDraws}
        rowKey={(draw) => draw.drawId}
        pageSize={10}
        onRowClick={openDetail}
        rowAction={{
          label: (draw) => `${draw.title} 진행 보기`,
          onClick: openDetail,
        }}
        loading={draws.isPending}
        emptyMessage={
          draws.isError
            ? getErrorMessage(draws.error, '회차를 불러오지 못했습니다.')
            : '조건에 맞는 회차가 없습니다.'
        }
      />
    </div>
  )
}
