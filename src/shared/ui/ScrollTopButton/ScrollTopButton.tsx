import { useEffect, useState } from 'react'

import { ArrowUp } from 'lucide-react'

import * as styles from './ScrollTopButton.css'

// 한 화면 넘게 내려가면 오른쪽 아래에 떠서 맨 위로 올려 준다.
export function ScrollTopButton() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const update = () => setVisible(window.scrollY > window.innerHeight)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const scrollToTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <button
      type="button"
      aria-label="맨 위로"
      className={[styles.root, visible && styles.visible]
        .filter(Boolean)
        .join(' ')}
      onClick={scrollToTop}
    >
      <ArrowUp aria-hidden="true" size={20} />
    </button>
  )
}
