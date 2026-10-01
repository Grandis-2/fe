import { Input } from '@/shared/ui'
import type { InputProps } from '@/shared/ui'

import { useNumberDraft } from '../../model/useNumberDraft'

export type NumberFieldProps = Omit<
  InputProps,
  'value' | 'onChange' | 'type'
> & {
  value: number
  onChange: (value: number) => void
}

/** 화살표 없이 숫자만 받는 입력칸 */
export function NumberField({ value, onChange, ...rest }: NumberFieldProps) {
  const { draft, handleInput } = useNumberDraft(value, onChange)

  return (
    <Input
      {...rest}
      type="text"
      inputMode="numeric"
      value={draft}
      onChange={(event) => handleInput(event.target.value)}
    />
  )
}
