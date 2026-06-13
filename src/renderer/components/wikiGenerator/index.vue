<template>
  <div v-if="visible" class="wiki-modal-overlay" @click.self="handleOverlayClick">
    <div class="wiki-modal" :class="{ 'wiki-modal--generating': isBusy }">
      <!-- Header -->
      <div class="wiki-modal__header">
        <div class="wiki-modal__header-left">
          <svg class="wiki-modal__icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="currentColor" d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z"/>
          </svg>
          <h3>{{ $t('wiki.generateTitle') }}</h3>
        </div>
        <button class="wiki-modal__close" @click="handleClose" :disabled="isBusy">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <!-- Steps indicator -->
      <div class="wiki-modal__steps">
        <div class="step" :class="{ 'step--active': currentStep === 1, 'step--done': currentStep > 1 }">
          <span class="step__number">1</span>
          <span class="step__label">{{ $t('wiki.stepConfig') }}</span>
        </div>
        <div class="step__line" :class="{ 'step__line--active': currentStep > 1 }"></div>
        <div class="step" :class="{ 'step--active': currentStep === 2 || currentStep === 3, 'step--done': currentStep > 3 }">
          <span class="step__number">2</span>
          <span class="step__label">{{ $t('wiki.stepOutline') }}</span>
        </div>
        <div class="step__line" :class="{ 'step__line--active': currentStep > 3 }"></div>
        <div class="step" :class="{ 'step--active': currentStep === 4 || currentStep === 5, 'step--done': currentStep > 5 }">
          <span class="step__number">3</span>
          <span class="step__label">{{ $t('wiki.stepGenerate') }}</span>
        </div>
      </div>

      <!-- Body -->
      <div class="wiki-modal__body">
        <!-- Step 1: Configuration -->
        <div v-if="currentStep === 1" class="wiki-modal__content">
          <div class="config-card">
            <div class="config-card__icon">
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
            <div class="config-card__info">
              <div class="config-card__label">{{ $t('wiki.projectPath') }}</div>
              <div class="config-card__value" :class="{ 'config-card__value--empty': !projectPath }">
                {{ projectPath || $t('wiki.noProject') }}
              </div>
            </div>
            <button v-if="!projectPath" class="config-card__btn" @click="openFolder">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/>
              </svg>
              {{ $t('wiki.openFolder') }}
            </button>
          </div>

          <div class="config-form">
            <div class="config-form__item">
              <label class="config-form__label">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z"/>
                </svg>
                {{ $t('wiki.language') }}
              </label>
              <div class="config-form__select-wrapper">
                <select v-model="selectedLanguage" class="config-form__select">
                  <option value="zh">中文</option>
                  <option value="en">English</option>
                </select>
                <svg class="config-form__select-arrow" viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
            </div>

            <div class="config-form__item">
              <label class="config-form__label">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                {{ $t('wiki.generationMode') }}
              </label>
              <div class="config-form__select-wrapper">
                <select v-model="selectedMode" class="config-form__select">
                  <option value="fast">{{ $t('wiki.modeFast') }}</option>
                  <option value="deep">{{ $t('wiki.modeDeep') }}</option>
                </select>
                <svg class="config-form__select-arrow" viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
              <p class="config-form__hint">{{ selectedMode === 'fast' ? $t('wiki.modeFastHint') : $t('wiki.modeDeepHint') }}</p>
            </div>

            <div class="config-form__item">
              <label class="config-form__label">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {{ $t('wiki.protocol') }}
              </label>
              <div class="config-form__select-wrapper">
                <select v-model="selectedProtocol" class="config-form__select">
                  <option value="openai">OpenAI 兼容</option>
                  <option value="anthropic">Anthropic</option>
                </select>
                <svg class="config-form__select-arrow" viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
              </div>
            </div>
          </div>

          <div class="config-form">
            <div class="config-form__item config-form__item--full">
              <label class="config-form__label">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                </svg>
                {{ $t('wiki.tokenBudget') }}
              </label>
              <div class="config-form__range-wrapper">
                <input type="range" v-model.number="tokenBudget" min="16000" max="1000000" step="16000" class="config-form__range" />
                <span class="config-form__range-value">{{ formatTokens(tokenBudget) }}</span>
              </div>
              <p class="config-form__hint">{{ $t('wiki.tokenBudgetHint') }}</p>
            </div>
          </div>

          <!-- AI Config Warning -->
          <div v-if="!hasAiConfig" class="config-warning">
            <div class="config-warning__icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <div class="config-warning__content">
              <p class="config-warning__title">{{ $t('wiki.noAiConfig') }}</p>
              <button class="config-warning__btn" @click="openAiSettings">{{ $t('wiki.goToSettings') }}</button>
            </div>
          </div>

          <!-- Existing Wiki Warning -->
          <div v-if="hasExistingWiki" class="config-warning config-warning--info">
            <div class="config-warning__icon">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <div class="config-warning__content">
              <p class="config-warning__title">{{ $t('wiki.existingWiki') }}</p>
              <p class="config-warning__desc">{{ $t('wiki.existingWikiDesc') }}</p>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="config-error">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Step 2: Generating outline -->
        <div v-if="currentStep === 2" class="wiki-modal__content wiki-modal__content--center">
          <div class="generating-visual">
            <div class="generating-spinner">
              <svg viewBox="0 0 50 50" class="spinner-svg">
                <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"/>
              </svg>
            </div>
            <div class="generating-info">
              <p class="generating-title">{{ progressMessage || $t('wiki.preparing') }}</p>
            </div>
          </div>

          <div class="progress-bar-wrapper">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <span class="progress-bar-label">{{ progressPercent }}%</span>
          </div>
        </div>

        <!-- Step 3: Outline preview -->
        <div v-if="currentStep === 3" class="wiki-modal__content">
          <div class="outline-header">
            <svg class="outline-header__icon" viewBox="0 0 24 24" width="20" height="20">
              <path fill="currentColor" d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/>
            </svg>
            <span class="outline-header__title">{{ $t('wiki.outlinePreview') }}</span>
            <span class="outline-header__count">{{ $t('wiki.outlinePageCount', { count: outlinePageCount }) }}</span>
          </div>

          <div class="outline-tree">
            <div v-for="(section, si) in outlineSections" :key="si" class="outline-section">
              <div class="outline-section__title">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/>
                </svg>
                {{ section.title }}
              </div>
              <div v-for="(page, pi) in section.pages" :key="pi" class="outline-page">
                <span class="outline-page__title">{{ page.title }}</span>
                <span class="outline-page__importance" :class="'outline-page__importance--' + page.importance">
                  {{ page.importance }}
                </span>
              </div>
              <div v-if="!section.pages.length" class="outline-section__empty">
                {{ $t('wiki.noPages') }}
              </div>
            </div>
          </div>

          <div v-if="outlineStructure && outlineStructure.description" class="outline-desc">
            {{ outlineStructure.description }}
          </div>

          <!-- Error in outline preview -->
          <div v-if="error" class="config-error">
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>{{ error }}</span>
          </div>
        </div>

        <!-- Step 4: Generating content -->
        <div v-if="currentStep === 4" class="wiki-modal__content wiki-modal__content--center">
          <div class="generating-visual">
            <div class="generating-spinner">
              <svg viewBox="0 0 50 50" class="spinner-svg">
                <circle class="spinner-path" cx="25" cy="25" r="20" fill="none" stroke-width="4"/>
              </svg>
            </div>
            <div class="generating-info">
              <p class="generating-title">{{ progressMessage || $t('wiki.preparing') }}</p>
              <p v-if="progress.total > 0 && progress.currentPage" class="generating-count">
                {{ progress.current }} / {{ progress.total }} {{ $t('wiki.pages') }}
              </p>
            </div>
          </div>

          <div class="progress-bar-wrapper">
            <div class="progress-bar-track">
              <div class="progress-bar-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
            <span class="progress-bar-label">{{ progressPercent }}%</span>
          </div>

          <div v-if="generatedPages.length > 0" class="generated-pages">
            <div class="generated-pages__title">{{ $t('wiki.generatedPages') }}</div>
            <div class="generated-pages__list">
              <div v-for="(page, i) in generatedPages" :key="i" class="generated-page-item">
                <svg class="generated-page-item__check" viewBox="0 0 24 24" width="14" height="14">
                  <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <span class="generated-page-item__title">{{ page.title }}</span>
                <span class="generated-page-item__section">{{ page.section }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5: Complete -->
        <div v-if="currentStep === 5" class="wiki-modal__content wiki-modal__content--center">
          <div class="complete-visual">
            <svg class="complete-icon" viewBox="0 0 24 24" width="64" height="64">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h4 class="complete-title">{{ $t('wiki.generationComplete') }}</h4>
            <p class="complete-desc">{{ $t('wiki.pagesGenerated', { count: generatedPages.length }) }}</p>
          </div>

          <div class="complete-actions">
            <button class="complete-action-btn" @click="openWikiSidebar">
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path fill="currentColor" d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v10H7V7zm4 0h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z"/>
              </svg>
              {{ $t('wiki.viewInSidebar') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="wiki-modal__footer">
        <button v-if="currentStep === 1" class="btn btn--secondary" @click="handleClose">
          {{ $t('wiki.cancel') }}
        </button>
        <button v-if="currentStep === 1" class="btn btn--primary" :disabled="!canGenerate" @click="handleGenerate">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M5 13h4v-2H5v2zm0 4h4v-2H5v2zm0-8h4V7H5v2zm12 8h4v-2h-4v2zm0-4h4v-2h-4v2zm0-6v2h4V7h-4zm-6 12h2V3h-2v18z"/>
          </svg>
          {{ $t('wiki.generateOutline') }}
        </button>
        <button v-if="currentStep === 2 || currentStep === 4" class="btn btn--danger" @click="handleCancel">
          {{ $t('wiki.cancel') }}
        </button>
        <template v-if="currentStep === 3">
          <button class="btn btn--secondary" @click="handleRegenerate">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            {{ $t('wiki.regenerate') }}
          </button>
          <button class="btn btn--primary" @click="handleContinueGenerate">
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path fill="currentColor" d="M5 13h4v-2H5v2zm0 4h4v-2H5v2zm0-8h4V7H5v2zm12 8h4v-2h-4v2zm0-4h4v-2h-4v2zm0-6v2h4V7h-4zm-6 12h2V3h-2v18z"/>
            </svg>
            {{ $t('wiki.continueGenerate') }}
          </button>
        </template>
        <button v-if="currentStep === 5" class="btn btn--primary" @click="handleClose">
          {{ $t('wiki.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapState } from 'vuex'
import bus from '@/bus'
import { generateOutline, generateContent } from '@/services/wikiGenerator'

export default {
  name: 'WikiGenerator',
  data () {
    return {
      visible: false,
      currentStep: 1, // 1=config, 2=generating outline, 3=outline preview, 4=generating content, 5=complete
      selectedLanguage: 'zh',
      selectedProtocol: 'openai',
      selectedMode: 'fast', // 'fast' or 'deep'
      tokenBudget: 150000,
      error: null,
      progressMessage: '',
      progress: { current: 0, total: 0, currentPage: '' },
      generatedPages: [],
      abortController: null,
      // Outline phase data
      outlineStructure: null,
      outlineContext: null
    }
  },
  computed: {
    ...mapState({
      aiSettings: state => state.preferences.aiSettings,
      projectTree: state => state.project.projectTree,
      hasWiki: state => state.wiki.hasWiki
    }),
    projectPath () {
      return this.projectTree?.pathname || ''
    },
    hasAiConfig () {
      return this.aiSettings && this.aiSettings.baseUrl && this.aiSettings.apiKey
    },
    hasExistingWiki () {
      return this.hasWiki
    },
    canGenerate () {
      return this.projectPath && this.hasAiConfig
    },
    isBusy () {
      return this.currentStep === 2 || this.currentStep === 4
    },
    progressPercent () {
      if (this.progress.total === 0) return 0
      return Math.round((this.progress.current / this.progress.total) * 100)
    },
    outlinePageCount () {
      return this.outlineStructure?.pages?.length || 0
    },
    outlineSections () {
      if (!this.outlineStructure) return []
      const { sections, pages } = this.outlineStructure
      return sections.map(section => ({
        title: section.title,
        pages: section.pageRefs
          .map(ref => pages.find(p => p.id === ref))
          .filter(Boolean)
      }))
    }
  },
  created () {
    bus.$on('show-wiki-generator', this.show)
  },
  beforeDestroy () {
    bus.$off('show-wiki-generator', this.show)
    if (this.abortController) {
      this.abortController.abort()
    }
  },
  methods: {
    detectProtocol (baseUrl) {
      if (!baseUrl) return 'openai'
      const lower = baseUrl.toLowerCase()
      if (lower.includes('anthropic')) return 'anthropic'
      return 'openai'
    },
    openFolder () {
      ipcRenderer.send('mt::cmd-open-folder')
    },
    show () {
      this.visible = true
      this.currentStep = 1
      this.error = null
      this.progressMessage = ''
      this.progress = { current: 0, total: 0, currentPage: '' }
      this.generatedPages = []
      this.outlineStructure = null
      this.outlineContext = null
      // Auto-detect protocol from baseUrl, or use saved preference
      this.selectedProtocol = this.aiSettings?.protocol || this.detectProtocol(this.aiSettings?.baseUrl)
    },
    handleClose () {
      if (this.isBusy) return
      this.visible = false
    },
    formatTokens (tokens) {
      if (tokens >= 1000) {
        return `${Math.round(tokens / 1000)}K`
      }
      return tokens.toString()
    },
    handleOverlayClick () {
      if (!this.isBusy) {
        this.handleClose()
      }
    },
    openAiSettings () {
      this.visible = false
      bus.$emit('view:toggle-ai-panel')
    },
    openWikiSidebar () {
      this.$store.commit('SET_LAYOUT', { rightColumn: 'wiki', showSideBar: true })
      this.handleClose()
    },
    /**
     * Phase 1: Generate outline only
     */
    async handleGenerate () {
      if (!this.canGenerate) return

      this.currentStep = 2
      this.error = null
      this.generatedPages = []
      this.outlineStructure = null
      this.outlineContext = null
      this.progressMessage = this.$t('wiki.preparing')
      this.abortController = new AbortController()

      try {
        const settings = {
          ...this.aiSettings,
          protocol: this.selectedProtocol
        }

        const generator = generateOutline({
          rootPath: this.projectPath,
          language: this.selectedLanguage,
          aiSettings: settings,
          signal: this.abortController.signal,
          mode: this.selectedMode,
          tokensPerBatch: this.tokenBudget
        })

        for await (const event of generator) {
          switch (event.type) {
            case 'progress':
              this.progressMessage = event.message
              this.progress = { current: event.current, total: event.total, currentPage: event.currentPage || '' }
              break
            case 'outline':
              this.outlineStructure = event.structure
              this.outlineContext = event.context
              this.currentStep = 3
              break
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          this.currentStep = 1
          this.error = this.$t('wiki.cancelled')
        } else {
          this.currentStep = 1
          this.error = err.message || this.$t('wiki.generationFailed')
        }
      }
    },
    /**
     * Regenerate outline (back to step 2)
     */
    async handleRegenerate () {
      this.outlineStructure = null
      this.outlineContext = null
      await this.handleGenerate()
    },
    /**
     * Phase 2: Generate content from confirmed outline
     */
    async handleContinueGenerate () {
      if (!this.outlineContext) return

      this.currentStep = 4
      this.error = null
      this.generatedPages = []
      this.progressMessage = this.$t('wiki.preparing')
      this.abortController = new AbortController()

      try {
        const generator = generateContent(this.outlineContext, this.abortController.signal)

        for await (const event of generator) {
          switch (event.type) {
            case 'progress':
              this.progressMessage = event.message
              this.progress = { current: event.current, total: event.total, currentPage: event.currentPage || '' }
              break
            case 'page':
              this.generatedPages.push(event.page)
              break
            case 'done':
              this.currentStep = 5
              this.$store.dispatch('wiki/CHECK_WIKI', { rootPath: this.projectPath, force: true })
              break
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          this.currentStep = 3
          this.error = this.$t('wiki.cancelled')
        } else {
          this.currentStep = 3
          this.error = err.message || this.$t('wiki.generationFailed')
        }
      }
    },
    handleCancel () {
      if (this.abortController) {
        this.abortController.abort()
        this.abortController = null
      }
    }
  }
}
</script>

<style scoped>
.wiki-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.wiki-modal {
  background: var(--floatBgColor, #ffffff);
  border-radius: 12px;
  width: 580px;
  max-width: 90%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  animation: slideUp 0.3s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Header */
.wiki-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--floatBorderColor, #e0e0e0);
  background: var(--sideBarBgColor, #f8f9fa);
}

.wiki-modal__header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.wiki-modal__icon {
  color: var(--themeColor, #4285f4);
}

.wiki-modal__header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--floatFontColor, #333333);
}

.wiki-modal__close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  color: var(--iconColor, #999);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.wiki-modal__close:hover:not(:disabled) {
  background: var(--itemBgColor, #f0f0f0);
  color: var(--floatFontColor, #333);
}

.wiki-modal__close:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Steps */
.wiki-modal__steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 24px;
  gap: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.4;
  transition: opacity 0.3s ease;
}

.step--active {
  opacity: 1;
}

.step--done {
  opacity: 0.7;
}

.step__number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--borderColor, #e0e0e0);
  color: var(--iconColor, #999);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.3s ease;
}

.step--active .step__number {
  background: var(--themeColor, #4285f4);
  color: white;
}

.step--done .step__number {
  background: #2ecc71;
  color: white;
}

.step__label {
  font-size: 12px;
  color: var(--floatFontColor, #333);
  font-weight: 500;
}

.step__line {
  width: 40px;
  height: 2px;
  background: var(--borderColor, #e0e0e0);
  transition: background 0.3s ease;
}

.step__line--active {
  background: #2ecc71;
}

/* Body */
.wiki-modal__body {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  min-height: 300px;
}

.wiki-modal__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.wiki-modal__content--center {
  align-items: center;
  justify-content: center;
}

/* Config Card */
.config-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--sideBarBgColor, #f8f9fa);
  border-radius: 8px;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
}

.config-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--themeColor, #4285f4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.config-card__info {
  flex: 1;
  min-width: 0;
}

.config-card__label {
  font-size: 11px;
  color: var(--iconColor, #999);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.config-card__value {
  font-size: 13px;
  color: var(--floatFontColor, #333);
  font-family: monospace;
  word-break: break-all;
}

.config-card__value--empty {
  color: var(--iconColor, #999);
  font-style: italic;
}

.config-card__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  border-radius: 6px;
  background: var(--floatBgColor, #fff);
  color: var(--floatFontColor, #333);
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
}

.config-card__btn:hover {
  background: var(--themeColor, #4285f4);
  color: white;
  border-color: var(--themeColor, #4285f4);
}

/* Config Form */
.config-form {
  display: flex;
  gap: 12px;
}

.config-form__item {
  flex: 1;
}

.config-form__label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--iconColor, #999);
  margin-bottom: 6px;
  font-weight: 500;
}

.config-form__select-wrapper {
  position: relative;
}

.config-form__select {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  border-radius: 6px;
  background: var(--floatBgColor, #fff);
  color: var(--floatFontColor, #333);
  font-size: 13px;
  cursor: pointer;
  appearance: none;
  transition: border-color 0.2s ease;
}

.config-form__select:focus {
  outline: none;
  border-color: var(--themeColor, #4285f4);
}

.config-form__select-arrow {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--iconColor, #999);
  pointer-events: none;
}

.config-form__item--full {
  flex: none;
  width: 100%;
}

.config-form__range-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-form__range {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--borderColor, #e0e0e0);
  border-radius: 2px;
  outline: none;
}

.config-form__range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--themeColor, #4285f4);
  cursor: pointer;
}

.config-form__range-value {
  min-width: 40px;
  font-size: 13px;
  font-weight: 600;
  color: var(--floatFontColor, #333);
  text-align: right;
}

.config-form__hint {
  margin: 6px 0 0;
  font-size: 11px;
  color: var(--iconColor, #999);
}

/* Warning */
.config-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: rgba(255, 152, 0, 0.08);
  border: 1px solid rgba(255, 152, 0, 0.2);
  border-radius: 8px;
}

.config-warning--info {
  background: rgba(66, 133, 244, 0.08);
  border-color: rgba(66, 133, 244, 0.2);
}

.config-warning__icon {
  color: #ff9800;
  flex-shrink: 0;
  margin-top: 2px;
}

.config-warning--info .config-warning__icon {
  color: var(--themeColor, #4285f4);
}

.config-warning__content {
  flex: 1;
}

.config-warning__title {
  margin: 0 0 6px;
  font-size: 13px;
  color: var(--floatFontColor, #333);
  font-weight: 500;
}

.config-warning__desc {
  margin: 0;
  font-size: 12px;
  color: var(--iconColor, #999);
}

.config-warning__btn {
  margin-top: 8px;
  padding: 6px 14px;
  font-size: 12px;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  background: var(--floatBgColor, #fff);
  color: var(--floatFontColor, #333);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.config-warning__btn:hover {
  background: var(--itemBgColor, #f0f0f0);
}

/* Error */
.config-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.2);
  border-radius: 8px;
  color: #e74c3c;
  font-size: 13px;
}

/* Generating */
.generating-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.generating-spinner {
  width: 60px;
  height: 60px;
}

.spinner-svg {
  animation: rotate 2s linear infinite;
}

.spinner-path {
  stroke: var(--themeColor, #4285f4);
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

.generating-info {
  text-align: center;
}

.generating-title {
  margin: 0 0 4px;
  font-size: 14px;
  color: var(--floatFontColor, #333);
  font-weight: 500;
}

.generating-count {
  margin: 0;
  font-size: 12px;
  color: var(--iconColor, #999);
}

/* Progress bar */
.progress-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.progress-bar-track {
  flex: 1;
  height: 6px;
  background: var(--borderColor, #e0e0e0);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--themeColor, #4285f4), #34a853);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-bar-label {
  font-size: 12px;
  color: var(--iconColor, #999);
  min-width: 36px;
  text-align: right;
}

/* Generated pages */
.generated-pages {
  width: 100%;
  max-width: 400px;
  margin-top: 16px;
}

.generated-pages__title {
  font-size: 11px;
  color: var(--iconColor, #999);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.generated-pages__list {
  max-height: 150px;
  overflow-y: auto;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  border-radius: 6px;
  background: var(--sideBarBgColor, #f8f9fa);
}

.generated-page-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--floatBorderColor, #e0e0e0);
}

.generated-page-item:last-child {
  border-bottom: none;
}

.generated-page-item__check {
  color: #2ecc71;
  flex-shrink: 0;
}

.generated-page-item__title {
  flex: 1;
  font-size: 12px;
  color: var(--floatFontColor, #333);
}

.generated-page-item__section {
  font-size: 10px;
  color: var(--iconColor, #999);
  padding: 2px 6px;
  background: var(--borderColor, #e0e0e0);
  border-radius: 3px;
}

/* Complete */
.complete-visual {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.complete-icon {
  color: #2ecc71;
  animation: scaleIn 0.3s ease;
}

@keyframes scaleIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.complete-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--floatFontColor, #333);
}

.complete-desc {
  margin: 0;
  font-size: 13px;
  color: var(--iconColor, #999);
}

.complete-actions {
  display: flex;
  gap: 12px;
}

.complete-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  border-radius: 8px;
  background: var(--floatBgColor, #fff);
  color: var(--floatFontColor, #333);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.complete-action-btn:hover {
  background: var(--themeColor, #4285f4);
  color: white;
  border-color: var(--themeColor, #4285f4);
}

/* Footer */
.wiki-modal__footer {
  padding: 16px 20px;
  border-top: 1px solid var(--floatBorderColor, #e0e0e0);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: var(--sideBarBgColor, #f8f9fa);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.btn--primary {
  background: var(--themeColor, #4285f4);
  color: white;
  border-color: var(--themeColor, #4285f4);
}

.btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--secondary {
  background: var(--floatBgColor, #fff);
  color: var(--floatFontColor, #333);
  border-color: var(--floatBorderColor, #e0e0e0);
}

.btn--secondary:hover {
  background: var(--itemBgColor, #f0f0f0);
}

.btn--danger {
  background: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.btn--danger:hover {
  opacity: 0.9;
}

/* Outline preview */
.outline-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.outline-header__icon {
  color: var(--themeColor, #4285f4);
}

.outline-header__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--floatFontColor, #333);
}

.outline-header__count {
  font-size: 12px;
  color: var(--iconColor, #999);
  margin-left: auto;
  padding: 2px 8px;
  background: var(--borderColor, #e0e0e0);
  border-radius: 10px;
}

.outline-tree {
  max-height: 360px;
  overflow-y: auto;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  border-radius: 8px;
  background: var(--sideBarBgColor, #f8f9fa);
  padding: 8px 0;
}

.outline-section {
  margin-bottom: 4px;
}

.outline-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 600;
  color: var(--floatFontColor, #333);
}

.outline-section__title svg {
  color: var(--themeColor, #4285f4);
  flex-shrink: 0;
}

.outline-page {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px 5px 34px;
  font-size: 12px;
  color: var(--sideBarColor, #666);
}

.outline-page__title {
  flex: 1;
}

.outline-page__importance {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  text-transform: uppercase;
  font-weight: 500;
}

.outline-page__importance--high {
  background: rgba(46, 204, 113, 0.15);
  color: #27ae60;
}

.outline-page__importance--medium {
  background: rgba(52, 152, 219, 0.15);
  color: #2980b9;
}

.outline-page__importance--low {
  background: rgba(155, 89, 182, 0.15);
  color: #8e44ad;
}

.outline-section__empty {
  padding: 4px 14px 4px 34px;
  font-size: 11px;
  color: var(--iconColor, #999);
  font-style: italic;
}

.outline-desc {
  margin-top: 10px;
  padding: 10px 12px;
  font-size: 12px;
  color: var(--iconColor, #999);
  background: var(--sideBarBgColor, #f8f9fa);
  border-radius: 6px;
  line-height: 1.5;
}
</style>
