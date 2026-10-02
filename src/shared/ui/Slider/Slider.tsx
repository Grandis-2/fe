import { Children, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

import { Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/react'

import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

import * as styles from './Slider.css'

import type { Swiper as SwiperClass } from 'swiper'

export type SliderProps = {
  children: ReactNode
  loop?: boolean
  // 좌우 화살표 버튼. 슬라이드가 둘 이상일 때만 보이고, 모바일은 스와이프라 숨긴다.
  navigation?: boolean
  // 바깥(예: 썸네일 목록)과 현재 슬라이드를 맞춘다 — 값을 바꾸면 그 슬라이드로 이동하고,
  // 스와이프·화살표로 바뀌면 onActiveIndexChange로 알려준다. 둘 다 안 주면 혼자 동작한다.
  activeIndex?: number
  onActiveIndexChange?: (index: number) => void
  className?: string
}

export function Slider({
  children,
  loop = true,
  navigation = false,
  activeIndex,
  onActiveIndexChange,
  className,
}: SliderProps) {
  const slides = Children.toArray(children)
  const hasMultipleSlides = slides.length > 1
  const [swiper, setSwiper] = useState<SwiperClass | null>(null)

  // loop일 때 슬라이드가 복제돼 있어서 slideTo가 아니라 slideToLoop(원래 순서 기준)를 쓴다.
  useEffect(() => {
    if (
      swiper &&
      activeIndex !== undefined &&
      swiper.realIndex !== activeIndex
    ) {
      swiper.slideToLoop(activeIndex)
    }
  }, [swiper, activeIndex])

  return (
    <Swiper
      modules={[Navigation, Pagination]}
      onSwiper={setSwiper}
      onSlideChange={({ realIndex }) => onActiveIndexChange?.(realIndex)}
      loop={loop && hasMultipleSlides}
      pagination={hasMultipleSlides ? { clickable: true } : false}
      navigation={navigation && hasMultipleSlides}
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={index}>{slide}</SwiperSlide>
      ))}
    </Swiper>
  )
}
