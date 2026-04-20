<template>
  <div
    v-if="visible"
    class="smart-rewrite-panel"
    :style="panelStyle"
    @click.stop
  >
    <!-- 标题栏 -->
    <div class="panel-header">
      <span class="panel-title">{{ $t('smartRewrite.title') }}</span>
      <button class="close-btn" @click="handleCancel">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>

    <!-- 改写选项按钮组 -->
    <div class="rewrite-options">
      <button
        v-for="option in rewriteOptions"
        :key="option.key"
        :class="['option-btn', { active: currentOption === option.key }]"
        :disabled="loading"
        @click="selectOption(option.key)"
      >
        {{ $t(`smartRewrite.options.${option.key}`) }}
      </button>
    </div>

    <!-- 原文预览 -->
    <div class="original-text">
      <label>{{ $t('smartRewrite.originalText') }}</label>
      <div class="text-preview">{{ truncatedOriginal }}</div>
    </div>

    <!-- 改写结果（流式显示） -->
    <div class="rewrite-result">
      <label>{{ $t('smartRewrite.resultText') }}</label>
      <div class="result-preview">
        <div v-if="loading && !resultText" class="thinking-indicator">
          <span class="thinking-text">{{ $t('smartRewrite.processing') }}</span>
          <span class="thinking-dots">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </span>
        </div>
        <span v-else>{{ resultText || '-' }}</span>
      </div>
    </div>

    <!-- 多轮对话输入 -->
    <div v-if="!loading && resultText" class="additional-input">
      <input
        v-model="additionalInstruction"
        :placeholder="$t('smartRewrite.additionalPlaceholder')"
        @keydown.enter="handleAdditionalRequest"
      />
      <button @click="handleAdditionalRequest" :disabled="loading || !additionalInstruction.trim()">
        {{ $t('smartRewrite.send') }}
      </button>
    </div>

    <!-- 操作按钮 -->
    <div class="panel-actions">
      <button class="accept-btn" :disabled="loading || !resultText" @click="handleAccept">
        {{ $t('smartRewrite.accept') }}
      </button>
      <button class="retry-btn" :disabled="loading" @click="handleRetry">
        {{ $t('smartRewrite.retry') }}
      </button>
      <button class="cancel-btn" @click="handleCancel">
        {{ $t('smartRewrite.cancel') }}
      </button>
    </div>

    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script>
import bus from '../../bus'

