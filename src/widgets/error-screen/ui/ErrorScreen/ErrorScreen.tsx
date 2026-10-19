import type { ReactNode } from 'react'

import { Link } from 'react-router'

import { HOME_PATH } from '@shared/config/routes'
import { Logo } from '@shared/ui'

import * as styles from './ErrorScreen.css'

export type ErrorScreenProps = {
  // 배경 장면(OrbitScene, BlackHoleScene)
  scene: ReactNode
  code: string
  // 코드 아래 영문 한 줄 — tone이 그 색을 정한다(404는 브랜드색, 500은 경고색).
  label: string
  tone: 'brand' | 'danger'
  title: string
  description: ReactNode
  actions: ReactNode
  // 문구 아래에 덧붙일 것(문의 코드 등)
  children?: ReactNode
  // 헤더가 없는 곳(레이아웃째 깨진 화면)에서 홈으로 가는 로고를 대신 그린다.
  showLogo?: boolean
  // 관리자 본문처럼 낮은 자리 — 장면을 보이려고 문구를 밀어 내리는 여백을 줄인다.
  compact?: boolean
}

// 404·500 같은 오류 화면의 틀(시안 Error 404 Orbit / Error 500 Black Hole). 어두운 우주 장면을
// 가득 깔고 아래쪽을 바탕색으로 덮은 뒤, 코드·문구·버튼을 왼쪽 아래에 모은다.
// 높이는 부모가 정한다 — 부모를 flex column + minHeight로 두면 그 높이를 채운다.
export function ErrorScreen({
  scene,
  code,
  label,
  tone,
  title,
  description,
  actions,
  children,
  showLogo,
  compact,
}: ErrorScreenProps) {
  return (
    <div className={styles.root}>
      <div className={styles.scene}>{scene}</div>
      <div className={styles.fade} aria-hidden />

      {showLogo && (
        <Link to={HOME_PATH} className={styles.logo} aria-label="NOVA 홈">
          <Logo />
        </Link>
      )}

      <div className={compact ? styles.spacer.compact : styles.spacer.full} />

      <div className={styles.body} role="alert">
        <div className={styles.heading}>
          <span className={styles.code}>{code}</span>
          <span className={styles.label[tone]}>{label}</span>
        </div>
        <div className={styles.texts}>
          <h1 className={styles.title}>{title}</h1>
          <div className={styles.description}>{description}</div>
          {children}
        </div>
        <div className={styles.actions}>{actions}</div>
      </div>
    </div>
  )
}
