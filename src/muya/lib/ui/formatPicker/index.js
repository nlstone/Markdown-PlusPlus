import BaseFloat from '../baseFloat'
import { patch, h } from '../../parser/render/snabbdom'
import icons from './config'

import './index.css'

// Helper to get i18n text with nested key support
function getI18nText (muya, key, defaultText) {
  const i18n = muya?.options?.i18n
  if (!i18n) return defaultText

  // Support nested keys like 'formatPicker.bold'
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

// Type to i18n key mapping
const typeKeyMap = {
  strong: 'formatPicker.bold',
  em: 'formatPicker.italic',
  u: 'formatPicker.underline',
  del: 'formatPicker.strikethrough',
  mark: 'formatPicker.highlight',
  inline_code: 'formatPicker.inlineCode',
  inline_math: 'formatPicker.inlineMath',
  link: 'formatPicker.link',
  image: 'formatPicker.image',
  clear: 'formatPicker.clearFormat'
}

const defaultOptions = {
  placement: 'top',
  modifiers: {
    offset: {
      offset: '0, 5'
    }
  },
  showArrow: false
}

class FormatPicker extends BaseFloat {
  static pluginName = 'formatPicker'

  constructor (muya, options = {}) {
    const name = 'ag-format-picker'
    const opts = Object.assign({}, defaultOptions, options)
    super(muya, name, opts)
    this.oldVnode = null
    this.formats = null
    this.options = opts
    this.icons = icons
    const formatContainer = this.formatContainer = document.createElement('div')
    this.container.appendChild(formatContainer)
    this.floatBox.classList.add('ag-format-picker-container')
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    super.listen()
    eventCenter.subscribe('muya-format-picker', ({ reference, formats }) => {
      if (reference) {
        this.formats = formats
        setTimeout(() => {
          this.show(reference)
          this.render()
        }, 0)
      } else {
        this.hide()
      }
    })
  }

  render () {
    const { muya, icons, oldVnode, formatContainer, formats } = this
    const children = icons.map(i => {
      let icon
      let iconWrapperSelector
      if (i.icon) {
        // SVG icon Asset
        iconWrapperSelector = 'div.icon-wrapper'
        icon = h('i.icon', h('i.icon-inner', {
          style: {
            background: `url(${i.icon}) no-repeat`,
            'background-size': '100%'
          }
        }, ''))
      }
      const iconWrapper = h(iconWrapperSelector, icon)

      // Get i18n tooltip
      const i18nKey = typeKeyMap[i.type] || `formatPicker.${i.type}`
      const tooltip = getI18nText(muya, i18nKey, i.tooltip)

      let itemSelector = `li.item.${i.type}`
      if (formats.some(f => f.type === i.type || f.type === 'html_tag' && f.tag === i.type)) {
        itemSelector += '.active'
      }
      return h(itemSelector, {
        attrs: {
          title: `${tooltip} ${i.shortcut}`
        },
        on: {
          click: event => {
            this.selectItem(event, i)
          }
        }
      }, [iconWrapper])
    })

    const vnode = h('ul', children)

    if (oldVnode) {
      patch(oldVnode, vnode)
    } else {
      patch(formatContainer, vnode)
    }
    this.oldVnode = vnode
  }

  selectItem (event, item) {
    event.preventDefault()
    event.stopPropagation()
    const { contentState } = this.muya
    contentState.render()
    contentState.format(item.type)
    if (/link|image/.test(item.type)) {
      this.hide()
    } else {
      const { formats } = contentState.selectionFormats()
      this.formats = formats
      this.render()
    }
  }
}

export default FormatPicker
