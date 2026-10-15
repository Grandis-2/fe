import { useState } from 'react'

import {
  useDefaultAddress,
  useSaveDefaultAddress,
  type DefaultAddress,
} from '@entities/address'
import { useProfile, type Profile } from '@entities/profile'
import {
  AddressFields,
  DaumPostcodeSearch,
  type DaumPostcodeAddress,
} from '@features/address-search'
import { getErrorMessage } from '@shared/api/client'
import { formatPhoneInput, toPhoneDigits } from '@shared/lib/formatPhone'
import { useFormFields } from '@shared/lib/useFormFields'
import { ActionButton, Button, InlineAlert, Input } from '@shared/ui'

import * as styles from './AddressForm.css'

const GENERIC_ERROR = '배송지를 저장하지 못했습니다. 다시 시도해 주세요.'

// 서버(PUT /me/default-address)가 받는 다섯 칸을 그대로 고친다 — 상세 주소만 선택이다.
const REQUIRED_KEYS = ['name', 'phone', 'postcode', 'address'] as const

// 저장된 배송지가 없으면(추가) 수령인 칸만 회원 프로필로 채워 둔다.
const toForm = (
  saved: DefaultAddress | null | undefined,
  profile: Profile | undefined,
) =>
  saved
    ? {
        name: saved.name,
        phone: saved.phone,
        postcode: saved.postalCode,
        address: saved.line1,
        addressDetail: saved.line2 ?? '',
      }
    : {
        name: profile?.name ?? '',
        phone: profile?.phoneNumber ?? '',
        postcode: '',
        address: '',
        addressDetail: '',
      }

export type AddressFormProps = {
  /** 저장했거나 취소해서 폼을 닫을 때 */
  onClose: () => void
}

// 배송지가 기본 배송지 하나뿐이라 추가/수정이 같은 폼이다 — 저장된 배송지가
// 있으면 채우고(수정) 없으면 빈 폼으로 시작한다(추가). 열 때마다 새로 마운트되므로
// 입력하던 값은 닫으면 버려진다.
export function AddressForm({ onClose }: AddressFormProps) {
  const { data: saved } = useDefaultAddress()
  const { data: profile } = useProfile()
  const { mutateAsync: saveAddress } = useSaveDefaultAddress()
  const form = useFormFields(toForm(saved, profile), REQUIRED_KEYS)
  const [addressSearchOpen, setAddressSearchOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // 상세 주소는 이전 주소 기준 값이라 새로 찾은 주소와 안 맞을 수 있어 같이 비운다.
  const handleAddressComplete = ({
    postcode,
    address,
  }: DaumPostcodeAddress) => {
    form.setValues({ postcode, address, addressDetail: '' })
    setAddressSearchOpen(false)
  }

  const handleSubmit = async () => {
    form.markSubmitted()
    setError(null)
    if (!form.requiredFilled) return

    setSaving(true)
    try {
      await saveAddress({
        name: form.values.name,
        phone: form.values.phone,
        postalCode: form.values.postcode,
        line1: form.values.address,
        line2: form.values.addressDetail || null,
      })
      onClose()
    } catch (caught) {
      setError(getErrorMessage(caught, GENERIC_ERROR))
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <article className={styles.root}>
        <header className={styles.header}>
          {saved ? '배송지 수정' : '배송지 추가'}
        </header>
        <div className={styles.body}>
          {error && <InlineAlert status="error">{error}</InlineAlert>}
          <Input
            {...form.field('name', '받는 분')}
            variant="stacked"
            placeholder="이름"
            maxLength={50}
          />
          <Input
            {...form.field('phone', '연락처')}
            value={formatPhoneInput(form.values.phone)}
            onChange={(event) =>
              form.setValues({ phone: toPhoneDigits(event.target.value) })
            }
            variant="stacked"
            placeholder="010-1234-5678"
            inputMode="numeric"
          />
          <AddressFields
            field={form.field}
            onSearchClick={() => setAddressSearchOpen(true)}
          />
        </div>
        <footer className={styles.footer}>
          <Button variant="subtle" color="cancel" onClick={onClose}>
            취소
          </Button>
          <ActionButton
            size="md"
            disabled={saving}
            onClick={() => void handleSubmit()}
          >
            저장하기
          </ActionButton>
        </footer>
      </article>

      <DaumPostcodeSearch
        open={addressSearchOpen}
        onOpenChange={setAddressSearchOpen}
        onComplete={handleAddressComplete}
      />
    </>
  )
}
