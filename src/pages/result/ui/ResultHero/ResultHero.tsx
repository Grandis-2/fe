import { DynamicIcon, type IconName } from 'lucide-react/dynamic'

import { spacing } from '@/shared/config/theme'
import { PlanetIcon } from '@/shared/ui'

import * as styles from './ResultHero.css'

export type ResultHeroProps = {
  tone: keyof typeof styles.tone
  // InlineAlert와 같은 규칙 — lucide 아이콘 이름을 받되 브랜드 행성만 예외로 둔다.
  icon: IconName | 'box_planet'
  title: string
  description: string
}

export function ResultHero({
  tone,
  icon,
  title,
  description,
}: ResultHeroProps) {
  return (
    <div className={[styles.root, styles.tone[tone]].join(' ')}>
      <div className={styles.iconCircle}>
        {icon === 'box_planet' ? (
          <PlanetIcon size={spacing[30]} />
        ) : (
          <DynamicIcon name={icon} size={spacing[30]} aria-hidden="true" />
        )}
      </div>
      <div className={styles.texts}>
        <div className={styles.title}>{title}</div>
        <div className={styles.description}>{description}</div>
      </div>
    </div>
  )
}
