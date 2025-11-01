import { setup } from '@nuxt/test-utils'

export async function setupTest() {
  await setup({
    rootDir: process.cwd(),
    server: true,
    browser: false,
    host: 'http://localhost:3000',
  })
}