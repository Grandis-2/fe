import type { MouseEvent, ReactNode } from 'react'

import * as styles from './FormToc.css'

export type FormTocItem = {
  /** 건너갈 섹션의 id */
  id: string
  label: string
  /** 항목 오른쪽 표시(잠김·바뀜 등) */
  badge?: ReactNode
}

export type FormTocProps = {
  title: string
  items: FormTocItem[]
  /** 폼 섹션들 — 목차는 그 오른쪽에 붙어 스크롤을 따라온다 */
  children: ReactNode
}

// 움직임을 줄이도록 설정했으면 바로 건너뛴다.
const scrollBehavior = (): ScrollBehavior =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'

/**
 * 관리자 등록·수정 폼의 섹션 목차. 섹션 오른쪽에 붙어 스크롤해도 위에 남고, 누르면 그
 * 섹션까지 부드럽게 내려간다. 좁은 화면에선 목차를 빼고 섹션만 보인다.
 */
export function FormToc({ title, items, children }: FormTocProps) {
  const scrollTo = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
  }

  return (
    <div className={styles.root}>
      {children}
      <nav className={styles.toc} aria-label="섹션 바로가기">
        <span className={styles.title}>{title}</span>
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={styles.link}
            onClick={(event) => scrollTo(event, item.id)}
          >
            {item.label}
            {item.badge}
          </a>
        ))}
      </nav>
    </div>
  )
}
