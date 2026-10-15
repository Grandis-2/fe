// 휴대폰 번호 입력칸은 숫자만 상태로 들고(서버도 숫자만 받는다) 화면에만 하이픈을 붙인다.
// 붙여넣은 '010-1234-5678'도 숫자만 남긴 뒤 11자로 자른다.
export const toPhoneDigits = (value: string) =>
  value.replace(/\D/g, '').slice(0, 11)

// 입력 중에도 3-4-4로 끊는다 — 다음 칸에 숫자가 생길 때만 '-'를 붙여야 지울 때 '-'에 걸리지 않는다.
// 10자리 옛 번호(011·016 등)는 가운데가 3자리라 3-3-4로 끊는다. 010은 늘 11자리라 입력 중
// 10자리에서 모양이 바뀌지 않게 뺀다.
export const formatPhoneInput = (digits: string) => {
  const middle = digits.length === 10 && !digits.startsWith('010') ? 6 : 7
  return [digits.slice(0, 3), digits.slice(3, middle), digits.slice(middle)]
    .filter(Boolean)
    .join('-')
}
