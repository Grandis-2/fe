import { Outlet } from 'react-router'

import { sprinkles } from '@/shared/config/theme'

import * as styles from './MainLayout.css'

export function MainLayout() {
  return (
    <div className={[styles.root, sprinkles({ marginX: 'auto' })].join(' ')}>
      <Outlet />
    </div>
  )
}
