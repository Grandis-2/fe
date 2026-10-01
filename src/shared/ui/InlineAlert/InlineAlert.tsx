import { DynamicIcon, type IconName } from 'lucide-react/dynamic'

import { spacing } from '@/shared/config/theme'

import { PlanetIcon } from '../PlanetIcon'

import * as styles from './InlineAlert.css'

export type InlineAlertProps = {
  status: keyof typeof styles.tone
  icon?: IconName | 'box_planet'
}

export function InlineAlert({
  status = 'info',
  icon = 'triangle-alert',
  children,
}: InlineAlertProps & { children: React.ReactNode }) {
  return (
    <div className={[styles.root, styles.tone[status]].join(' ')}>
      {icon === 'box_planet' ? (
        <PlanetIcon size={spacing[16]} />
      ) : (
        <DynamicIcon name={icon} size={spacing[16]} />
      )}
      <div>{children}</div>
    </div>
  )
}
