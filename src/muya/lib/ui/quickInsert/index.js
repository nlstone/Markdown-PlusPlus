import { filter } from 'fuzzaldrin'
import { patch, h } from '../../parser/render/snabbdom'
import { deepCopy } from '../../utils'
import BaseScrollFloat from '../baseScrollFloat'
import { quickInsertObj } from './config'
import './index.css'

// Helper to get i18n text with nested key support
function getI18nText (muya, key, defaultText) {
  const i18n = muya?.options?.i18n
  if (!i18n) return defaultText

  // Support nested keys like 'quickInsert.categories.basicBlock'
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

// Category key mapping for i18n
const categoryKeyMap = {
  'basic block': 'quickInsert.categories.basicBlock',
  header: 'quickInsert.categories.header',
  'advanced block': 'quickInsert.categories.advancedBlock',
  'list block': 'quickInsert.categories.listBlock',
  diagram: 'quickInsert.categories.diagram'
}

// Label to i18n key mapping for items
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

class QuickInsert extends BaseScrollFloat {
  static pluginName = 'quickInsert'

  constructor (muya) {
    const name = 'ag-quick-insert'
    super(muya, name)
    this.reference = null
    this.oldVnode = null
    this._renderObj = null
    this.renderArray = null
    this.activeItem = null
    this.block = null
    this.renderObj = quickInsertObj
    this.render()
    this.listen()
  }

  get renderObj () {
    return this._renderObj
  }

  set renderObj (obj) {
    this._renderObj = obj
    const renderArray = []
    Object.keys(obj).forEach(key => {
      renderArray.push(...obj[key])
    })
    this.renderArray = renderArray
    if (this.renderArray.length > 0) {
      this.activeItem = this.renderArray[0]
      const activeEle = this.getItemElement(this.activeItem)
      this.activeEleScrollIntoView(activeEle)
    }
  }

  render () {
    const { muya, scrollElement, activeItem, _renderObj } = this
    let children = Object.keys(_renderObj).filter(key => {
      return _renderObj[key].length !== 0
    })
      .map(key => {
        // Get i18n category title
        const i18nKey = categoryKeyMap[key] || `quickInsert.categories.${key.replace(/\s/g, '')}`
        const categoryTitle = getI18nText(muya, i18nKey, key.toUpperCase())

        const titleVnode = h('div.title', categoryTitle)
        const items = []
        for (const item of _renderObj[key]) {
          const { title, subTitle, label, icon, shortCut } = item

          // Get i18n title and subTitle using label mapping
          const itemKey = labelToI18nKey[label] || label.replace(/-/g, '').replace(/\s/g, '')
          const titleI18nKey = `quickInsert.items.${itemKey}.title`
          const subTitleI18nKey = `quickInsert.items.${itemKey}.subTitle`
          const displayTitle = getI18nText(muya, titleI18nKey, title)
          const displaySubTitle = getI18nText(muya, subTitleI18nKey, subTitle)

          const iconVnode = h('div.icon-container', h('i.icon', h(`i.icon-${label.replace(/\s/g, '-')}`, {
            style: {
              background: `url(${icon}) no-repeat`,
              'background-size': '100%'
            }
          }, '')))

          const description = h('div.description', [
            h('div.big-title', displayTitle),
            h('div.sub-title', displaySubTitle)
          ])
          const shortCutVnode = h('div.short-cut', [
            h('span', shortCut)
          ])
          const selector = activeItem.label === label ? 'div.item.active' : 'div.item'
          items.push(h(selector, {
            dataset: { label },
            on: {
              click: () => {
                this.selectItem(item)
              }
            }
          }, [iconVnode, description, shortCutVnode]))
        }

        return h('section', [titleVnode, ...items])
      })

    if (children.length === 0) {
      const noResultText = getI18nText(muya, 'quickInsert.noResult', 'No result')
      children = h('div.no-result', noResultText)
    }
    const vnode = h('div', children)

    if (this.oldVnode) {
      patch(this.oldVnode, vnode)
    } else {
      patch(scrollElement, vnode)
    }
    this.oldVnode = vnode
  }

  listen () {
    super.listen()
    const { eventCenter } = this.muya
    eventCenter.subscribe('muya-quick-insert', (reference, block, status) => {
      if (status) {
        this.block = block
        this.show(reference)
        this.search(block.text.substring(1)) // remove `@` char
      } else {
        this.hide()
      }
    })
  }

  search (text) {
    const { contentState } = this.muya
    const canInserFrontMatter = contentState.canInserFrontMatter(this.block)
    const obj = deepCopy(quickInsertObj)
    if (!canInserFrontMatter) {
      obj['basic block'].splice(2, 1)
    }
    let result = obj
    if (text !== '') {
      result = {}
      Object.keys(obj).forEach(key => {
        result[key] = filter(obj[key], text, { key: 'title' })
      })
    }
    this.renderObj = result
    this.render()
  }

  selectItem (item) {
    const { contentState } = this.muya
    this.block.text = ''
    const { key } = this.block
    const offset = 0
    contentState.cursor = {
      start: { key, offset },
      end: { key, offset }
    }
    switch (item.label) {
      case 'paragraph':
        contentState.partialRender()
        break
      default:
        contentState.updateParagraph(item.label, true)
        break
    }
    // delay hide to avoid dispatch enter hander
    setTimeout(this.hide.bind(this))
  }

  getItemElement (item) {
    const { label } = item
    return this.scrollElement.querySelector(`[data-label="${label}"]`)
  }
}

export default QuickInsert
