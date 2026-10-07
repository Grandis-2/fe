import { useEffect, useRef } from 'react'

import { startSignupScene, type SignupScene } from '../../lib/signupScene'

import * as styles from './SignupBackground.css'

export type SignupBackgroundProps = {
  /** 입력 중(별만) · 가입 완료 · 저장 실패 — 장면마다 캔버스 연출이 다르다. */
  scene: SignupScene
}

// 화면 전체를 덮는 우주 배경(빛 번짐 + 캔버스). 클릭은 통과시킨다.
export function SignupBackground({ scene }: SignupBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // 캔버스 루프는 한 번만 띄우고, 매 프레임 최신 장면을 ref로 읽는다.
  const sceneRef = useRef(scene)
  useEffect(() => {
    sceneRef.current = scene
  }, [scene])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    return startSignupScene(canvas, () => sceneRef.current, reducedMotion)
  }, [])

  return (
    <div className={styles.root} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.canvas} />
      <div className={styles.glow} />
    </div>
  )
}
