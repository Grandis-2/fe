import { DynamicIcon, type IconName } from 'lucide-react/dynamic'

import { spacing } from '@shared/config/theme'

import { PlanetIcon } from '../PlanetIcon'

import * as styles from './InlineAlert.css'

export type InlineAlertProps = {
  status: keyof typeof styles.tone
  icon?: IconName | 'box_planet'
  variant?: 'small' | 'big'
  // big에서만 제목(children) 아래에 보조 설명으로 나온다.
  description?: React.ReactNode
}

export function InlineAlert({
  status = 'info',
  icon = 'triangle-alert',
  variant = 'small',
  description,
  children,
}: InlineAlertProps & { children: React.ReactNode }) {
  const iconNode =
    icon === 'box_planet' ? (
      <PlanetIcon size={variant === 'big' ? 26 : spacing[16]} />
    ) : (
      <DynamicIcon name={icon} size={variant === 'big' ? 26 : spacing[16]} />
    )

  if (variant === 'big') {
    return (
      <div
        role={status === 'error' ? 'alert' : 'status'}
        className={[styles.bigRoot, styles.bigTone[status]].join(' ')}
      >
        <div className={styles.bigIcon}>{iconNode}</div>
        <div className={styles.bigText}>
          <div className={styles.bigTitle}>{children}</div>
          {description && (
            <div className={styles.bigDescription}>{description}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={[styles.root, styles.tone[status]].join(' ')}>
      {iconNode}
      <div>{children}</div>
    </div>
  )
}
