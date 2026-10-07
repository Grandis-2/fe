import { ChevronRight } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router'

import { brandMenus } from '@entities/product'
import { SEARCH_PATH, searchPath } from '@shared/config/routes'

import {
  categoryThumbnails,
  links,
  linkPaths,
  type CategoryNavLink,
} from '../model/menu'

import * as styles from './CategoryNav.css'

export type { CategoryNavLink }

export type CategoryNavTone = 'default' | 'onDark'

export type CategoryNavProps = {
  tone?: CategoryNavTone
  activeLink?: CategoryNavLink
  onLinkClick?: (link: CategoryNavLink) => void
  className?: string
}

// 링크를 누른 뒤에도 포커스가 남아 있으면 :focus-within 때문에 이동한 페이지 위로 메뉴가
// 계속 열려 있으므로, 실제로 이동을 일으키는 링크를 누를 때만 포커스를 풀어 닫는다
// (컨테이너 전체에 걸면 메뉴 안 빈 공간 클릭에도 반응하고, 이 브랜드와 무관한 포커스까지 풀린다).
const blurActiveElement = () =>
  (document.activeElement as HTMLElement | null)?.blur()

export function CategoryNav({
  tone = 'default',
  activeLink,
  onLinkClick,
  className,
}: CategoryNavProps) {
  // 검색 페이지에 있을 때만 URL의 카테고리로 브랜드 링크·타일을 활성 표시한다.
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isSearchPage = pathname === SEARCH_PATH
  const activeCategory = isSearchPage ? searchParams.get('category') : null
  const activeSubCategory = isSearchPage
    ? searchParams.get('subCategory')
    : null
  // 오른쪽 링크는 경로로 판단한다 — /preorder/:id처럼 하위 경로도 같은 메뉴로 본다.
  // activeLink prop을 주면 그쪽이 우선한다.
  const currentLink =
    activeLink ??
    links.find((link) => {
      const base = linkPaths[link].split('?')[0]
      return pathname === base || pathname.startsWith(`${base}/`)
    })

  return (
    <nav className={[styles.root, className].filter(Boolean).join(' ')}>
      <div className={[styles.links, styles.linksTone[tone]].join(' ')}>
        {/* data-mega-menu: 메뉴가 열렸는지(hover/focus)를 헤더가 :has()로 보고
            배경을 패널과 같은 색으로 바꾼다 — 한 덩어리로 보이게. */}
        {Object.entries(brandMenus).map(([brand, menu]) => (
          <div key={brand} className={styles.brand} data-mega-menu>
            <Link
              to={searchPath({ category: brand })}
              className={[
                styles.link,
                brand === activeCategory && styles.linkActive,
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={blurActiveElement}
            >
              {brand}
            </Link>
            <div className={styles.menu}>
              <div className={styles.menuInner}>
                <div className={styles.menuGroups}>
                  <div className={styles.menuGroup}>
                    <div className={styles.menuSectionTitle}>카테고리</div>
                    <div className={styles.menuTileGrid}>
                      {menu.categories.map((category) => {
                        const thumbnail = categoryThumbnails[category]
                        return (
                          <Link
                            key={category}
                            to={searchPath({
                              category: brand,
                              subCategory: category,
                            })}
                            className={
                              thumbnail
                                ? styles.megaTileWithThumbnail
                                : styles.megaTile
                            }
                            aria-current={
                              brand === activeCategory &&
                              category === activeSubCategory
                                ? 'page'
                                : undefined
                            }
                            onClick={blurActiveElement}
                          >
                            {thumbnail && (
                              <img
                                src={thumbnail}
                                alt=""
                                className={styles.menuTileThumbnail}
                              />
                            )}
                            {category}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                  {menu.brands && (
                    <div className={styles.menuGroup}>
                      <div className={styles.menuSectionTitle}>브랜드</div>
                      <div className={styles.menuTileGrid}>
                        {menu.brands.map((b) => (
                          <Link
                            key={b}
                            to={searchPath({ category: brand, brand: b })}
                            className={styles.megaTile}
                            onClick={blurActiveElement}
                          >
                            {b}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className={styles.menuAside}>
                  <div className={styles.menuSectionTitle}>더 알아보기</div>
                  {menu.more.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={styles.menuAsideLink}
                      onClick={blurActiveElement}
                    >
                      {item.label}
                      <ChevronRight
                        className={styles.menuAsideArrow}
                        aria-hidden="true"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className={styles.divider} aria-hidden="true" />
      <div className={[styles.links, styles.linksTone[tone]].join(' ')}>
        {links.map((link) => (
          <Link
            key={link}
            to={linkPaths[link]}
            className={[styles.link, link === currentLink && styles.linkActive]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onLinkClick?.(link)}
          >
            {link}
          </Link>
        ))}
      </div>
    </nav>
  )
}
