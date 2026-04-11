import * as actions from '../actions/paragraph'

export default function (keybindings, i18n) {
  return {
    id: 'paragraphMenuEntry',
    label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.label) || '&Paragraph',
    submenu: [{
      id: 'heading1MenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.heading1) || 'Heading 1',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.heading-1'),
      click (menuItem, focusedWindow) {
        actions.heading1(focusedWindow)
      }
    }, {
      id: 'heading2MenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.heading2) || 'Heading 2',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.heading-2'),
      click (menuItem, focusedWindow) {
        actions.heading2(focusedWindow)
      }
    }, {
      id: 'heading3MenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.heading3) || 'Heading 3',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.heading-3'),
      click (menuItem, focusedWindow) {
        actions.heading3(focusedWindow)
      }
    }, {
      id: 'heading4MenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.heading4) || 'Heading 4',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.heading-4'),
      click (menuItem, focusedWindow) {
        actions.heading4(focusedWindow)
      }
    }, {
      id: 'heading5MenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.heading5) || 'Heading 5',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.heading-5'),
      click (menuItem, focusedWindow) {
        actions.heading5(focusedWindow)
      }
    }, {
      id: 'heading6MenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.heading6) || 'Heading 6',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.heading-6'),
      click (menuItem, focusedWindow) {
        actions.heading6(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'upgradeHeadingMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.promoteHeading) || 'Promote Heading',
      accelerator: keybindings.getAccelerator('paragraph.upgrade-heading'),
      click (menuItem, focusedWindow) {
        actions.increaseHeading(focusedWindow)
      }
    }, {
      id: 'degradeHeadingMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.demoteHeading) || 'Demote Heading',
      accelerator: keybindings.getAccelerator('paragraph.degrade-heading'),
      click (menuItem, focusedWindow) {
        actions.degradeHeading(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'tableMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.table) || 'Table',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.table'),
      click (menuItem, focusedWindow) {
        actions.table(focusedWindow)
      }
    }, {
      id: 'codeFencesMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.codeFences) || 'Code Fences',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.code-fence'),
      click (menuItem, focusedWindow) {
        actions.codeFence(focusedWindow)
      }
    }, {
      id: 'quoteBlockMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.quoteBlock) || 'Quote Block',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.quote-block'),
      click (menuItem, focusedWindow) {
        actions.quoteBlock(focusedWindow)
      }
    }, {
      id: 'mathBlockMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.mathBlock) || 'Math Block',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.math-formula'),
      click (menuItem, focusedWindow) {
        actions.mathFormula(focusedWindow)
      }
    }, {
      id: 'htmlBlockMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.htmlBlock) || 'HTML Block',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.html-block'),
      click (menuItem, focusedWindow) {
        actions.htmlBlock(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'orderListMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.orderedList) || 'Ordered List',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.order-list'),
      click (menuItem, focusedWindow) {
        actions.orderedList(focusedWindow)
      }
    }, {
      id: 'bulletListMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.bulletList) || 'Bullet List',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.bullet-list'),
      click (menuItem, focusedWindow) {
        actions.bulletList(focusedWindow)
      }
    }, {
      id: 'taskListMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.taskList) || 'Task List',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.task-list'),
      click (menuItem, focusedWindow) {
        actions.taskList(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'looseListItemMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.looseListItem) || 'Loose List Item',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.loose-list-item'),
      click (menuItem, focusedWindow) {
        actions.looseListItem(focusedWindow)
      }
    }, {
      type: 'separator'
    }, {
      id: 'paragraphMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.paragraph) || 'Paragraph',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.paragraph'),
      click (menuItem, focusedWindow) {
        actions.paragraph(focusedWindow)
      }
    }, {
      id: 'horizontalLineMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.horizontalRule) || 'Horizontal Rule',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.horizontal-line'),
      click (menuItem, focusedWindow) {
        actions.horizontalLine(focusedWindow)
      }
    }, {
      id: 'frontMatterMenuItem',
      label: (i18n && i18n.menu && i18n.menu.paragraph && i18n.menu.paragraph.frontMatter) || 'Front Matter',
      type: 'checkbox',
      accelerator: keybindings.getAccelerator('paragraph.front-matter'),
      click (menuItem, focusedWindow) {
        actions.frontMatter(focusedWindow)
      }
    }]
  }
}
