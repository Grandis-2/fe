import { useEffect, useState } from 'react'

import * as styles from './Toast.css'

export type ToastItem = {
  id: number
  message: string
}

export type ToastViewportProps = {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
  /** 화면에 머무는 시간(ms). 사라지는 애니메이션은 이 뒤에 붙는다 */
  duration?: number
}

/**
 * 화면 하단 가운데에 잠깐 떴다 사라지는 안내 문구들.
 * 목록이 비어 있어도 영역은 항상 그려 둔다 — 스크린리더는 이미 있던 live region에
 * 새 내용이 들어올 때만 읽어 주기 때문이다.
 */
export function ToastViewport({
  toasts,
  onDismiss,
  duration = 2500,
}: ToastViewportProps) {
  return (
    <div className={styles.viewport} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          duration={duration}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  )
}

type ToastProps = {
  message: string
  duration: number
  onDismiss: () => void
}

function Toast({ message, duration, onDismiss }: ToastProps) {
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), duration)
    return () => clearTimeout(timer)
  }, [duration])

  return (
    <div
      className={leaving ? styles.toastLeaving : styles.toast}
      // 사라지는 애니메이션이 끝난 뒤에 목록에서 뺀다 — 먼저 빼면 애니메이션 없이 툭 끊긴다.
      // 들어오는 애니메이션의 animationend도 여기로 오므로 leaving일 때만 처리한다.
      onAnimationEnd={leaving ? onDismiss : undefined}
    >
      {message}
    </div>
  )
}
