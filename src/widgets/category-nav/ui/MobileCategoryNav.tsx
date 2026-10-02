import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'

import {
  brandMenus,
  categoryThumbnails,
  linkPaths,
  searchPath,
} from '../model/menu'

import * as styles from './CategoryNav.css'

// 모바일 헤더의 햄버거 → 바텀시트 안에 들어가는 세로 목록. hover 메가 메뉴 대신
// 브랜드마다 카테고리 타일을 펼쳐 둔다. 데이터는 데스크톱 nav와 같은 상수를 쓴다.
export function MobileCategoryNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className={styles.mobileRoot}>
      <Link
        to={linkPaths.이벤트}
        className={styles.mobileEventBanner}
        onClick={onNavigate}
      >
        진행 중인 이벤트 보러가기
        <ChevronRight size={18} aria-hidden="true" />
      </Link>
      <div className={styles.mobileHeading}>카테고리</div>
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
            {menu.categories.map((category) => {
              const thumbnail = categoryThumbnails[category]
              return (
                <Link
                  key={category}
                  to={searchPath({ category: brand, subCategory: category })}
                  className={
                    thumbnail ? styles.mobileCategoryTile : styles.menuTile
                  }
                  onClick={onNavigate}
                >
                  {thumbnail && (
                    <img
                      src={thumbnail}
                      alt=""
                      className={styles.mobileCategoryThumbnail}
                    />
                  )}
                  {category}
                </Link>
              )
            })}
          </div>
          {menu.brands && (
            <div className={styles.mobileBrands}>
              {menu.brands.map((b) => (
                <Link
                  key={b}
                  to={searchPath({ category: brand, brand: b })}
                  className={styles.mobileBrandChip}
                  onClick={onNavigate}
                >
                  {b}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  )
}
