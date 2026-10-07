import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import {
  ONGOING_PREORDERS,
  type PreorderStatus,
} from '../../model/searchSuggestions'
import * as shared from '../search.css'

import * as styles from './PreorderLinks.css'

const PREORDER_STATUS_LABEL: Record<PreorderStatus, string> = {
  open: '진행 중',
  upcoming: '오픈 예정',
}

export type PreorderLinksProps = {
  preorders: typeof ONGOING_PREORDERS
}

// '진행 중인 사전예약' 목록 — 검색창 첫 화면과 검색 결과 화면이 같이 쓴다.
export function PreorderLinks({ preorders }: PreorderLinksProps) {
  return (
    <section className={shared.section}>
      <h2 className={shared.sectionTitle}>진행 중인 사전예약</h2>
      <ul className={styles.preorders}>
        {preorders.map(({ title, status, to }) => (
          <li key={title}>
            <Link to={to} className={styles.preorder}>
              <span className={styles.status[status]}>
                {PREORDER_STATUS_LABEL[status]}
              </span>
              <span className={styles.title}>{title}</span>
              <ChevronRight className={styles.chevron} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
