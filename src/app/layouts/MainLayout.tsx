import { Outlet, useLocation } from 'react-router'

import { PREORDER_PATH, PRODUCTS_PATH } from '@shared/config/routes'
import { sprinkles } from '@shared/config/theme'

import * as styles from './MainLayout.css'

export function MainLayout() {
  const { pathname } = useLocation()
  const isBaseBackground =
    pathname === PREORDER_PATH ||
    pathname.startsWith(`${PREORDER_PATH}/`) ||
    pathname.startsWith(`${PRODUCTS_PATH}/`)

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
