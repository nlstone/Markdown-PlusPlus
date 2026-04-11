import Vue from 'vue'
import VueI18n from 'vue-i18n'
import ElementLocale from 'element-ui/lib/locale'
import enElementLocale from 'element-ui/lib/locale/lang/en'
import zhElementLocale from 'element-ui/lib/locale/lang/zh-CN'

import enMessages from './en.json'
import zhMessages from './zh-CN.json'

Vue.use(VueI18n)

const messages = {
  en: {
    ...enMessages,
    ...enElementLocale
  },
  'zh-CN': {
    ...zhMessages,
    ...zhElementLocale
  }
}

// Get saved language preference
function getDefaultLanguage () {
  // Try to get from store/preference
  try {
    const stored = localStorage.getItem('mt-preference')
    if (stored) {
      const prefs = JSON.parse(stored)
      if (prefs.language && messages[prefs.language]) {
        return prefs.language
      }
    }
  } catch (e) {
    // Ignore errors
  }

  // Detect system language
  const systemLang = navigator.language || navigator.userLanguage
  if (systemLang && systemLang.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en'
}

const i18n = new VueI18n({
  locale: getDefaultLanguage(),
  fallbackLocale: 'en',
  messages,
  silentTranslationWarn: true
})

// Sync Element UI locale with vue-i18n
ElementLocale.i18n((key, value) => i18n.t(key, value))

// Export function to change language and notify main process
export function setLanguage (lang) {
  if (messages[lang]) {
    i18n.locale = lang

    // Notify main process via IPC to rebuild menus
    try {
      const { ipcRenderer } = require('electron')
      ipcRenderer.send('mt::language-changed', lang)
    } catch (e) {
      // Ignore if electron is not available
    }

    return true
  }
  return false
}

// Get current language
export function getCurrentLanguage () {
  return i18n.locale
}

export default i18n
