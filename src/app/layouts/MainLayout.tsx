import { Outlet, useLocation } from 'react-router'

import {
  PREORDER_PATH,
  PRODUCTS_PATH,
  SIGNUP_PATH,
} from '@shared/config/routes'
import { sprinkles } from '@shared/config/theme'

import * as styles from './MainLayout.css'

export function MainLayout() {
  const { pathname } = useLocation()
  // 사전예약 목록·상세는 어두운 페이지다 — 모바일 하단 탭바 여백까지 같은 색으로 채운다.
  const isDarkBackground =
    pathname === PREORDER_PATH || pathname.startsWith(`${PREORDER_PATH}/`)
  // 회원가입은 화면에 고정된 배경 레이어(z-index -1)를 쓴다 — 여기서 바탕을 칠하면 그 위를 덮는다.
  const isTransparentBackground = pathname === SIGNUP_PATH
  const isBaseBackground =
    pathname === PREORDER_PATH ||
    pathname.startsWith(`${PREORDER_PATH}/`) ||
    pathname.startsWith(`${PRODUCTS_PATH}/`)

  return (
    <div
      className={[
        styles.root,
        isBaseBackground && styles.baseBackground,
        isDarkBackground && styles.darkBackground,
        isTransparentBackground && styles.transparentBackground,
        sprinkles({ marginX: 'auto' }),
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Outlet />
    </div>
  )
}
