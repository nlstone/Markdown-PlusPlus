import GeneralIcon from '@/assets/icons/pref_general.svg'
import EditorIcon from '@/assets/icons/pref_editor.svg'
import MarkdownIcon from '@/assets/icons/pref_markdown.svg'
import ThemeIcon from '@/assets/icons/pref_theme.svg'
import ImageIcon from '@/assets/icons/pref_image.svg'
import SpellIcon from '@/assets/icons/pref_spellcheck.svg'
import KeyBindingIcon from '@/assets/icons/pref_key_binding.svg'

import preferences from '../../../main/preferences/schema'

// Base category configuration with icons and paths
export const categoryBase = [{
  nameKey: 'general',
  label: 'general',
  icon: GeneralIcon,
  path: '/preference/general'
}, {
  nameKey: 'editor',
  label: 'editor',
  icon: EditorIcon,
  path: '/preference/editor'
}, {
  nameKey: 'markdown',
  label: 'markdown',
  icon: MarkdownIcon,
  path: '/preference/markdown'
}, {
  nameKey: 'spelling',
  label: 'spelling',
  icon: SpellIcon,
  path: '/preference/spelling'
}, {
  nameKey: 'theme',
  label: 'theme',
  icon: ThemeIcon,
  path: '/preference/theme'
}, {
  nameKey: 'image',
  label: 'image',
  icon: ImageIcon,
  path: '/preference/image'
}, {
  nameKey: 'keybindings',
  label: 'keybindings',
  icon: KeyBindingIcon,
  path: '/preference/keybindings'
}]

// Helper to get category with translated names
export const getCategory = (i18n) => {
  return categoryBase.map(c => ({
    ...c,
    name: i18n ? i18n.t(`preference.categories.${c.nameKey}`) : c.nameKey
  }))
}

export const category = getCategory()

export const searchContent = Object.keys(preferences).map(k => {
  const { description, enum: emums } = preferences[k]
  let [category, preference] = description.split('--')
  if (Array.isArray(emums)) {
    preference += ` optional values: ${emums.join(', ')}`
  }
  return {
    category,
    preference
  }
})
  .filter(({ category: ca }) => categoryBase.some(c => c.label === ca.toLowerCase()))
