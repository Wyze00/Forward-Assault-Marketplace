import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  test: {
    globals: true, 
    environment: 'nuxt',
    include: [
      'server/test/**/*.{test,spec}.ts'
    ]
  }
})