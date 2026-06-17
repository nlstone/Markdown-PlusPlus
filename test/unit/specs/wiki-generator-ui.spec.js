import fs from 'fs'
import path from 'path'
import { expect } from 'chai'

describe('Wiki generator dialog configuration', () => {
  const componentPath = path.join(__dirname, '../../../src/renderer/components/wikiGenerator/index.vue')

  it('does not expose a local AI protocol override', () => {
    const source = fs.readFileSync(componentPath, 'utf8')

    expect(source).to.not.include("{{ $t('wiki.protocol') }}")
    expect(source).to.not.include('selectedProtocol')
    expect(source).to.not.include('detectProtocol')
    expect(source).to.not.include('protocol: this.selectedProtocol')
    expect(source).to.include('aiSettings: this.aiSettings')
  })

  it('can minimize long-running generation without blocking the editor', () => {
    const source = fs.readFileSync(componentPath, 'utf8')

    expect(source).to.include('visible && !minimized')
    expect(source).to.include('wiki-task-card')
    expect(source).to.include('minimized: false')
    expect(source).to.include('minimizeGenerator')
    expect(source).to.include('restoreGenerator')
  })

  it('keeps the title-bar minimize action usable while generation is running', () => {
    const source = fs.readFileSync(componentPath, 'utf8')

    expect(source).to.include('@click.stop.prevent="minimizeGenerator"')
    expect(source).to.include(':title="$t(\'wiki.minimize\')"')
  })

  it('hides deep generation mode while keeping fast mode as the only selectable mode', () => {
    const source = fs.readFileSync(componentPath, 'utf8')

    expect(source).to.include('<option value="fast">{{ $t(\'wiki.modeFast\') }}</option>')
    expect(source).to.not.include('<option value="deep">{{ $t(\'wiki.modeDeep\') }}</option>')
    expect(source).to.include("selectedMode: 'fast'")
  })
})
