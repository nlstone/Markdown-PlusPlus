const { expect, test } = require('@playwright/test')
const { launchElectron } = require('./helpers')

test.describe('Check Launch MarkDown++', async () => {
  let app = null
  let page = null

  test.beforeAll(async () => {
    const { app: electronApp, page: firstPage } = await launchElectron()
    app = electronApp
    page = firstPage
  })

  test.afterAll(async () => {
    await app.close()
  })

  test('Empty MarkDown++', async () => {
    const title = await page.title()
    expect(/^MarkDown\+\+|Untitled-1 - MarkDown\+\+$/.test(title)).toBeTruthy()
  })
})
