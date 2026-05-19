import BaseFloat from '../baseFloat'
import { patch, h } from '../../parser/render/snabbdom'
import { toolList } from './config'

import './index.css'

// Helper to get i18n text with nested key support
function getI18nText (muya, key, defaultText) {
  const i18n = muya?.options?.i18n
  if (!i18n) return defaultText

  // Support nested keys like 'tableTools.insertRowAbove'
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

// Build i18n key from tool item
function buildI18nKey (item) {
  const { action, location, target } = item
  // Map to i18n keys like: tableTools.insertRowAbove, tableTools.removeRow, etc.
  const keyMap = {
    insert_previous_row: 'tableTools.insertRowAbove',
    insert_next_row: 'tableTools.insertRowBelow',
    remove_current_row: 'tableTools.removeRow',
    insert_left_column: 'tableTools.insertColumnLeft',
    insert_right_column: 'tableTools.insertColumnRight',
    remove_current_column: 'tableTools.removeColumn'
  }
  const key = `${action}_${location}_${target}`
  return keyMap[key] || `tableTools.${action}${location}${target}`
}

const defaultOptions = {
  placement: 'right-start',
  modifiers: {
    offset: {
      offset: '0, 5'
    }
  },
  showArrow: false
}

class TableBarTools extends BaseFloat {
  static pluginName = 'tableBarTools'

  constructor (muya, options = {}) {
    const name = 'ag-table-bar-tools'
    const opts = Object.assign({}, defaultOptions, options)
    super(muya, name, opts)
    this.options = opts
    this.oldVnode = null
    this.tableInfo = null
    this.floatBox.classList.add('ag-table-bar-tools')
    const tableBarContainer = this.tableBarContainer = document.createElement('div')
    this.container.appendChild(tableBarContainer)
    this.listen()
  }

  listen () {
    super.listen()
    const { eventCenter } = this.muya
    eventCenter.subscribe('muya-table-bar', ({ reference, tableInfo }) => {
      if (reference) {
        this.tableInfo = tableInfo
        this.show(reference)
        this.render()
      } else {
        this.hide()
      }
    })
  }

  render () {
    const { muya, tableInfo, oldVnode, tableBarContainer } = this
    const renderArray = toolList[tableInfo.barType]
    const children = renderArray.map((item) => {
      const { label } = item

      // Get i18n label
      const i18nKey = buildI18nKey(item)
      const displayLabel = getI18nText(muya, i18nKey, label)

      const selector = 'li.item'
      return h(selector, {
        dataset: {
          label: item.action
        },
        on: {
          click: event => {
            this.selectItem(event, item)
          }
        }
      }, displayLabel)
    })

    const vnode = h('ul', children)

    if (oldVnode) {
      patch(oldVnode, vnode)
    } else {
      patch(tableBarContainer, vnode)
    }
    this.oldVnode = vnode
  }

  selectItem (event, item) {
    event.preventDefault()
    event.stopPropagation()

    const { contentState } = this.muya
    contentState.editTable(item)
    this.hide()
  }
}

export default TableBarTools
