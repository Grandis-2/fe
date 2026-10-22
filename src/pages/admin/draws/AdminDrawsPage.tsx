import { useState } from 'react'

import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router'

import {
  drawPhaseColor,
  drawPhaseLabel,
  drawPhases,
  drawPhaseVariant,
  drawTimingOf,
  type AdminDraw,
  type AdminDrawPhase,
  useAdminDraws,
} from '@entities/admin-draw'
import { getErrorMessage } from '@shared/api/client'
import { ADMIN_DRAW_NEW_PATH, adminDrawPath } from '@shared/config/routes'
import { formatShortDateTime } from '@shared/lib/formatDotDate'
import { formatNumber, formatWon } from '@shared/lib/formatNumber'
import { useNow } from '@shared/lib/useNow'
import {
  Button,
  ImageWithFallback,
  SegmentedTabs,
  Table,
  Tag,
} from '@shared/ui'
import type { TableColumn } from '@shared/ui'

import * as styles from './AdminDrawsPage.css'

type PhaseFilter = AdminDrawPhase | 'all'

// 남은 시간("7시간 뒤 마감")을 열어 둔 채로도 맞게 — 분 단위라 1분마다 다시 그린다.
const NOW_TICK_MS = 60_000

export function AdminDrawsPage() {
  const navigate = useNavigate()
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>('all')
  const draws = useAdminDraws()
  const now = useNow(NOW_TICK_MS).getTime()

  const all = draws.data ?? []
  const visibleDraws = all.filter(
    (draw) => phaseFilter === 'all' || draw.phase === phaseFilter,
  )
  const openDetail = (draw: AdminDraw) => navigate(adminDrawPath(draw.drawId))

  // 회차를 전부 받아 와서 탭 건수는 받은 목록으로 센다. 못 받았으면 숫자를 뺀다.
  const tabLabel = (label: string, count: number) => (
    <span className={styles.tabLabel}>
      {label}
      {draws.data && (
        <span className={styles.tabCount}>{formatNumber(count)}</span>
      )}
    </span>
  )
  const tabs = [
    { value: 'all' as const, label: tabLabel('전체', all.length) },
    ...drawPhases.map((phase) => ({
      value: phase,
      label: tabLabel(
        drawPhaseLabel[phase],
        all.filter((draw) => draw.phase === phase).length,
      ),
    })),
  ]

  const columns: TableColumn<AdminDraw>[] = [
    {
      key: 'draw',
      header: '회차',
      render: (draw) => (
        <span className={styles.drawCell}>
          <ImageWithFallback
            className={styles.thumb}
            src={draw.gift.imageUrl}
          />
          <span className={styles.stacked}>
            <span className={styles.mainText}>{draw.title}</span>
            <span className={styles.subText}>
              {draw.gift.productTitle} · {draw.gift.optionTitle}
            </span>
          </span>
        </span>
      ),
    },
    // 기간 아래에 지금 기준 남은 시간 — 곧 마감이면 빨갛게.
    {
      key: 'period',
      header: '응모 기간',
      render: (draw) => {
        const timing = drawTimingOf(draw, now)
        return (
          <span className={styles.stacked}>
            <span className={styles.cellText}>
              {formatShortDateTime(draw.opensAt)} ~{' '}
              {formatShortDateTime(draw.closesAt)}
            </span>
            <span className={timing.soon ? styles.subTextSoon : styles.subText}>
              {timing.text}
            </span>
          </span>
        )
      },
    },
    {
      key: 'fee',
      header: '응모비',
      align: 'right',
      render: (draw) => (
        <span className={styles.cellText}>{formatWon(draw.entryFee)}</span>
      ),
    },
    {
      key: 'winners',
      header: '당첨',
      align: 'right',
      render: (draw) => (
        <span className={styles.cellText}>
          {formatNumber(draw.winnerCount)}명
        </span>
      ),
    },
    {
      key: 'phase',
      header: '단계',
      render: (draw) => (
        <Tag
          variant={drawPhaseVariant[draw.phase]}
          size="medium"
          rounded={false}
          color={drawPhaseColor[draw.phase]}
        >
          {drawPhaseLabel[draw.phase]}
        </Tag>
      ),
    },
  ]

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <h1 className={styles.title}>럭키드로우 관리</h1>
        <Button
          icon={Plus}
          size="medium"
          onClick={() => navigate(ADMIN_DRAW_NEW_PATH)}
        >
          회차 만들기
        </Button>
      </header>

      <SegmentedTabs
        items={tabs}
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
