import { useEffect, useRef, useState } from 'react'

import { useParams } from 'react-router'

import type { ProductPageTabKey } from '@/widgets/product-page-tab'

// 스티키 주문바/탭바가 스크롤 위치에 따라 나타나고, 탭 패널의 스크롤 위치로
// 활성 탭을 동기화하는 로직을 모아둔 훅. ProductDetailPage 전용이라 여기 colocate.
export function useProductDetailScroll() {
  const panelRefs = useRef<Partial<Record<ProductPageTabKey, HTMLDivElement>>>(
    {},
  )
  const layoutRef = useRef<HTMLDivElement>(null)
  const [isLayoutVisible, setIsLayoutVisible] = useState(true)
  const orderBarRef = useRef<HTMLDivElement>(null)
  const [orderBarHeight, setOrderBarHeight] = useState(0)
  const [activeTab, setActiveTab] = useState<ProductPageTabKey>('benefits')
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { productId } = useParams()

  // 상품이 바뀌면(다른 상품으로 이동 포함) 렌더링 중에 바로 닫는다 — 이펙트에서
  // setState하면 리렌더가 한 번 더 발생해 react-hooks/set-state-in-effect에 걸린다.
  const [prevProductId, setPrevProductId] = useState(productId)
  if (productId !== prevProductId) {
    setPrevProductId(productId)
    setIsSheetOpen(false)
  }

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
  }, [])

  useEffect(() => {
    if (orderBarRef.current) setOrderBarHeight(orderBarRef.current.offsetHeight)
  }, [])

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
  }, [])

  const handleTabChange = (tab: ProductPageTabKey) => {
    setActiveTab(tab)
    panelRefs.current[tab]?.scrollIntoView({ behavior: 'smooth' })
  }

  const registerPanelRef =
    (tab: ProductPageTabKey) => (el: HTMLDivElement | null) => {
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
    isSheetOpen,
    setIsSheetOpen,
  }
}
