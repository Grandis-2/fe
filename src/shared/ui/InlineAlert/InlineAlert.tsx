import { TriangleAlert, type LucideIcon } from 'lucide-react'

import { spacing } from '@shared/config/theme'

import { PlanetIcon } from '../PlanetIcon'

import * as styles from './InlineAlert.css'

export type InlineAlertProps = {
  status: keyof typeof styles.tone
  // 아이콘 컴포넌트를 넘긴다(icon={Info}, icon={PlanetIcon}).
  icon?: LucideIcon | typeof PlanetIcon
  variant?: 'small' | 'big'
  // big에서만 제목(children) 아래에 보조 설명으로 나온다.
  description?: React.ReactNode
}

export function InlineAlert({
  status = 'info',
  icon: Icon = TriangleAlert,
  variant = 'small',
  description,
  children,
}: InlineAlertProps & { children: React.ReactNode }) {
  const iconNode = <Icon size={variant === 'big' ? 26 : spacing[16]} />
  // 행동 뒤에 나타나는 안내다 — 읽히지 않으면 스크린리더는 왜 실패했는지 알 수 없다.
  // error는 즉시 끊고 읽는 alert, 나머지는 기다렸다 읽는 status.
  const role = status === 'error' ? 'alert' : 'status'

  if (variant === 'big') {
    return (
      <div
        role={role}
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
    <div role={role} className={[styles.root, styles.tone[status]].join(' ')}>
      {iconNode}
      <div>{children}</div>
    </div>
  )
}
