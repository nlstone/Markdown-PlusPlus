export default function (keybindings, i18n) {
  return {
    label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.label) || 'Edit',
    submenu: [{
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.cut) || 'Cut',
      accelerator: keybindings.getAccelerator('edit.cut'),
      role: 'cut'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.copy) || 'Copy',
      accelerator: keybindings.getAccelerator('edit.copy'),
      role: 'copy'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.paste) || 'Paste',
      accelerator: keybindings.getAccelerator('edit.paste'),
      role: 'paste'
    }, {
      type: 'separator'
    }, {
      label: (i18n && i18n.menu && i18n.menu.edit && i18n.menu.edit.selectAll) || 'Select All',
      accelerator: keybindings.getAccelerator('edit.select-all'),
      role: 'selectAll'
    }]
  }
}
