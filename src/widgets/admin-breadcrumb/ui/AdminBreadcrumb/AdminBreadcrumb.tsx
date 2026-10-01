import { Fragment } from 'react'

import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import * as styles from './AdminBreadcrumb.css'

export type AdminBreadcrumbItem = {
  label: string
  /** 없으면 현재 위치로 그린다 — 보통 마지막 항목이다 */
  to?: string
}

export type AdminBreadcrumbProps = {
  items: AdminBreadcrumbItem[]
  className?: string
}

export function AdminBreadcrumb({ items, className }: AdminBreadcrumbProps) {
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
