const { expect, test } = require('@playwright/test')
const { launchElectron } = require('./helpers')

test.describe('Toolbar', async () => {
  let app = null
  let page = null

  test.beforeAll(async () => {
    const { app: electronApp, page: firstPage } = await launchElectron()
    app = electronApp
    page = firstPage

    // Extra wait for toolbar to fully render after app launch
    await new Promise(resolve => setTimeout(resolve, 1000))
  })

  test.afterAll(async () => {
    await app.close()
  })

  // ---------------------------------------------------------------------------
  // Scenario 1: Toolbar is visible on launch
  // ---------------------------------------------------------------------------
  test('Toolbar is visible on launch', async () => {
    const isVisible = await page.locator('.toolbar-container').isVisible()
    expect(isVisible).toBeTruthy()
  })

  // ---------------------------------------------------------------------------
  // Scenario 2: File group buttons exist in the DOM
  // All 5 FileGroup buttons (.toolbar-btn inside .toolbar-group) should be present.
  // Note: New Tab and Open Folder have v-show="!isNarrow" — they are rendered in
  // the DOM but may be hidden; we check presence via count, not visibility.
  // ---------------------------------------------------------------------------
  test('File group buttons are present in the DOM', async () => {
    // The first .toolbar-group belongs to FileGroup (5 buttons: New Tab, Open File,
    // Open Folder, Save, Save As).
    const fileGroupBtns = page.locator('.toolbar-group').first().locator('.toolbar-btn')
    const count = await fileGroupBtns.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('Open File button is visible', async () => {
    // Open File has no v-show restriction — always visible regardless of window width.
    // It is the second button in the first .toolbar-group.
    const openFileBtn = page.locator('.toolbar-group').first().locator('.toolbar-btn').nth(1)
    const isVisible = await openFileBtn.isVisible()
    expect(isVisible).toBeTruthy()
  })

  // ---------------------------------------------------------------------------
  // Scenario 3: Save and Save As buttons — enabled when tab exists on launch
  // MarkDown++ always opens with an untitled tab, so hasFile is true at launch
  // (tabs.length > 0). Save/SaveAs are enabled, not disabled.
  // Buttons are only disabled when ALL tabs are closed (tabs.length === 0).
  // ---------------------------------------------------------------------------
  test('Save button is enabled when untitled tab is open on launch', async () => {
    // Save is the 4th button in the first .toolbar-group (0-indexed: nth(3))
    const saveBtn = page.locator('.toolbar-group').first().locator('.toolbar-btn').nth(3)
    // On launch there is always an untitled tab — button should be enabled
    const isDisabled = await saveBtn.isDisabled()
    expect(isDisabled).toBeFalsy()
  })

  test('Save As button is enabled when untitled tab is open on launch', async () => {
    // Save As is the 5th button in the first .toolbar-group (0-indexed: nth(4))
    const saveAsBtn = page.locator('.toolbar-group').first().locator('.toolbar-btn').nth(4)
    const isDisabled = await saveAsBtn.isDisabled()
    expect(isDisabled).toBeFalsy()
  })

  // ---------------------------------------------------------------------------
  // Scenario 4: View group buttons exist
  // ViewGroup has 6 buttons: Command Palette, Source Code, Typewriter, Focus,
  // Sidebar, Tab Bar. Source Code and Tab Bar have v-show="!isNarrow".
  // ---------------------------------------------------------------------------
  test('View group buttons are present in the DOM', async () => {
    // The second .toolbar-group belongs to ViewGroup (6 buttons).
    const viewGroupBtns = page.locator('.toolbar-group').nth(1).locator('.toolbar-btn')
    const count = await viewGroupBtns.count()
    expect(count).toBeGreaterThanOrEqual(6)
  })

  test('Command Palette button is visible', async () => {
    // Command Palette is first in ViewGroup — always visible (no v-show restriction).
    const cmdPaletteBtn = page.locator('.toolbar-group').nth(1).locator('.toolbar-btn').nth(0)
    const isVisible = await cmdPaletteBtn.isVisible()
    expect(isVisible).toBeTruthy()
  })

  test('Typewriter Mode button is visible', async () => {
    // Typewriter is 3rd in ViewGroup — always visible (no v-show restriction).
    const typewriterBtn = page.locator('.toolbar-group').nth(1).locator('.toolbar-btn').nth(2)
    const isVisible = await typewriterBtn.isVisible()
    expect(isVisible).toBeTruthy()
  })

  test('Focus Mode button is visible', async () => {
    // Focus is 4th in ViewGroup — always visible.
    const focusBtn = page.locator('.toolbar-group').nth(1).locator('.toolbar-btn').nth(3)
    const isVisible = await focusBtn.isVisible()
    expect(isVisible).toBeTruthy()
  })

  test('Sidebar button is visible', async () => {
    // Sidebar is 5th in ViewGroup — always visible.
    const sidebarBtn = page.locator('.toolbar-group').nth(1).locator('.toolbar-btn').nth(4)
    const isVisible = await sidebarBtn.isVisible()
    expect(isVisible).toBeTruthy()
  })

  // ---------------------------------------------------------------------------
  // Scenario 5: Overflow menu button exists
  // OverflowMenu has class .overflow-wrapper and its trigger button has
  // class .toolbar-overflow-btn (in addition to .toolbar-btn).
  // ---------------------------------------------------------------------------
  test('Overflow menu button exists and is visible', async () => {
    const overflowBtn = page.locator('.toolbar-overflow-btn')
    const count = await overflowBtn.count()
    expect(count).toBeGreaterThanOrEqual(1)

    const isVisible = await overflowBtn.isVisible()
    expect(isVisible).toBeTruthy()
  })

  test('Overflow wrapper is present in DOM', async () => {
    const overflowWrapper = page.locator('.overflow-wrapper')
    const count = await overflowWrapper.count()
    expect(count).toBeGreaterThanOrEqual(1)
  })

  // ---------------------------------------------------------------------------
  // Scenario 6: Responsive — narrow window hides some buttons
  // At width < 600px: New Tab (FileGroup nth(0)), Open Folder (FileGroup nth(2)),
  // Source Code (ViewGroup nth(1)), Tab Bar (ViewGroup nth(5)) should be hidden.
  // v-show="!isNarrow" sets display:none — element is in DOM but not visible.
  // After test, restore viewport to 800x600.
  // ---------------------------------------------------------------------------
  test('Narrow window hides New Tab button', async () => {
    await page.setViewportSize({ width: 500, height: 600 })
    // Wait for resize handler to propagate windowWidth change to Vue
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newTabBtn = page.locator('.toolbar-group').first().locator('.toolbar-btn').nth(0)
    const isVisible = await newTabBtn.isVisible()
    expect(isVisible).toBeFalsy()

    // Restore
    await page.setViewportSize({ width: 800, height: 600 })
    await new Promise(resolve => setTimeout(resolve, 500))
  })

  test('Narrow window hides Open Folder button', async () => {
    await page.setViewportSize({ width: 500, height: 600 })
    await new Promise(resolve => setTimeout(resolve, 2000))

    const openFolderBtn = page.locator('.toolbar-group').first().locator('.toolbar-btn').nth(2)
    const isVisible = await openFolderBtn.isVisible()
    expect(isVisible).toBeFalsy()

    // Restore
    await page.setViewportSize({ width: 800, height: 600 })
    await new Promise(resolve => setTimeout(resolve, 500))
  })

  test('Wide window shows New Tab and Open Folder buttons', async () => {
    await page.setViewportSize({ width: 800, height: 600 })
    await new Promise(resolve => setTimeout(resolve, 2000))

    const newTabBtn = page.locator('.toolbar-group').first().locator('.toolbar-btn').nth(0)
    const openFolderBtn = page.locator('.toolbar-group').first().locator('.toolbar-btn').nth(2)

    expect(await newTabBtn.isVisible()).toBeTruthy()
    expect(await openFolderBtn.isVisible()).toBeTruthy()
  })
})
