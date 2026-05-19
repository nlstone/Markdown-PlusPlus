import BaseFloat from '../baseFloat'
import { patch, h } from '../../parser/render/snabbdom'
import icons from './config'

import './index.css'

// Helper to get i18n text with nested key support
function getI18nText (muya, key, defaultText) {
  const i18n = muya?.options?.i18n
  if (!i18n) return defaultText

  // Support nested keys like 'imageToolbar.edit'
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
  edit: 'imageToolbar.edit',
  inline: 'imageToolbar.inline',
  left: 'imageToolbar.alignLeft',
  center: 'imageToolbar.alignCenter',
  right: 'imageToolbar.alignRight',
  delete: 'imageToolbar.remove'
}

const defaultOptions = {
  placement: 'top',
  modifiers: {
    offset: {
      offset: '0, 10'
    }
  },
  showArrow: false
}

class ImageToolbar extends BaseFloat {
  static pluginName = 'imageToolbar'

  constructor (muya, options = {}) {
    const name = 'ag-image-toolbar'
    const opts = Object.assign({}, defaultOptions, options)
    super(muya, name, opts)
    this.oldVnode = null
    this.imageInfo = null
    this.options = opts
    this.icons = icons
    this.reference = null
    const toolbarContainer = this.toolbarContainer = document.createElement('div')
    this.container.appendChild(toolbarContainer)
    this.floatBox.classList.add('ag-image-toolbar-container')
    this.listen()
  }

  listen () {
    const { eventCenter } = this.muya
    super.listen()
    eventCenter.subscribe('muya-image-toolbar', ({ reference, imageInfo }) => {
      this.reference = reference
      if (reference) {
        this.imageInfo = imageInfo
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
    const { muya, icons, oldVnode, toolbarContainer, imageInfo } = this
    const { attrs } = imageInfo.token
    const dataAlign = attrs['data-align']
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
      let itemSelector = `li.item.${i.type}`

      if (i.type === dataAlign || !dataAlign && i.type === 'inline') {
        itemSelector += '.active'
      }

      // Get i18n tooltip
      const i18nKey = typeKeyMap[i.type] || `imageToolbar.${i.type}`
      const tooltip = getI18nText(muya, i18nKey, i.tooltip)

      return h(itemSelector, {
        dataset: {
          tip: tooltip
        },
        on: {
          click: event => {
            this.selectItem(event, i)
          }
        }
      }, [h('div.tooltip', tooltip), iconWrapper])
    })

    const vnode = h('ul', children)

    if (oldVnode) {
      patch(oldVnode, vnode)
    } else {
      patch(toolbarContainer, vnode)
    }
    this.oldVnode = vnode
  }

  selectItem (event, item) {
    event.preventDefault()
    event.stopPropagation()

    const { imageInfo } = this
    switch (item.type) {
      // Delete image.
      case 'delete':
        this.muya.contentState.deleteImage(imageInfo)
        // Hide image transformer
        this.muya.eventCenter.dispatch('muya-transformer', {
          reference: null
        })
        return this.hide()
      // Edit image, for example: editor alt and title, replace image.
      case 'edit': {
        const rect = this.reference.getBoundingClientRect()
        const reference = {
          getBoundingClientRect () {
            rect.height = 0
            return rect
          }
        }
        // Hide image transformer
        this.muya.eventCenter.dispatch('muya-transformer', {
          reference: null
        })
        this.muya.eventCenter.dispatch('muya-image-selector', {
          reference,
          imageInfo,
          cb: () => {}
        })
        return this.hide()
      }
      case 'inline':
      case 'left':
      case 'center':
      case 'right': {
        this.muya.contentState.updateImage(this.imageInfo, 'data-align', item.type)
        return this.hide()
      }
    }
  }
}

export default ImageToolbar
