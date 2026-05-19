import BaseFloat from '../baseFloat'
import { patch, h } from '../../parser/render/snabbdom'
import { menu, getSubMenu, getLabel } from './config'

import './index.css'

const MAX_SUBMENU_HEIGHT = 400
const ITEM_HEIGHT = 28
const PADDING = 10

const defaultOptions = {
  placement: 'bottom',
  modifiers: {
    offset: {
      offset: '0, 10'
    }
  },
  showArrow: false
}

// Helper to get i18n text with nested key support
function getI18nText (muya, key, defaultText) {
  const i18n = muya?.options?.i18n
  if (!i18n) return defaultText

  // Support nested keys like 'frontMenu.duplicate'
  const keys = key.split('.')
  let value = i18n
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      return defaultText
    }
  }
  return typeof value === 'string' ? value : defaultText
}

// Label to i18n key mapping for submenu items (quick insert)
const labelToI18nKey = {
  paragraph: 'paragraph',
  hr: 'horizontalLine',
  'front-matter': 'frontMatter',
  'heading 1': 'heading1',
  'heading 2': 'heading2',
  'heading 3': 'heading3',
  'heading 4': 'heading4',
  'heading 5': 'heading5',
  'heading 6': 'heading6',
  table: 'table',
  mathblock: 'mathblock',
  html: 'html',
  pre: 'code',
  blockquote: 'quote',
  'ol-order': 'orderList',
  'ul-bullet': 'bulletList',
  'ul-task': 'todoList',
  'vega-lite': 'vegaLite',
  flowchart: 'flowchart',
  sequence: 'sequence',
  plantuml: 'plantuml',
  mermaid: 'mermaid'
}

class FrontMenu extends BaseFloat {
  static pluginName = 'frontMenu'

  constructor (muya, options = {}) {
    const name = 'ag-front-menu'
    const opts = Object.assign({}, defaultOptions, options)
    super(muya, name, opts)
    this.oldVnode = null
    this.outmostBlock = null
    this.startBlock = null
    this.endBlock = null
    this.options = opts
    this.reference = null
    const frontMenuContainer = this.frontMenuContainer = document.createElement('div')
    Object.assign(this.container.parentNode.style, {
      overflow: 'visible'
    })
    this.container.appendChild(frontMenuContainer)
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    super.listen()
    eventCenter.subscribe('muya-front-menu', ({ reference, outmostBlock, startBlock, endBlock }) => {
      if (reference) {
        this.outmostBlock = outmostBlock
        this.startBlock = startBlock
        this.endBlock = endBlock
        this.reference = reference
        setTimeout(() => {
          this.show(reference)
          this.render()
        }, 0)
      } else {
        this.hide()
        this.reference = null
      }
    })
  }

  renderSubMenu (subMenu) {
    const { muya, reference } = this
    const rect = reference.getBoundingClientRect()
    const windowHeight = document.documentElement.clientHeight
    const children = subMenu.map(menuItem => {
      const { icon, title, label, shortCut } = menuItem
      const iconWrapperSelector = 'div.icon-wrapper'
      const iconWrapper = h(iconWrapperSelector, h('i.icon', h(`i.icon-${label.replace(/\s/g, '-')}`, {
        style: {
          background: `url(${icon}) no-repeat`,
          'background-size': '100%'
        }
      }, '')))

      // Get i18n title for quick insert items using label mapping
      const i18nItemKey = labelToI18nKey[label] || label.replace(/-/g, '').replace(/\s/g, '')
      const i18nKey = `quickInsert.items.${i18nItemKey}.title`
      const displayTitle = getI18nText(muya, i18nKey, title)

      const textWrapper = h('span', displayTitle)
      const shortCutWrapper = h('div.short-cut', [
        h('span', shortCut)
      ])
      let itemSelector = `li.item.${label}`
      if (label === getLabel(this.outmostBlock)) {
        itemSelector += '.active'
      }
      return h(itemSelector, {
        on: {
          click: event => {
            this.selectItem(event, { label })
          }
        }
      }, [iconWrapper, textWrapper, shortCutWrapper])
    })
    let subMenuSelector = 'div.submenu'
    if (windowHeight - rect.bottom < MAX_SUBMENU_HEIGHT - (ITEM_HEIGHT + PADDING)) {
      subMenuSelector += '.align-bottom'
    }
    return h(subMenuSelector, h('ul', children))
  }

  render () {
    const { muya, oldVnode, frontMenuContainer, outmostBlock, startBlock, endBlock } = this
    const { type, functionType } = outmostBlock
    const children = menu.map(({ icon, label, text, shortCut }) => {
      const subMenu = getSubMenu(outmostBlock, startBlock, endBlock)
      const iconWrapperSelector = 'div.icon-wrapper'
      const iconWrapper = h(iconWrapperSelector, h('i.icon', h(`i.icon-${label.replace(/\s/g, '-')}`, {
        style: {
          background: `url(${icon}) no-repeat`,
          'background-size': '100%'
        }
      }, '')))

      // Get i18n text for menu items
      const i18nKey = `frontMenu.${label}`
      const displayText = getI18nText(muya, i18nKey, text)

      const textWrapper = h('span', displayText)
      const shortCutWrapper = h('div.short-cut', [
        h('span', shortCut)
      ])
      let itemSelector = `li.item.${label}`
      const itemChildren = [iconWrapper, textWrapper, shortCutWrapper]
      if (label === 'turnInto' && subMenu.length !== 0) {
        itemChildren.push(this.renderSubMenu(subMenu))
      }
      if (label === 'turnInto' && subMenu.length === 0) {
        itemSelector += '.disabled'
      }
      // front matter can not be duplicated.
      if (label === 'duplicate' && type === 'pre' && functionType === 'frontmatter') {
        itemSelector += '.disabled'
      }
      return h(itemSelector, {
        on: {
          click: event => {
            this.selectItem(event, { label })
          }
        }
      }, itemChildren)
    })

    const vnode = h('ul', children)

    if (oldVnode) {
      patch(oldVnode, vnode)
    } else {
      patch(frontMenuContainer, vnode)
    }
    this.oldVnode = vnode
  }

  selectItem (event, { label }) {
    event.preventDefault()
    event.stopPropagation()
    const { type, functionType } = this.outmostBlock
    // front matter can not be duplicated.
    if (label === 'duplicate' && type === 'pre' && functionType === 'frontmatter') {
      return
    }
    const { contentState } = this.muya
    contentState.selectedBlock = null
    switch (label) {
      case 'duplicate': {
        contentState.duplicate()
        break
      }
      case 'delete': {
        contentState.deleteParagraph()
        break
      }
      case 'new': {
        contentState.insertParagraph('after', '', true)
        break
      }
      case 'turnInto':
        // do nothing, do not hide float box.
        return
      default:
        contentState.updateParagraph(label)
        break
    }
    // delay hide to avoid dispatch enter hander
    setTimeout(this.hide.bind(this))
  }
}

export default FrontMenu
