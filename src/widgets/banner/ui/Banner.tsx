import { useState } from 'react'

import { MessageSquareText, Smartphone, BookOpen } from 'lucide-react'
import { Link } from 'react-router'

import { Tag } from '@shared/ui'

import * as styles from './Banner.css'

import type { LucideIcon } from 'lucide-react'

type Slide = {
  badge: string
  title: string
  description: string
  tabLabel: string
  icon: LucideIcon
  to: string
  image: string
  imageAlt: string
}

// ponytail: 배너 API가 없어서 상수로 둔다 — API가 생기면 응답으로 교체.
const slides: Slide[] = [
  {
    badge: '사전예약',
    title: '아이폰 18 Pro, Pro Max\n사전예약',
    description:
      '실패 없는 사전예약부터 순차 배송까지!\n노바에서 한 번에 끝내세요.',
    tabLabel: '아이폰 18 Pro,\nPro Max 사전예약',
    icon: Smartphone,
    to: '/preorder/1',
    image: '/images/banner1.png',
    imageAlt: '아이폰 18 Pro, Pro Max',
  },
  {
    badge: '사전예약',
    title: '아이폰 Duo\n새로운 형태의 디자인을\n만나보세요',
    description: 'Apple의 첫 폴더블 스마트폰',
    tabLabel: '아이폰 Duo\n사전예약',
    icon: BookOpen,
    to: '/preorder/2',
    image: '/images/banner2.png',
    imageAlt: '아이폰 Duo',
  },
  {
    badge: '구매후기',
    title: '먼저 써본 사람들의\n솔직한 후기',
    description: '실제 구매자 후기로\n나에게 맞는 제품을 찾아보세요.',
    tabLabel: '구매후기\n모아보기',
    icon: MessageSquareText,
    to: '/reviews',
    image: '/images/macbook_neo_citrus1.png',
    imageAlt: '시트러스 컬러 맥북 네오',
  },
]

export function Banner() {
  const [active, setActive] = useState(0)
  const slide = slides[active]

  // 다음 슬라이드로 넘기는 타이머는 따로 두지 않는다 — 진행 바 애니메이션이 끝나는
  // 순간(onAnimationEnd)이 곧 넘길 때다. 탭을 누르면 key가 바뀌어 애니메이션도 처음부터.
  const next = () => setActive((i) => (i + 1) % slides.length)

  return (
    <section className={styles.root} aria-roledescription="carousel">
      <div className={styles.inner}>
        <div className={styles.text}>
          {/* key로 다시 마운트해 슬라이드마다 페이드인을 새로 건다. */}
          <div key={active} className={styles.fadeIn}>
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
            <Link to={slide.to} className={styles.title}>
              {slide.title}
            </Link>
            <div className={styles.description}>{slide.description}</div>
          </div>

          <div className={styles.tabs}>
            {slides.map((it, i) => {
              const Icon = it.icon
              return (
                <button
                  key={it.tabLabel}
                  type="button"
                  className={styles.tab}
                  aria-pressed={i === active}
                  onClick={() => setActive(i)}
                >
                  <span className={styles.progressTrack}>
                    {i < active && <span className={styles.progressFull} />}
                    {i === active && (
                      <span
                        key={active}
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
        </div>

        <Link
          key={active}
          to={slide.to}
          className={[styles.visual, styles.fadeIn].join(' ')}
        >
          <img
            src={slide.image}
            alt={slide.imageAlt}
            className={styles.image}
          />
        </Link>
      </div>
    </section>
  )
}
