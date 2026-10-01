import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getProfile, putProfile } from './profile'

const queryKey = ['profile'] as const

// 비로그인이면 401로 실패한다 — 다시 물어도 같으니 재시도하지 않고 data는 비워 둔다.
export const useProfile = () =>
  useQuery({ queryKey, queryFn: getProfile, retry: false })

// 저장 응답으로 캐시를 바로 갱신한다 — 가입 직후 결제 화면이 옛 값(null)을 잠깐 보지 않게 한다.
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: putProfile,
    onSuccess: (saved) => queryClient.setQueryData(queryKey, saved),
  })
}
