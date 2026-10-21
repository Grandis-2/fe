import { useEffect, useRef } from 'react'

import { Logo } from '@shared/ui'

import { startTelescopeScene } from '../lib/telescopeScene'

import * as styles from './AdminLoginIntro.css'

const AREAS = ['대기열', '사전예약', '주문·배송', '럭키드로우']

// 관리자 로그인 왼쪽 — 별을 관측하는 망원경 장면 위에 로고와 소개를 얹는다.
export function AdminLoginIntro() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    return startTelescopeScene(canvas, reducedMotion)
  }, [])

  return (
    <section className={styles.root} aria-label="NOVA 운영 콘솔 소개">
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
      <div className={styles.scrim} aria-hidden="true" />

      <div className={styles.brand}>
        <Logo className={styles.logo} />
        <span className={styles.badge}>ADMIN</span>
      </div>

      <div className={styles.intro}>
        <div className={styles.copy}>
          <h1 className={styles.title}>
            한 점도 놓치지 않게,
            <br />
            오픈의 흐름을 관측합니다.
          </h1>
          <div className={styles.description}>
            대기열부터 외부 등록, 주문, 럭키드로우까지 한곳에서 다루는 관리자
            콘솔입니다.
          </div>
        </div>
        <ul className={styles.areas}>
          {AREAS.map((area) => (
            <li key={area} className={styles.area}>
              {area}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
