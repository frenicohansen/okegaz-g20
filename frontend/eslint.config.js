import antfu from '@antfu/eslint-config'
import pluginQuery from '@tanstack/eslint-plugin-query'

export default antfu(
  {
    formatters: true,
    react: true,
  },
  ...pluginQuery.configs['flat/recommended'],
  {
    rules: {
      'eslint-comments/no-unlimited-disable': 'off',
    },
  },
)
