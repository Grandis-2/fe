import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { X } from 'lucide-react'
import { Link } from 'react-router'

import { brandMenus } from '@entities/product'
import { searchPath } from '@shared/config/routes'
import { Tag, type TagProps } from '@shared/ui'

import {
  categoryThumbnails,
  menuEvents,
  type MenuEvent,
} from '../../model/menu'

import * as styles from './MobileMenu.css'

const tabs = [
  { value: 'category', label: '카테고리' },
  { value: 'event', label: '이벤트' },
] as const
type MenuTab = (typeof tabs)[number]['value']

const eventTagColor: Record<MenuEvent['tag'], TagProps['color']> = {
  사전예약: 'primary',
  할인: 'yellow',
  이벤트: 'gray',
}

export type MobileMenuProps = {
  /** X·링크를 눌러 이동하거나 Esc를 누르면 닫는다. */
  onClose: () => void
}

// 모바일 하단 탭바의 '메뉴' — 검색창(SearchOverlay)처럼 화면 전체를 덮는다. 단, 탭바는
// 위에 그대로 떠 있어 다른 탭으로 바로 가거나 '메뉴'를 다시 눌러 닫을 수 있다 — 그래서
// <dialog> 최상위 레이어(탭바까지 덮고 막는다) 대신 탭바 아래 z-index의 고정 레이어로 띄운다.
export function MobileMenu({ onClose }: MobileMenuProps) {
  const [tab, setTab] = useState<MenuTab>('category')
  const rootRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const tabRefs = useRef<Partial<Record<MenuTab, HTMLButtonElement | null>>>({})
  const idPrefix = useId()
  const tabId = (value: MenuTab) => `${idPrefix}-tab-${value}`
  const panelId = `${idPrefix}-panel`

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 열리면 초점을 메뉴로 옮기고, 덮인 페이지(헤더·본문)는 inert로 초점·클릭을 막는다. 탭바(최상위 <nav>)는
  // 메뉴 위에 떠 있어야 하므로 남긴다. 닫히면 inert를 풀고 메뉴를 연 버튼으로 초점을 돌려준다.
  // ponytail: 형제 요소 중 <nav>를 탭바로 본다 — 레이아웃 최상위에 다른 <nav>가 생기면 표시를 따로 단다.
  useEffect(() => {
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const root = rootRef.current
    const covered = [...(root?.parentElement?.children ?? [])].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element !== root &&
        element.tagName !== 'NAV' &&
        !element.inert,
    )
    covered.forEach((element) => (element.inert = true))
    closeRef.current?.focus()
    return () => {
      covered.forEach((element) => (element.inert = false))
      opener?.focus()
    }
  }, [])

  // 탭은 방향키로 옮기고 바로 고른다(자동 선택). 탭 순서엔 고른 탭 하나만 들어간다.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.findIndex(({ value }) => value === tab)
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : null
    if (next === null) return
    event.preventDefault()
    const { value } = tabs[next]
    setTab(value)
    tabRefs.current[value]?.focus()
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      role="dialog"
      aria-label="메뉴"
      data-theme="dark"
    >
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <div className={styles.title}>메뉴</div>
          <button
            ref={closeRef}
            type="button"
            className={styles.close}
            aria-label="메뉴 닫기"
            onClick={onClose}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className={styles.tabs} role="tablist">
          {tabs.map(({ value, label }) => (
            <button
              key={value}
              ref={(element) => {
                tabRefs.current[value] = element
              }}
              id={tabId(value)}
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={value === tab}
              aria-controls={panelId}
              tabIndex={value === tab ? 0 : -1}
              onClick={() => setTab(value)}
              onKeyDown={handleTabKeyDown}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'category' ? (
        <div
          id={panelId}
          className={styles.body}
          role="tabpanel"
          aria-labelledby={tabId('category')}
        >
          {Object.entries(brandMenus).map(([brand, menu]) => (
            <section key={brand} className={styles.group}>
              <Link
                to={searchPath({ category: brand })}
                className={styles.groupTitle}
                onClick={onClose}
              >
                {brand}
              </Link>
              <div className={styles.grid}>
                {menu.categories.map((category) => {
                  const thumbnail = categoryThumbnails[category]
                  return (
                    <Link
                      key={category}
                      to={searchPath({
                        category: brand,
                        subCategory: category,
                      })}
                      className={styles.categoryTile}
                      onClick={onClose}
                    >
                      {thumbnail && (
                        <img
                          src={thumbnail}
                          alt=""
                          className={styles.categoryThumbnail}
                        />
                      )}
                      {category}
                    </Link>
                  )
                })}
              </div>
              {menu.brands && (
                <div className={styles.grid}>
                  {menu.brands.map((b) => (
                    <Link
                      key={b}
                      to={searchPath({ category: brand, brand: b })}
                      className={styles.brandTile}
                      onClick={onClose}
                    >
                      {b}
                    </Link>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div
          id={panelId}
          className={styles.body}
          role="tabpanel"
          aria-labelledby={tabId('event')}
        >
          {menuEvents.map((event) => (
            <Link
              key={event.title}
              to={event.to}
              className={styles.eventCard}
              onClick={onClose}
            >
              <img src={event.image} alt="" className={styles.eventImage} />
              <div className={styles.eventTexts}>
                <Tag
                  color={eventTagColor[event.tag]}
                  variant="subtle"
                  rounded={false}
                  className={styles.eventTag}
                >
                  {event.tag}
                </Tag>
                <span className={styles.eventTitle}>{event.title}</span>
                <span className={styles.eventPeriod}>{event.period}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
