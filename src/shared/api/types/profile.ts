// 회원가입(프로필 완성) 화면이 다루는 세 칸. 가입 직후엔 세 칸 다 null이고,
// PUT은 항상 세 칸을 통째로 교체한다(부분 수정 없음).
export type ProfileInfo = {
  displayName: string
  name: string | null
  email: string | null
  phoneNumber: string | null
}

export type UpdateProfileRequest = Pick<
  ProfileInfo,
  'name' | 'email' | 'phoneNumber'
>
