import type { AdminDraw } from '@entities/admin-draw'
import { adminDrawPath } from '@shared/config/routes'

import { OpsTaskCard } from '../OpsTaskCard'

export type StuckDrawTaskProps = {
  /** 멈춘 회차 — 멈췄는지는 부모가 useStuckDraws로 가린다 */
  draw: Pick<AdminDraw, 'drawId' | 'title'>
}

/** 마감 뒤 결과가 나올 시간이 지났는데 반영이 안 된 회차의 할 일 카드 */
export function StuckDrawTask({ draw }: StuckDrawTaskProps) {
  return (
    <OpsTaskCard
      level="check"
      title={`추첨 결과 지연 · ${draw.title}`}
      action={{ label: '회차 확인', to: adminDrawPath(draw.drawId) }}
    />
  )
}
