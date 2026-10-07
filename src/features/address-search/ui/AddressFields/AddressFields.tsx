import { ActionButton, Input } from '@shared/ui'
import type { InputProps } from '@shared/ui'

import * as styles from './AddressFields.css'

export type AddressFieldKey = 'postcode' | 'address' | 'addressDetail'

export type AddressFieldsProps = {
  // useFormFields().field를 그대로 넘긴다 — 폼 상태는 호출부가 갖고, 여기선 칸의 모양만 그린다.
  field: (key: AddressFieldKey, label: string) => InputProps
  onSearchClick: () => void
}

// 기본 주소(+우편번호) + 주소 찾기 버튼 + 상세 주소. 기본 주소는 직접 입력하지 않고 주소 찾기로만
// 바꾼다(결제 화면 배송지와 같은 모양). 검색 다이얼로그(DaumPostcodeSearch)는 포함하지 않는다 —
// 모달 안에서 쓰일 때 다이얼로그가 모달의 자식이 되지 않도록 호출부가 형제로 렌더한다.
export function AddressFields({ field, onSearchClick }: AddressFieldsProps) {
  const postcode = field('postcode', '우편 번호').value
  const address = field('address', '기본 주소')
  // 읽기 전용 칸에 우편번호를 붙여 "기본 주소 (우편번호)"로 한 칸에 보여 준다 — 폼 값은 따로다.
  const addressDisplay = [address.value, postcode && `(${postcode})`]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <div className={styles.addressRow}>
        <Input
          {...address}
          variant="stacked"
          value={addressDisplay}
          placeholder="주소 찾기로 입력해 주세요"
          readOnly
        />
        <ActionButton
          variant="neutral"
          className={styles.searchAction}
          onClick={onSearchClick}
        >
          주소 찾기
        </ActionButton>
      </div>
      <Input
        {...field('addressDetail', '상세 주소')}
        variant="stacked"
        placeholder="동, 호수"
      />
    </>
  )
}
