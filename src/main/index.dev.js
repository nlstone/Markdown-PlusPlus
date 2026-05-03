/**
 * This file is used specifically and only for development. It installs
 * `vue-devtools`. There shouldn't be any need to modify this file,
 * but it can be used to extend your development environment.
 */

/* eslint-disable */
require('dotenv').config()

// Install `vue-devtools` (optional, can fail on newer Electron versions)
require('electron').app.on('ready', () => {
  try {
    const { default: installExtension, VUEJS_DEVTOOLS } = require('electron-devtools-installer')
    installExtension(VUEJS_DEVTOOLS)
      .then(() => {})
      .catch(() => {}) // Silently ignore - vue-devtools is optional for development
  } catch (_) {
    // electron-devtools-installer may not be available
  }
})

/* eslint-enable */

// Require `main` process to boot app
require('./index')
