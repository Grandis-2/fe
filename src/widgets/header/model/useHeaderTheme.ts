import { useEffect, useRef, useState } from 'react'

// 헤더 세로 중앙선 아래 구간의 data-header-theme이 "dark"면 흰 글자로 바꾼다.
// 페이지는 어두운 구간에 이 속성만 달면 된다(MainPage의 배너·히어로 참고).
// 구간은 경로가 바뀔 때마다 다시 찾는다 — 페이지마다 구간이 다르다.
export function useHeaderTheme(pathname: string) {
  const headerRef = useRef<HTMLElement>(null)
  const [isOnDark, setIsOnDark] = useState(false)

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>(
      '[data-header-theme]',
    )
    const update = () => {
      // 헤더 높이가 breakpoint마다 달라서(headerHeight) 매번 실제 높이를 잰다.
      const probeY = (headerRef.current?.offsetHeight ?? 0) / 2
      // 구간이 중첩되면 안쪽이 이긴다 — querySelectorAll은 문서 순서(바깥 먼저)라
      // 마지막으로 걸린 게 가장 안쪽이다(어두운 히어로 안의 흰 카드 캐러셀처럼).
      let theme: string | undefined
      for (const section of sections) {
        const { top, bottom } = section.getBoundingClientRect()
        if (top <= probeY && bottom > probeY)
          theme = section.dataset.headerTheme
      }
      setIsOnDark(theme === 'dark')
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [pathname])

  return { headerRef, isOnDark }
}
