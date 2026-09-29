import { useEffect, useState } from 'react'

import { typography } from '@/shared/config/theme'
import { breakpoint } from '@/shared/config/theme/tokens/breakpoint'
import { BottomSheet, Modal, useModalTitleId } from '@/shared/ui'

import {
  useDaumPostcodeEmbed,
  type DaumPostcodeAddress,
} from '../../lib/useDaumPostcodeEmbed'

import * as styles from './DaumPostcodeSearch.css'

export type { DaumPostcodeAddress }

export type DaumPostcodeSearchProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: (address: DaumPostcodeAddress) => void
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => window.matchMedia(breakpoint.desktop).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(breakpoint.desktop)
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  return isDesktop
}

// Modal 안에서만 useModalTitleId()가 값을 갖는다 — 그 문맥을 타려면 Modal의
// children으로 진짜 자식 컴포넌트를 렌더해야 한다(DaumPostcodeSearch 자신이
// Modal을 호출하는 쪽이라 자기 렌더 안에서 훅을 불러도 값을 못 받는다).
function ModalTitle() {
  const titleId = useModalTitleId()
  return (
    <div
      id={titleId}
      className={[
        typography.title.lgSemibold,
        styles.title,
        styles.modalTitle,
      ].join(' ')}
    >
      주소 검색
    </div>
  )
}

// 데스크톱은 dialog 모달, 모바일은 바텀시트 — 컨테이너만 갈리고 다음 우편번호
// embed 로직(useDaumPostcodeEmbed)은 공유한다.
export function DaumPostcodeSearch({
  open,
  onOpenChange,
  onComplete,
}: DaumPostcodeSearchProps) {
  const isDesktop = useIsDesktop()
  const containerRef = useDaumPostcodeEmbed(open, isDesktop, onComplete)

  if (isDesktop) {
    return (
      <Modal open={open} onClose={() => onOpenChange(false)} padding={0}>
        <div className={styles.modalContent}>
          <ModalTitle />
          <div className={styles.embedWrapper}>
            <div ref={containerRef} className={styles.embed} />
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <BottomSheet.Root open={open} onOpenChange={onOpenChange}>
      <BottomSheet.Content padding={0}>
        <div className={styles.sheetContent}>
          <BottomSheet.Title
            className={[
              typography.title.lgSemibold,
              styles.title,
              styles.sheetTitle,
            ].join(' ')}
          >
            주소 검색
          </BottomSheet.Title>
          <div className={styles.embedWrapper}>
            <div ref={containerRef} className={styles.embed} />
          </div>
        </div>
      </BottomSheet.Content>
    </BottomSheet.Root>
  )
}
