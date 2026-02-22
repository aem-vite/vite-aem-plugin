import prettier from 'eslint-plugin-prettier/recommended'
import tseslint from 'typescript-eslint'

export default tseslint.config({ ignores: ['lib/'] }, ...tseslint.configs.recommended, prettier)
