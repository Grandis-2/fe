import { Outlet, useLocation } from 'react-router'

import { sprinkles } from '@/shared/config/theme'

import * as styles from './MainLayout.css'

export function MainLayout() {
  const { pathname } = useLocation()
  const isBaseBackground =
    pathname === '/preorder' ||
    pathname.startsWith('/preorder/') ||
    pathname.startsWith('/products/')

  return (
    <div
      className={[
        styles.root,
        isBaseBackground && styles.baseBackground,
        sprinkles({ marginX: 'auto' }),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Outlet />
    </div>
  )
}
