import { Fragment } from 'react'

import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import * as styles from './Breadcrumb.css'

export type BreadcrumbItem = {
  label: string
  /** 없으면 현재 위치로 그린다 — 보통 마지막 항목이다 */
  to?: string
}

export type BreadcrumbProps = {
  items: BreadcrumbItem[]
  className?: string
}

/**
 * 현재 위치를 상위 경로와 함께 보여준다. 마지막 항목은 `to`를 비워 현재 위치로
 * 그린다 — 지금 보고 있는 화면으로 가는 링크는 누를 데가 없다.
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      className={[styles.root, className].filter(Boolean).join(' ')}
      aria-label="breadcrumb"
    >
      {items.map(({ label, to }, index) => (
        // 라벨이 겹칠 수 있어 위치로 구분한다.
        <Fragment key={`${index}-${label}`}>
          {index > 0 && (
            <ChevronRight className={styles.icon} aria-hidden="true" />
          )}
          {to ? (
            <Link className={styles.link} to={to}>
              {label}
            </Link>
          ) : (
            <span className={styles.current}>{label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
