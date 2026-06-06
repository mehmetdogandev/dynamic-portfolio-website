import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'

const eslintConfig = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      '**/dist/**',
      // Ayrı Vite örnekleri — ana Next.js lint’ine dahil edilmez
      'Aksiyon Soft Full example/**',
      'Aksiyon Soft Admin paneli ile birlikte/**',
      'next-env.d.ts',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        alert: 'readonly',
        confirm: 'readonly',
        prompt: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        WebSocket: 'readonly',
        Event: 'readonly',
        AbortController: 'readonly',
        crypto: 'readonly',
        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',
        // React globals
        React: 'readonly',
        // DOM types
        HTMLDivElement: 'readonly',
        NodeJS: 'readonly',
        // Web API types
        Headers: 'readonly',
        Request: 'readonly',
        Response: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      react: react,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...react.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // Disable some strict rules that are causing issues
      'no-undef': 'off', // TypeScript handles this
      'no-case-declarations': 'off',
      'no-unreachable': 'off',
      'no-empty': 'off',
      'no-useless-catch': 'off',
      'react-hooks/set-state-in-effect': 'off', // Allow setState in effects for hydration
      'react-hooks/incompatible-library': 'off', // Allow React Hook Form and TanStack Table
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
]

export default eslintConfig
