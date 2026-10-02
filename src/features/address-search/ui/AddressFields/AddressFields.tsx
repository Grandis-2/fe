import { Button, Input } from '@shared/ui'
import type { InputProps } from '@shared/ui'

import * as styles from './AddressFields.css'

export type AddressFieldKey = 'postcode' | 'address' | 'addressDetail'

export type AddressFieldsProps = {
  // useFormFields().field를 그대로 넘긴다 — 폼 상태는 호출부가 갖고, 여기선 세 칸의 모양만 그린다.
  field: (key: AddressFieldKey, label: string) => InputProps
  onSearchClick: () => void
}

// 우편번호 + 주소 찾기 버튼 + 기본 주소 + 상세 주소. 검색 다이얼로그(DaumPostcodeSearch)는
// 포함하지 않는다 — 모달 안에서 쓰일 때 다이얼로그가 모달의 자식이 되지 않도록 호출부가
// 형제로 렌더한다.
export function AddressFields({ field, onSearchClick }: AddressFieldsProps) {
  return (
    <>
      <div className={styles.postcodeRow}>
        <Input {...field('postcode', '우편 번호')} inputMode="numeric" />
        <Button className={styles.postcodeAction} onClick={onSearchClick}>
          주소 찾기
        </Button>
      </div>
      <Input {...field('address', '기본 주소')} />
      <Input {...field('addressDetail', '상세 주소')} />
    </>
  )
}
