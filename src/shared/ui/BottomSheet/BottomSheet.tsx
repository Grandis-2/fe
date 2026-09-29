import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, CSSProperties } from 'react'

import { Drawer as VaulDrawer } from 'vaul'

import * as styles from './BottomSheet.css'

export type BottomSheetRootProps = ComponentPropsWithoutRef<
  typeof VaulDrawer.Root
>

// 시트가 열리면 body 스크롤이 막히면서 레이아웃이 틀어지는 문제가 있었다 — 원인이 두 군데였다:
// 1) vaul 자체가 Safari에서 body에 width 지정 없이 position:fixed를 걸어 body 너비가 줄어듦(noBodyStyles로 끔).
// 2) 내부적으로 쓰는 @radix-ui/react-dialog가 modal일 때 body에 overflow:hidden을 걸고 스크롤바 폭만큼
//    보정하는데, 우리 쪽 고정 요소(Header 등)와 안 맞아 어긋남 — modal을 꺼서 스크롤 잠금 자체를 없앤다.
// 둘 다 필요하면 호출부에서 override 가능.
export function Root({
  noBodyStyles = true,
  modal = false,
  ...rest
}: BottomSheetRootProps) {
  return <VaulDrawer.Root noBodyStyles={noBodyStyles} modal={modal} {...rest} />
}
export const Trigger = VaulDrawer.Trigger
export const Close = VaulDrawer.Close
export const Title = VaulDrawer.Title
export const Description = VaulDrawer.Description

export type BottomSheetContentProps = ComponentPropsWithoutRef<
  typeof VaulDrawer.Content
> & {
  // 인라인이라 기본값을 항상 이긴다. handle 위 여백은 이 값과 무관하다 — 예: padding={spacing[24]}
  padding?: CSSProperties['padding']
}

export const Content = forwardRef<HTMLDivElement, BottomSheetContentProps>(
  function Content({ className, children, padding, style, ...rest }, ref) {
    return (
      <VaulDrawer.Portal>
        {/* vaul의 Overlay는 modal일 때만 렌더된다(스크롤 잠금과 한 세트라 modal={false}면 null) —
            검은 배경은 그대로 갖고 싶어서 직접 그리고, 닫기 동작만 Close로 위임한다.
            버튼으로 그려야 키보드로 포커스·Enter가 되고 스크린리더에 "닫기"로 읽힌다. */}
        <VaulDrawer.Close asChild>
          <button type="button" aria-label="닫기" className={styles.overlay} />
        </VaulDrawer.Close>
        <VaulDrawer.Content
          ref={ref}
          className={[styles.content, className].filter(Boolean).join(' ')}
          style={{ padding, ...style }}
          {...rest}
        >
          <div className={styles.handle} />
          {children}
        </VaulDrawer.Content>
      </VaulDrawer.Portal>
    )
  },
)