export default {
  name: 'SmartRewritePanel',
  data () {
    return {
      visible: false,
      originalText: '',
      selectionInfo: null,
      currentOption: 'rewrite',
      resultText: '',
      loading: false,
      error: '',
      additionalInstruction: '',
      conversationHistory: [],
      streamingBuffer: '',
      lastUpdateTime: 0,
      panelPosition: { x: 0, y: 0 },
      rewriteOptions: [
        { key: 'rewrite', label: '改写' },
        { key: 'polish', label: '润色' },
        { key: 'abbreviate', label: '缩写' },
        { key: 'expand', label: '扩写' },
        { key: 'simplify', label: '简化' },
        { key: 'formalize', label: '正式化' }
      ]
    }
  },
  computed: {
    aiSettings () {
      return this.$store.state.preferences.aiSettings
    },
    hasConfig () {
      const settings = this.aiSettings
      return settings && settings.baseUrl && settings.apiKey
    },
    truncatedOriginal () {
      if (this.originalText.length > 100) {
        return this.originalText.substring(0, 100) + '...'
      }
      return this.originalText
    },
    panelStyle () {
      return {
        left: `${this.panelPosition.x}px`,
        top: `${this.panelPosition.y}px`
      }
    }
  },
  created () {
    bus.$on('smart-rewrite-open', this.showPanel)
  },
  beforeDestroy () {
    bus.$off('smart-rewrite-open', this.showPanel)
  },
  methods: {
    showPanel (data) {
      if (!this.hasConfig) {
        this.error = this.$t('smartRewrite.noConfig')
        return
      }

      if (!data || !data.text) {
        this.error = this.$t('smartRewrite.noSelection')
        return
      }

      this.originalText = data.text
      this.selectionInfo = data.selectionInfo
      this.resultText = ''
      this.error = ''
      this.additionalInstruction = ''
      this.conversationHistory = []
      this.currentOption = 'rewrite'

      // Calculate panel position
      this.calculatePosition(data.cursorCoords)

      this.visible = true
      this.$nextTick(() => {
        this.requestRewrite()
      })
    },

    calculatePosition (cursorCoords) {
      if (!cursorCoords) {
        this.panelPosition = { x: 100, y: 100 }
        return
      }

      // Get window dimensions
      const windowWidth = window.innerWidth
      const windowHeight = window.innerHeight

      // Panel dimensions (approximate)
      const panelWidth = 360
      const panelHeight = 400

      // Calculate position, keeping panel within viewport
      let x = cursorCoords.x + 10
      let y = cursorCoords.y + 20

      // Adjust if panel would overflow right edge
      if (x + panelWidth > windowWidth - 20) {
        x = windowWidth - panelWidth - 20
      }

      // Adjust if panel would overflow bottom edge
      if (y + panelHeight > windowHeight - 20) {
        y = cursorCoords.y - panelHeight - 10
        if (y < 20) y = 20
      }

      this.panelPosition = { x, y }
    },

    selectOption (option) {
      if (this.loading) return
      this.currentOption = option
      this.resultText = ''
      this.conversationHistory = []
      this.error = ''
      this.requestRewrite()
    },

    getPrompt (option) {
      const prompts = {
        rewrite: `请将以下文本进行改写，保持原意但换一种表达方式。只输出改写后的文本，不要添加任何解释或额外内容：\n\n${this.originalText}`,
        polish: `请将以下文本进行润色，优化表达方式，使其更加流畅优美。只输出润色后的文本，不要添加任何解释或额外内容：\n\n${this.originalText}`,
        abbreviate: `请将以下文本进行缩写，保留核心信息，使内容更加简洁。只输出缩写后的文本，不要添加任何解释或额外内容：\n\n${this.originalText}`,
        expand: `请将以下文本进行扩写，补充更多细节和内容。只输出扩写后的文本，不要添加任何解释或额外内容：\n\n${this.originalText}`,
        simplify: `请将以下文本进行简化，去除冗余表达，使内容更加清晰易懂。只输出简化后的文本，不要添加任何解释或额外内容：\n\n${this.originalText}`,
        formalize: `请将以下文本改写为正式风格，适合商务或学术场合。只输出改写后的文本，不要添加任何解释或额外内容：\n\n${this.originalText}`
      }
      return prompts[option] || prompts.rewrite
    },

    async requestRewrite (additionalPrompt = null) {
      if (!this.hasConfig) {
        this.error = this.$t('smartRewrite.noConfig')
        return
      }

      this.loading = true
      this.error = ''
      this.streamingBuffer = ''
      this.lastUpdateTime = 0

      const systemPrompt = '你是一个专业的文本改写助手。请根据用户的要求改写文本，只输出改写后的结果，不要添加任何解释或额外内容。'

      let userPrompt = additionalPrompt || this.getPrompt(this.currentOption)

      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory,
        { role: 'user', content: userPrompt }
      ]

      try {
        const response = await fetch(`${this.aiSettings.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.aiSettings.apiKey}`
          },
          body: JSON.stringify({
            model: this.aiSettings.model || 'gpt-3.5-turbo',
            messages,
            temperature: this.aiSettings.temperature || 0.7,
            stream: true
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          let errorMsg = response.status
          try {
            const errorJson = JSON.parse(errorText)
            errorMsg = errorJson.error?.message || response.status
          } catch (e) {}
          throw new Error(`${this.$t('smartRewrite.error')}: ${errorMsg}`)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim()
              if (data === '[DONE]' || !data) continue
              try {
                const json = JSON.parse(data)
                const content = json.choices?.[0]?.delta?.content
                if (content) {
                  this.streamingBuffer += content
                  const now = Date.now()
                  if (now - this.lastUpdateTime >= 50) {
                    this.resultText = this.streamingBuffer
                    this.lastUpdateTime = now
                  }
                }
              } catch (e) {}
            }
          }
        }

        // Final update
        this.resultText = this.streamingBuffer

        // Add to conversation history
        if (!additionalPrompt) {
          this.conversationHistory = []
        }
        this.conversationHistory.push(
          { role: 'user', content: userPrompt },
          { role: 'assistant', content: this.resultText }
        )

        // Limit history length
        if (this.conversationHistory.length > 10) {
          this.conversationHistory = this.conversationHistory.slice(-10)
        }
      } catch (err) {
        console.error('Smart rewrite error:', err)
        this.error = err.message
      } finally {
        this.loading = false
        this.streamingBuffer = ''
      }
    },

    handleAdditionalRequest () {
      if (!this.additionalInstruction.trim() || this.loading) return

      const prompt = `${this.additionalInstruction}\n\n当前文本：${this.resultText}`
      this.additionalInstruction = ''
      this.resultText = ''
      this.requestRewrite(prompt)
    },

    handleRetry () {
      if (this.loading) return
      this.resultText = ''
      this.conversationHistory = []
      this.requestRewrite()
    },

    handleAccept () {
      if (!this.resultText || this.loading) return

      bus.$emit('smart-rewrite-accept', {
        selectionInfo: this.selectionInfo,
        newText: this.resultText
      })

      this.visible = false
      this.resetState()
    },

    handleCancel () {
      this.visible = false
      this.resetState()
    },

    resetState () {
      this.originalText = ''
      this.selectionInfo = null
      this.resultText = ''
      this.error = ''
      this.additionalInstruction = ''
      this.conversationHistory = []
    }
  }
}
</script>

