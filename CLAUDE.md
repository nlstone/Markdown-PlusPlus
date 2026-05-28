# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MarkDown++** is an Electron-based desktop Markdown editor — a fork of [MarkText](https://github.com/marktext/marktext) with ZRead mode, split-pane preview, i18n, and AI-powered editing. Built with Vue 2, Vuex, Element UI, and a custom WYSIWYG markdown engine called **Muya**.

- **Repository**: https://github.com/nlstone/Markdown-PlusPlus
- **Default branch**: `dev` (submit PRs here, not `master`)
- **Node.js requirement**: `>=v16` (native modules are automatically rebuilt for Electron's Node version via electron-rebuild)

## Development Commands

```bash
# Install dependencies
yarn install

# Start dev server with hot reload
yarn dev

# Build for production (binaries + installer)
yarn build

# Build binary only (no packaging)
yarn build:bin

# Lint code
yarn lint
yarn lint:fix

# Run tests
yarn test          # unit + e2e
yarn unit          # unit tests only (Karma + Mocha + Chai)
yarn e2e           # e2e tests only (Playwright)
yarn test:specs    # CommonMark/GFM spec tests

# Rebuild native modules (after Node version changes)
yarn rebuild
```

## Architecture

Three-tier Electron architecture:

```
src/main/        → Electron main process (file I/O, windows, menus, IPC)
src/renderer/    → Electron renderer process (Vue 2 UI, Vuex store, CodeMirror)
src/muya/        → Pure JS markdown engine (WYSIWYG editor, no Electron/Node APIs)
src/common/      → Shared utilities (Node.js only, usable by main + renderer)
```

**Entry points:**
- Main process: `src/main/index.js` → initializes `App` from `src/main/app/index.js`
- Renderer process: `src/renderer/main.js` → bootstraps Vue app with router, store, i18n

**Key renderer store modules** (`src/renderer/store/`):
- `editor.js` (~47KB) — core editor state, document management, tabs
- `zread.js` — ZRead reading mode state
- `preferences.js` — user settings
- `layout.js`, `toolbar.js`, `commandCenter.js` — UI state

**IPC communication**: Main and renderer processes communicate asynchronously via IPC for file operations and native dialogs. See `docs/dev/ARCHITECTURE.md` for details.

## Style Guide

- 2-space indentation, no semicolons
- ES6 + JSDoc for documentation
- Use `import` aliases: `common` for `src/common/`, `@` for `src/renderer/`, `muya` for `src/muya/`
- Run `yarn lint` to validate; follow `standard` ESLint rules (see `.eslintrc.js`)

## Key Files and Directories

| Path | Purpose |
|------|---------|
| `src/main/index.js` | Main process entry |
| `src/renderer/main.js` | Renderer process entry |
| `src/muya/` | Core markdown editor engine (own webpack config) |
| `electron-builder.yml` | Build/packaging configuration |
| `.electron-vue/` | Webpack configs and build scripts |
| `docs/dev/` | Developer documentation (architecture, build, debugging, release) |
| `shell-ext/` | Windows shell extension (context menu integration) |

## Important Notes

- **Node.js version is strict**: must be >=16 and <17. Using other versions will break native module compilation.
- **Muya must stay pure**: no Electron or Node.js APIs allowed in `src/muya/` — only JS, BOM, and DOM APIs.
- **Single-instance app**: production builds prevent multiple instances.
- **Submit PRs to `dev`**: the default branch for development is `dev`, not `master`.
- **Native modules**: `keytar`, `fontmanager-redux`, `native-keymap`, `ced` require `node-gyp` rebuild after Node changes (`yarn rebuild`).
