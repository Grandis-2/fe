import { useEffect, useRef, useState } from 'react'

import { Link } from 'react-router'

import {
  BANNER_ICONS,
  useBanners,
  type Banner as BannerItem,
} from '@entities/banner'
import { preorderPath, productPath } from '@shared/config/routes'
import { Tag } from '@shared/ui'

import * as styles from './Banner.css'

// 홍보는 사전예약 홍보 상세(/preorder/:promotionId), 상품은 상품 상세로 간다.
const targetPath = ({ target }: Pick<BannerItem, 'target'>) =>
  target.type === 'PROMOTION' ? preorderPath(target.id) : productPath(target.id)

// 관리자가 켠 배너를 정한 순서대로 돌린다. 보일 배너가 없거나 못 읽으면 명세대로 배너를 숨기고,
// 헤더가 아래 구간을 덮지 않을 만큼만 비운다.
export function Banner() {
  const { data: slides, isPending } = useBanners()
  const [active, setActive] = useState(0)
  const tabsRef = useRef<HTMLDivElement>(null)
  // 다시 받은 목록이 줄었으면 처음 장부터 다시 센다.
  const current = active < (slides?.length ?? 0) ? active : 0

  // 탭이 많아 탭 줄이 옆으로 넘칠 때, 지금 탭이 가려져 있으면 탭 줄 안에서만 끌어온다.
  // scrollIntoView는 페이지까지 움직여 아래를 보던 사용자를 배너로 끌어올리므로 쓰지 않는다.
  useEffect(() => {
    const row = tabsRef.current
    const tab = row?.children[current] as HTMLElement | undefined
    if (!row || !tab) return
    const hidden =
      tab.offsetLeft < row.scrollLeft ||
      tab.offsetLeft + tab.offsetWidth > row.scrollLeft + row.clientWidth
    if (hidden) row.scrollTo({ left: tab.offsetLeft, behavior: 'smooth' })
  }, [current])

  // 받는 동안 사진 칸 크기만큼 자리를 잡아 둬 아래 구간이 밀려 내려오지 않게 한다.
  if (isPending) {
    return (
      <section className={styles.root} aria-busy>
        <div className={styles.inner}>
          <div className={styles.text} />
          <div className={styles.visual} />
        </div>
      </section>
    )
  }
  if (!slides?.length) return <div className={styles.collapsed} />

  const slide = slides[current]
  const to = targetPath(slide)

  // 다음 슬라이드로 넘기는 타이머는 따로 두지 않는다 — 진행 바 애니메이션이 끝나는
  // 순간(onAnimationEnd)이 곧 넘길 때다. 탭을 누르면 key가 바뀌어 애니메이션도 처음부터.
  const next = () => setActive((current + 1) % slides.length)

  return (
    <section className={styles.root} aria-roledescription="carousel">
      <div className={styles.inner}>
        <div className={styles.text}>
          {/* key로 다시 마운트해 슬라이드마다 페이드인을 새로 건다. */}
          <div key={slide.bannerId} className={styles.fadeIn}>
            <span className={styles.badgeMobile}>
              <Tag color="primary" variant="solid" rounded={false} size="small">
                {slide.badge}
              </Tag>
            </span>
            <span className={styles.badgeDesktop}>
              <Tag
                color="primary"
                variant="solid"
                rounded={false}
                size="medium"
              >
                {slide.badge}
              </Tag>
            </span>
            <Link to={to} className={styles.title}>
              {slide.title}
            </Link>
            <div className={styles.description}>{slide.description}</div>
          </div>

          {/* 한 장뿐이면 넘길 곳이 없어 탭·진행 바를 그리지 않는다. */}
          {slides.length > 1 && (
            <div ref={tabsRef} className={styles.tabs}>
              {slides.map((it, i) => {
                const Icon = BANNER_ICONS[it.icon]
                return (
                  <button
                    key={it.bannerId}
                    type="button"
                    className={styles.tab}
                    aria-pressed={i === current}
                    onClick={() => setActive(i)}
                  >
                    <span className={styles.progressTrack}>
                      {i < current && <span className={styles.progressFull} />}
                      {i === current && (
                        <span
                          key={slide.bannerId}
                          className={styles.progressRunning}
                          onAnimationEnd={next}
                        />
                      )}
                    </span>
                    <Icon size={20} aria-hidden />
                    <span className={styles.tabLabel}>{it.tabLabel}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <Link
          key={slide.bannerId}
          to={to}
          className={[styles.visual, styles.fadeIn].join(' ')}
        >
          <img
            src={slide.imageUrl}
            alt={slide.imageAlt}
            className={styles.image}
          />
        </Link>
      </div>
    </section>
  )
}
