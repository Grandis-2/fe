import { useState } from 'react'

import { Info } from 'lucide-react'
import { Link } from 'react-router'

import {
  formatDrawMonthDay,
  getDrawPhase,
  useDraws,
  type Draw,
  type DrawPhase,
} from '@entities/draw'
import { getErrorMessage } from '@shared/api/client'
import { drawPath } from '@shared/config/routes'
import {
  Chip,
  InlineAlert,
  Skeleton,
  SkeletonGroup,
  Tag,
  type TagProps,
} from '@shared/ui'

import * as styles from './MobileLuckyPanel.css'

const FILTERS: { value: 'ALL' | DrawPhase; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'OPEN', label: '응모 중' },
  { value: 'SCHEDULED', label: '오픈 예정' },
]

const phaseLabel: Record<DrawPhase, string> = {
  OPEN: '응모 중',
  SCHEDULED: '오픈 예정',
  CLOSED: '마감',
}

const phaseTagColor: Record<DrawPhase, TagProps['color']> = {
  OPEN: 'primary',
  SCHEDULED: 'yellow',
  CLOSED: 'gray',
}

export type MobileLuckyPanelProps = {
  /** 카드를 눌러 이동하면 메뉴를 닫는다. */
  onClose: () => void
}

// 모바일 메뉴의 LUCKY 탭 — 럭키드로우 회차를 단계(전체·응모 중·오픈 예정)별로 보여준다.
// 단계는 목록 페이지와 같은 규칙(시작·마감 시각)으로 나눈다.
export function MobileLuckyPanel({ onClose }: MobileLuckyPanelProps) {
  const [filter, setFilter] = useState<'ALL' | DrawPhase>('ALL')
  const { data, isPending, error } = useDraws()

  const visible: Draw[] = (data?.items ?? []).filter(
    (draw) => filter === 'ALL' || getDrawPhase(draw) === filter,
  )

  return (
    <>
      <div className={styles.filters} role="group" aria-label="럭키드로우 상태">
        {FILTERS.map(({ value, label }) => (
          <Chip
            key={value}
            selected={value === filter}
            onClick={() => setFilter(value)}
          >
            {label}
          </Chip>
        ))}
      </div>

      {error ? (
        <InlineAlert status="error" variant="big">
          {getErrorMessage(error, '럭키드로우를 불러오지 못했어요.')}
        </InlineAlert>
      ) : isPending ? (
        <SkeletonGroup className={styles.list}>
          {[0, 1].map((i) => (
            <Skeleton key={i} height={260} radius={18} />
          ))}
        </SkeletonGroup>
      ) : visible.length === 0 ? (
        <InlineAlert status="info" variant="big" icon={Info}>
          해당하는 럭키드로우가 없어요.
        </InlineAlert>
      ) : (
        <div className={styles.list}>
          {visible.map((draw) => {
            const phase = getDrawPhase(draw)
            return (
              <Link
                key={draw.drawId}
                to={drawPath(draw.drawId)}
                className={styles.card}
                onClick={onClose}
              >
                {draw.gift.imageUrl ? (
                  <img
                    src={draw.gift.imageUrl}
                    alt=""
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.image} />
                )}
                <div className={styles.texts}>
                  <Tag
                    color={phaseTagColor[phase]}
                    variant="subtle"
                    rounded={false}
                    className={styles.tag}
                  >
                    {phaseLabel[phase]}
                  </Tag>
                  <span className={styles.title}>{draw.title}</span>
                  <span className={styles.period}>
                    {formatDrawMonthDay(draw.opensAt)} ~{' '}
                    {formatDrawMonthDay(draw.closesAt)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </>
  )
}
