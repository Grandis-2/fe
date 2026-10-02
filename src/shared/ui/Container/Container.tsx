import type { ReactNode } from 'react'

import { spacing, sprinkles } from '@shared/config/theme'

export type ContainerProps = {
  children: ReactNode
  className?: string
  // 데스크톱 paddingX/paddingY만 덮어쓸 수 있게 한다 — 모바일 값(16/24)과 maxWidth 계약은
  // 페이지마다 갈리면 안 되므로 고정. 필요하면 spacing 스케일 중에서 고른다.
  desktopPaddingX?: keyof typeof spacing
  desktopPaddingY?: keyof typeof spacing
  mobilePaddingX?: keyof typeof spacing
  mobilePaddingY?: keyof typeof spacing
}

// 페이지 콘텐츠의 표준 레이아웃 계약: 모바일은 전체 폭, 데스크톱은 max-width 1200px로
// 캡되고 기본 paddingX 30px/paddingY 50px가 적용된다. 이 값이 필요한 곳은 sprinkles를 직접
// 쓰지 말고 항상 이 컴포넌트를 통해서 쓴다 — 페이지마다 손으로 옮겨 적다가 값이 갈리는 걸 막기 위해서다.
export function Container({
  children,
  className,
  desktopPaddingX = 30,
  desktopPaddingY = 50,
  mobilePaddingX = 16,
  mobilePaddingY = 24,
}: ContainerProps) {
  return (
    <div
      className={[
        sprinkles({
          maxWidth: { mobile: 'full', desktop: 'content' },
          paddingX: { mobile: mobilePaddingX, desktop: desktopPaddingX },
          paddingY: { mobile: mobilePaddingY, desktop: desktopPaddingY },
          marginX: { mobile: 'auto', desktop: 'auto' },
        }),
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  )
}
