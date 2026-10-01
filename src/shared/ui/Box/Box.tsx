import type { ComponentPropsWithoutRef } from 'react'

import { sprinkles } from '@/shared/config/theme'
import type { Sprinkles } from '@/shared/config/theme'

// Container(shared/ui)는 "페이지 콘텐츠 폭 제약"이라는 특정 레이아웃 계약을 강제하는
// 컴포넌트다. Box는 그거랑 다르게 sprinkles가 지원하는 아무 속성이나 prop처럼 바로 쓰게
// 해주는 범용 div 래퍼 — display/flex/gap/padding/margin 같은 걸 그때그때
// `sprinkles({...})`를 직접 호출해서 매번 className을 만드는 대신 `sx`로 넘기면 된다.
// Sprinkles 타입은 sprinkles 함수 시그니처에서 그대로 뽑아 쓴다(직접 다시 선언하지 않음) —
// sprinkles.css.ts에서 지원 속성이 바뀌면 여기도 자동으로 같이 바뀐다.
export type BoxProps = ComponentPropsWithoutRef<'div'> & {
  sx?: Sprinkles
}

export function Box({ sx, className, children, ...rest }: BoxProps) {
  return (
    <div
      className={[sx && sprinkles(sx), className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  )
}
