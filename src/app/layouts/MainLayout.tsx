import { Outlet, useLocation } from 'react-router'

import { sprinkles } from '@/shared/config/theme'

import * as styles from './MainLayout.css'

export function MainLayout() {
  const { pathname } = useLocation()
  const isPreorder =
    pathname === '/preorder' || pathname.startsWith('/preorder/')

  return (
    <div
      className={[
        styles.root,
        isPreorder && styles.baseBackground,
        sprinkles({ marginX: 'auto' }),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Outlet />
    </div>
  )
}
