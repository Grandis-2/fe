import { useEffect, useState } from 'react'

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      className={styles.root}
      role="dialog"
      aria-label="메뉴"
      data-theme="dark"
    >
      <div className={styles.top}>
        <div className={styles.titleRow}>
          <div className={styles.title}>메뉴</div>
          <button
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
              type="button"
              role="tab"
              className={styles.tab}
              aria-selected={value === tab}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'category' ? (
        <div className={styles.body}>
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
        <div className={styles.body}>
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
