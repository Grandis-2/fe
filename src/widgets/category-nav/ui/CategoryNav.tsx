import { Link, useLocation, useSearchParams } from 'react-router'

import * as styles from './CategoryNav.css'

export type CategoryNavLink = '구매후기' | '사전예약'

export type CategoryNavTone = 'default' | 'onDark'

export type CategoryNavProps = {
  tone?: CategoryNavTone
  activeLink?: CategoryNavLink
  onLinkClick?: (link: CategoryNavLink) => void
  className?: string
}

type MenuLink = { label: string; to: string }

type BrandMenu = {
  categories: string[]
  more: MenuLink[]
}

// 브랜드에 hover/focus하면 열리는 메가 메뉴의 내용.
// 카테고리 API가 붙으면 이 상수 대신 응답을 쓴다(썸네일도 그때 같이 붙인다).
const brandMenus = {
  모바일: {
    categories: ['스마트폰', '태블릿', '폴더블'],
    more: [
      { label: '사전예약 중인 모바일', to: '/preorder' },
      { label: '모바일 구매후기', to: '/reviews' },
    ],
  },
  'PC/주변기기': {
    categories: ['노트북', '모니터', '키보드/마우스'],
    more: [
      { label: '사전예약 중인 PC', to: '/preorder' },
      { label: 'PC 구매후기', to: '/reviews' },
    ],
  },
  웨어러블: {
    categories: ['스마트워치', '무선이어폰', '스마트밴드'],
    more: [
      { label: '사전예약 중인 웨어러블', to: '/preorder' },
      { label: '웨어러블 구매후기', to: '/reviews' },
    ],
  },
} satisfies Record<string, BrandMenu>

const links: CategoryNavLink[] = ['구매후기', '사전예약']
const linkPaths: Record<CategoryNavLink, string> = {
  구매후기: '/reviews',
  사전예약: '/preorder',
}

// URLSearchParams가 인코딩까지 해주므로 쿼리를 손으로 붙이지 않는다.
const searchPath = (params: Record<string, string>) =>
  `/search?${new URLSearchParams(params)}`

// 링크를 누른 뒤에도 포커스가 남아 있으면 :focus-within 때문에 이동한 페이지 위로 메뉴가
// 계속 열려 있으므로, 실제로 이동을 일으키는 링크를 누를 때만 포커스를 풀어 닫는다
// (컨테이너 전체에 걸면 메뉴 안 빈 공간 클릭에도 반응하고, 이 브랜드와 무관한 포커스까지 풀린다).
const blurActiveElement = () =>
  (document.activeElement as HTMLElement | null)?.blur()

// 모바일 헤더의 햄버거 → 바텀시트 안에 들어가는 세로 목록. hover 메가 메뉴 대신
// 브랜드마다 카테고리 타일을 펼쳐 둔다. 데이터는 데스크톱 nav와 같은 상수를 쓴다.
export function MobileCategoryNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className={styles.mobileRoot}>
      {Object.entries(brandMenus).map(([brand, menu]) => (
        <div key={brand} className={styles.mobileSection}>
          <Link
            to={searchPath({ category: brand })}
            className={styles.mobileBrand}
            onClick={onNavigate}
          >
            {brand}
          </Link>
          <div className={styles.mobileCategories}>
            {menu.categories.map((category) => (
              <Link
                key={category}
                to={searchPath({ category: brand, subCategory: category })}
                className={styles.menuTile}
                onClick={onNavigate}
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      ))}
      <div className={styles.mobileLinks}>
        {links.map((link) => (
          <Link
            key={link}
            to={linkPaths[link]}
            className={styles.mobileLink}
            onClick={onNavigate}
          >
            {link}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function CategoryNav({
  tone = 'default',
  activeLink,
  onLinkClick,
  className,
}: CategoryNavProps) {
  // 검색 페이지에 있을 때만 URL의 카테고리로 브랜드 링크·타일을 활성 표시한다.
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const isSearchPage = pathname === '/search'
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
            배경을 불투명하게 바꾼다 — 흰 패널과 한 덩어리로 보이게. */}
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
                <div className={styles.menuCategories}>
                  {menu.categories.map((category) => (
                    <Link
                      key={category}
                      to={searchPath({
                        category: brand,
                        subCategory: category,
                      })}
                      className={styles.menuTile}
                      aria-current={
                        brand === activeCategory &&
                        category === activeSubCategory
                          ? 'page'
                          : undefined
                      }
                      onClick={blurActiveElement}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
                <div className={styles.menuAside}>
                  <div className={styles.menuAsideTitle}>더 알아보기</div>
                  {menu.more.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={styles.menuAsideLink}
                      onClick={blurActiveElement}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <span className={styles.divider}>|</span>
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