<style scoped>
.smart-rewrite-panel {
  position: fixed;
  width: 360px;
  max-height: 480px;
  background: var(--floatBgColor, #ffffff);
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--borderColor);
  background: var(--sideBarBgColor);
}

.panel-title {
  font-weight: 600;
  color: var(--sideBarColor);
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--iconColor);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: var(--itemBgColor);
}

.rewrite-options {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--borderColor);
}

.option-btn {
  padding: 6px 12px;
  border: 1px solid var(--borderColor);
  border-radius: 4px;
  background: var(--sideBarBgColor);
  color: var(--sideBarColor);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.option-btn:hover:not(:disabled) {
  background: var(--itemBgColor);
}

.option-btn.active {
  background: var(--themeColor);
  color: white;
  border-color: var(--themeColor);
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.original-text,
.rewrite-result {
  padding: 12px 16px;
  border-bottom: 1px solid var(--borderColor);
}

.original-text label,
.rewrite-result label {
  display: block;
  font-size: 12px;
  color: var(--iconColor);
  margin-bottom: 6px;
}

.text-preview,
.result-preview {
  padding: 10px 12px;
  background: var(--sideBarBgColor);
  border-radius: 6px;
  color: var(--sideBarColor);
  line-height: 1.5;
  max-height: 80px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.result-preview {
  min-height: 40px;
  max-height: 100px;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--iconColor);
}

.thinking-text {
  opacity: 0.7;
}

.thinking-dots {
  display: flex;
  gap: 2px;
}

.thinking-dots .dot {
  width: 4px;
  height: 4px;
  background: var(--themeColor);
  border-radius: 50%;
  animation: dot-pulse 1.4s ease-in-out infinite;
}

.thinking-dots .dot:nth-child(1) { animation-delay: 0s; }
.thinking-dots .dot:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots .dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-pulse {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}

.additional-input {
  padding: 12px 16px;
  border-bottom: 1px solid var(--borderColor);
  display: flex;
  gap: 8px;
}

.additional-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--borderColor);
  border-radius: 4px;
  background: var(--sideBarBgColor);
  color: var(--sideBarColor);
  font-size: 12px;
}

.additional-input input:focus {
  outline: none;
  border-color: var(--themeColor);
}

.additional-input button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background: var(--themeColor);
  color: white;
  cursor: pointer;
  font-size: 12px;
}

.additional-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.panel-actions {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  justify-content: center;
}

.accept-btn,
.retry-btn,
.cancel-btn {
  padding: 8px 16px;
  border: 1px solid var(--borderColor);
  border-radius: 4px;
  background: var(--sideBarBgColor);
  color: var(--sideBarColor);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.accept-btn {
  background: var(--themeColor);
  color: white;
  border-color: var(--themeColor);
}

.accept-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.retry-btn:hover:not(:disabled),
.cancel-btn:hover:not(:disabled) {
  background: var(--itemBgColor);
}

.accept-btn:disabled,
.retry-btn:disabled,
.cancel-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 8px 16px;
  background: rgba(231, 76, 60, 0.1);
  color: #e74c3c;
  font-size: 12px;
  text-align: center;
}
</style>
