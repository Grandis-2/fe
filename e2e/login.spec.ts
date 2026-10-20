import { expect, loginAs, PROFILE, test } from './fixtures'

// 버그: 지금은 홈으로 간다. SignupPage의 handleComplete가 navigate(from)을 부른 직후
// SignupForm이 markProfileComplete()를 부르는데, 이동이 끝나기 전에 /signup이 다시 그려져
// "가입 진행 중이 아님 → 홈" 가드(<Navigate to="/">)가 먼저 걸린다. 고치면 test.fail을 지운다.
test.fail(
  '처음 로그인하면 회원가입을 거쳐 원래 가려던 화면으로 돌아간다',
  async ({ page }) => {
    await page.goto('/mypage')

    // 회원 전용 화면이라 홈으로 튕기고 로그인 모달이 뜬다.
    const loginModal = page.getByRole('dialog', { name: '로그인' })
    await loginModal.getByRole('button', { name: '카카오 로그인' }).click()

    await expect(page).toHaveURL('/signup')
    await page.getByLabel('이름').fill(PROFILE.name)
    await page.getByLabel('이메일').fill(PROFILE.email)
    await page.getByLabel('휴대폰 번호').fill(PROFILE.phoneNumber)
    await page.getByRole('button', { name: '가입 완료' }).click()

    await expect(page).toHaveURL('/mypage')
    await expect(page.getByText(`${PROFILE.name} 님`)).toBeVisible()
  },
)

test('가입을 마친 회원은 회원가입 없이 바로 돌아가고 헤더가 바뀐다', async ({
  page,
}) => {
  await loginAs(page, '/mypage')

  const header = page.getByRole('banner')
  await expect(header.getByRole('link', { name: /^장바구니/ })).toBeVisible()
  await expect(header.getByRole('button', { name: '로그인' })).toHaveCount(0)
})

test('새로고침해도 로그인이 유지된다', async ({ page }) => {
  await loginAs(page, '/mypage')
  await page.reload()

  await expect(page).toHaveURL('/mypage')
  await expect(page.getByText(`${PROFILE.name} 님`)).toBeVisible()
  await expect(page.getByRole('dialog', { name: '로그인' })).toHaveCount(0)
})
