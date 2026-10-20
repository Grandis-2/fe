import {
  drawStageOf,
  useAdminDrawProgress,
  type AdminDraw,
} from '@entities/admin-draw'
import { adminDrawPath } from '@shared/config/routes'

import { OpsTaskCard } from '../OpsTaskCard'

export type StuckDrawTaskProps = {
  draw: Pick<AdminDraw, 'drawId' | 'title' | 'opensAt' | 'closesAt'>
  /** 판정 기준 시각 — 부모가 정한 값을 써서 카드끼리 같은 순간으로 본다 */
  now: number
}

/**
 * 마감 뒤 결과가 나올 시간이 지났는데 반영이 안 된 회차면 카드를 그린다. 멈췄는지는
 * 회차마다 진행을 받아야 알 수 있어 회차 하나에 컴포넌트 하나를 둔다. 아니면 아무것도
 * 그리지 않는다.
 */
export function StuckDrawTask({ draw, now }: StuckDrawTaskProps) {
  // 진행은 한 번만 받는다 — 멈춘 회차는 저절로 풀리지 않고, 다시 보려면 홈을 새로 고친다.
  const { data: progress } = useAdminDrawProgress(draw.drawId, false)
  if (!progress || drawStageOf(draw, progress, now) !== 'STUCK') return null

  return (
    <OpsTaskCard
      level="check"
      title={`추첨 결과 지연 · ${draw.title}`}
      action={{ label: '회차 확인', to: adminDrawPath(draw.drawId) }}
    />
  )
}
