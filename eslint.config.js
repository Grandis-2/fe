// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import importX from 'eslint-plugin-import-x'
import unusedImports from 'eslint-plugin-unused-imports'
import prettierConfig from 'eslint-config-prettier'

// import 순서를 그룹별로 강제하는 공통 규칙.
// 외부 패키지 → 내부 별칭(@/) → 상대경로 → 타입 import 순으로 정렬한다.
const importOrderRules = {
  'import-x/order': [
    'error',
    {
      groups: [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index',
        'type',
      ],
      pathGroups: [
        { pattern: 'react', group: 'external', position: 'before' },
        { pattern: 'react/**', group: 'external', position: 'before' },
        { pattern: '@/**', group: 'internal' },
      ],
      pathGroupsExcludedImportTypes: ['react'],
      'newlines-between': 'always',
      alphabetize: { order: 'asc', caseInsensitive: true },
    },
  ],
  'import-x/no-duplicates': 'error',
  'import-x/no-cycle': 'warn',
}

// 미사용 import/변수를 자동 제거하는 공통 규칙.
// typescript-eslint의 no-unused-vars를 unused-imports로 위임한다.
const unusedImportsRules = {
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': 'off',
  'unused-imports/no-unused-imports': 'error',
  'unused-imports/no-unused-vars': [
    'error',
    {
      vars: 'all',
      varsIgnorePattern: '^_',
      args: 'after-used',
      argsIgnorePattern: '^_',
    },
  ],
}

// FSD 레이어 의존성 규칙 — 상위 레이어가 하위 레이어로만 import 가능
// app → pages → widgets → features → entities → shared
const fsdBoundaryRules = {
  'import-x/no-restricted-paths': [
    'error',
    {
      zones: [
        // shared는 다른 모든 레이어를 import할 수 없음
        {
          target: './src/shared/**',
          from: './src/@(app|pages|widgets|features|entities)/**',
        },
        // entities는 features, widgets, pages, app을 import할 수 없음
        {
          target: './src/entities/**',
          from: './src/@(app|pages|widgets|features)/**',
        },
        // features는 widgets, pages, app을 import할 수 없음
        {
          target: './src/features/**',
          from: './src/@(app|pages|widgets)/**',
        },
        // widgets는 pages, app을 import할 수 없음
        {
          target: './src/widgets/**',
          from: './src/@(app|pages)/**',
        },
        // pages는 app을 import할 수 없음
        {
          target: './src/pages/**',
          from: './src/app/**',
        },
        // 서버 DTO는 entities의 api/model에서만 import할 수 있음 (CLAUDE.md Data layer)
        {
          target: [
            './src/@(app|pages|widgets|features)/**',
            './src/entities/*/ui/**',
          ],
          from: './src/shared/api/types/**',
          message:
            'DTO는 entities/*/api에서 모델로 변환하고, 엔티티 배럴의 모델 타입을 쓴다.',
        },
      ],
    },
  ],
}

export default defineConfig([
  globalIgnores([
    'dist',
    'build',
    'storybook-static',
    'node_modules',
    'stats.html',
    // flat config 파일 자신을 자기 자신으로 린트하면 순환적 경고가 발생하므로 제외
    'eslint.config.js',
    // MSW가 만드는 서비스 워커. "Please do NOT modify this file"이라 손댈 수 없고
    // npx msw init public/ 을 다시 돌리면 덮어쓰인다 — 파일 맨 위 eslint-disable도 그래서 못 지운다.
    'public/mockServiceWorker.js',
  ]),

  // import-x 기본 + TypeScript resolver 설정 (전체 파일에 적용)
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,

  // 프론트엔드(Vite + React 19 + TS)
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    plugins: {
      'unused-imports': unusedImports,
    },
    languageOptions: {
      globals: globals.browser,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
    },
    rules: {
      ...importOrderRules,
      ...unusedImportsRules,
      ...fsdBoundaryRules,
    },
  },

  // Storybook 설정(Node 런타임)
  // vite.config.ts 와 동일하게 tsconfig.node.json 을 resolver 대상으로 지정한다.
  {
    files: ['.storybook/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    plugins: {
      'unused-imports': unusedImports,
    },
    languageOptions: {
      globals: globals.node,
    },
    settings: {
      'import-x/resolver': {
        typescript: {
          project: './tsconfig.node.json',
        },
      },
    },
    rules: {
      ...importOrderRules,
      ...unusedImportsRules,
    },
  },

  // Prettier와 충돌하는 ESLint 스타일 규칙 비활성화 (항상 마지막)
  prettierConfig,
  ...storybook.configs['flat/recommended'],
])
