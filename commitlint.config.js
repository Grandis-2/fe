// 이 저장소의 실제 커밋 관례(`feat: 설명` 또는 `feat(NF-18): 설명`)를 강제한다.
// @commitlint/config-conventional은 subject-case를 영문 기준으로 검사하는데,
// 커밋 메시지가 한글이라 여기 관례와 맞지 않아 규칙으로 덮어쓴다.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'style', 'docs', 'design', 'chore', 'test'],
    ],
    // scope는 선택이다 — `type:` 도, `type(scope):` 도 둘 다 허용한다.
    // 팀 컨벤션상 스코프에는 보통 Jira 이슈 키(NF-18 등)를 쓴다.
    // 커밋 메시지가 한글이라 영문 대소문자 규칙은 의미가 없다.
    'subject-case': [0],
  },
}
