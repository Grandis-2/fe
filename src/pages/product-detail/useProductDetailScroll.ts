import { useEffect, useRef, useState } from 'react'

import {
  FIXED_BOTTOM_BAR_VAR,
  productDetailBreakpoint,
} from '@shared/config/theme'
import type { ProductPageTabKey } from '@widgets/product-page-tab'

// 스티키 주문바/탭바가 스크롤 위치에 따라 나타나고, 탭 패널의 스크롤 위치로
// 활성 탭을 동기화하는 로직을 모아둔 훅. ProductDetailPage 전용이라 여기 colocate.
// isReady — 상품 조회 전엔 페이지가 안내 문구만 그려 관찰할 요소가 없다. 조회가 끝나
// 요소가 생긴 뒤에 관찰을 다시 걸도록 아래 effect들의 의존성으로 쓴다.
export function useProductDetailScroll(productId: string, isReady: boolean) {
  const panelRefs = useRef<Partial<Record<ProductPageTabKey, HTMLElement>>>({})
  const layoutRef = useRef<HTMLDivElement>(null)
  const [isLayoutVisible, setIsLayoutVisible] = useState(true)
  const orderBarRef = useRef<HTMLDivElement>(null)
  const [orderBarHeight, setOrderBarHeight] = useState(0)
  const [activeTab, setActiveTab] = useState<ProductPageTabKey>('benefits')

  // 라우터는 이전 페이지의 스크롤 위치를 그대로 두므로, 상품에 들어올 때마다
  // (상품 → 다른 상품 이동 포함) 맨 위로 부드럽게 올린다.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [productId])

  useEffect(() => {
    const el = layoutRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) =>
      setIsLayoutVisible(entry.isIntersecting),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isReady])

  // 한 번만 재는 게 아니라 계속 관찰한다 — 상품 조회가 끝나 isPreorder가 바뀌면
  // 순차배송 안내 줄이 추가/제거되는 등 바 높이 자체가 달라지고, 그러면 탭 오프셋과
  // 레이아웃 맨 아래 여백(FIXED_BOTTOM_BAR_VAR)도 같이 어긋난다.
  useEffect(() => {
    const el = orderBarRef.current
    if (!el) return
    const observer = new ResizeObserver(() =>
      setOrderBarHeight(el.offsetHeight),
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isReady])

  // 모바일 결제 바는 화면 아래에 고정돼 탭바보다 높다 — 레이아웃(MainLayout)이 푸터 밑을
  // 이만큼 비우도록 높이를 알린다. 웹 배치에선 바가 위에 붙으니 알리지 않는다.
  // 페이지를 떠나면 지워 다른 페이지엔 탭바 여백만 남긴다.
  useEffect(() => {
    const root = document.documentElement.style
    const bottomBar = window.matchMedia(productDetailBreakpoint.mobile)
    const sync = () => {
      if (bottomBar.matches) {
        root.setProperty(FIXED_BOTTOM_BAR_VAR, `${orderBarHeight}px`)
      } else {
        root.removeProperty(FIXED_BOTTOM_BAR_VAR)
      }
    }
    sync()
    bottomBar.addEventListener('change', sync)
    return () => {
      bottomBar.removeEventListener('change', sync)
      root.removeProperty(FIXED_BOTTOM_BAR_VAR)
    }
  }, [orderBarHeight])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.intersectionRatio >= 0.7)
        if (!visible) return
        const tab = Object.entries(panelRefs.current).find(
          ([, el]) => el === visible.target,
        )?.[0] as ProductPageTabKey | undefined
        if (tab) setActiveTab(tab)
      },
      { threshold: 0.7 },
    )
    Object.values(panelRefs.current).forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [isReady])

  const handleTabChange = (tab: ProductPageTabKey) => {
    setActiveTab(tab)
    panelRefs.current[tab]?.scrollIntoView({ behavior: 'smooth' })
  }

  const registerPanelRef =
    (tab: ProductPageTabKey) => (el: HTMLElement | null) => {
      panelRefs.current[tab] = el ?? undefined
    }

  return {
    layoutRef,
    orderBarRef,
    isLayoutVisible,
    orderBarHeight,
    activeTab,
    handleTabChange,
    registerPanelRef,
  }
}
