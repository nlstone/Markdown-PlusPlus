<template>
  <div class="ai-assistant">
    <div class="ai-header">
      <h3>AI 助手</h3>
      <div class="header-actions">
        <button class="clear-history-btn" @click="clearHistory" :disabled="messages.length === 0" title="清空对话">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
          </svg>
        </button>
        <button class="close-btn" @click="togglePanel">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="ai-content">
      <div v-if="!hasConfig" class="no-config">
        <p>请先配置 AI 设置</p>
        <button @click="showSettings = true">去设置</button>
      </div>
      <div v-else class="chat-area">
        <!-- 对话历史区域 - 在上面 -->
        <div class="messages-area" ref="messagesArea">
          <div v-if="messages.length === 0 && !loading" class="empty-hint">
            <div class="welcome-icon">
              <svg viewBox="0 0 24 24" width="48" height="48">
                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <p>开始与 AI 对话</p>
            <p class="hint-text">输入问题后点击发送</p>
          </div>
          <div v-else class="messages-list">
            <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.role">
              <div class="message-avatar">
                <div v-if="msg.role === 'user'" class="avatar user-avatar">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <div v-else class="avatar ai-avatar">
                  <svg viewBox="0 0 24 24" width="20" height="20">
                    <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                </div>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(msg.content)"></div>
                <div v-if="msg.role === 'assistant' && index === messages.length - 1 && loading && !msg.content" class="thinking-indicator">
                  <span class="thinking-text">AI 思考中</span>
                  <span class="thinking-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </span>
                </div>
                <!-- AI response action buttons -->
                <div v-if="msg.role === 'assistant' && msg.content && !loading" class="message-actions">
                  <button class="action-btn" @click="applyToDocument('insert', msg.content)" title="插入到光标位置">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    插入
                  </button>
                  <button v-if="hasSelection" class="action-btn" @click="applyToDocument('replace', msg.content)" title="替换选中内容">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    替换选中
                  </button>
                  <button class="action-btn" @click="applyToDocument('replaceAll', msg.content)" title="替换整个文档">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                    全文替换
                  </button>
                  <button class="action-btn" @click="copyToClipboard(msg.content)" title="复制到剪贴板">
                    <svg viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    复制
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="loading && messages.length === 0" class="loading-center">
            <span class="loading-spinner"></span>
            AI 思考中...
          </div>
        </div>

        <!-- 输入区域 - 在下面 -->
        <div class="input-area">
          <textarea
            v-model="inputText"
            placeholder="输入您的问题或文本..."
            @keydown.enter.ctrl="handleSend"
            ref="inputTextarea"
          ></textarea>
          <div class="input-actions">
            <select v-model="currentAction" class="action-select">
              <option v-for="action in aiActions" :key="action.key" :value="action.key">
                {{ action.label }}
              </option>
            </select>
            <button class="send-btn" :class="{ 'loading-state': loading }" :disabled="!inputText.trim() || loading" @click="handleSend">
              <span class="btn-content">
                <svg v-if="!loading" class="send-icon" viewBox="0 0 24 24" width="16" height="16">
                  <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
                <span v-if="loading" class="loading-spinner small"></span>
                <span class="btn-text">{{ loading ? '处理中...' : '发送' }}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="ai-footer">
      <button class="settings-link" @click="showSettings = true">
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a7.09 7.09 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87a.48.48 0 0 0 .12.61l2.03 1.58c-.04.31-.06.63-.06.94 0 .31.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 0 0-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/>
        </svg>
        AI 设置
      </button>
    </div>

    <!-- 设置弹窗 -->
    <div v-if="showSettings" class="settings-modal" @click.self="showSettings = false">
      <div class="settings-content">
        <h3>AI 设置</h3>
        <div class="form-item">
          <label>协议</label>
          <select v-model="localSettings.protocol" class="protocol-select">
            <option value="openai">OpenAI 兼容</option>
            <option value="anthropic">Anthropic</option>
          </select>
        </div>
        <div class="form-item">
          <label>Base URL</label>
          <input v-model="localSettings.baseUrl" :placeholder="protocolDefaults.baseUrl" />
        </div>
        <div class="form-item">
          <label>API Key</label>
          <input v-model="localSettings.apiKey" type="password" :placeholder="protocolDefaults.apiKeyPlaceholder" />
        </div>
        <div class="form-item">
          <label>模型</label>
          <input v-model="localSettings.model" :placeholder="protocolDefaults.modelPlaceholder" />
        </div>
        <div class="form-actions">
          <button @click="testConnection">测试连接</button>
          <button @click="saveSettings">保存</button>
          <button @click="showSettings = false">取消</button>
        </div>
        <div v-if="testResult" class="test-result" :class="{ success: testSuccess, error: !testSuccess }">
          {{ testResult }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import bus from '@/bus'
import notice from '@/services/notification'
import { callLLM, getProtocolDefaults, normalizeLLMSettings, testLLMConnection } from '@/services/llmClient'

export default {
  name: 'AiAssistant',
  data () {
    return {
      showSettings: false,
      loading: false,
      inputText: '',
      currentAction: 'qa',
      messages: [],
      streamingBuffer: '', // Buffer for streaming content
      lastUpdateTime: 0, // Track last update time for throttling
      localSettings: {
        baseUrl: '',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        protocol: 'openai'
      },
      testResult: '',
      testSuccess: false,
      aiActions: [
        { key: 'qa', label: '问答' },
        { key: 'rewrite', label: '改写' },
        { key: 'polish', label: '润色' },
        { key: 'continue', label: '续写' },
        { key: 'insert', label: '插入' },
        { key: 'replace', label: '替换' }
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
    currentDocument () {
      return this.$store.state.editor.currentFile || {}
    },
    currentMarkdown () {
      return this.currentDocument.markdown || ''
    },
    currentFilename () {
      return this.currentDocument.filename || '未命名文档'
    },
    currentSelection () {
      return this.$store.state.editor.currentSelection || ''
    },
    hasDocument () {
      return !!this.currentMarkdown
    },
    hasSelection () {
      return !!this.currentSelection
    },
    protocolDefaults () {
      return getProtocolDefaults(this.localSettings.protocol)
    }
  },
  watch: {
    aiSettings: {
      handler (val) {
        if (val) {
          this.localSettings = normalizeLLMSettings(val)
        }
      },
      immediate: true,
      deep: true
    },
    'localSettings.protocol' (value, oldValue) {
      if (!oldValue || value === oldValue) return
      const oldDefaults = getProtocolDefaults(oldValue)
      const nextDefaults = getProtocolDefaults(value)
      if (!this.localSettings.baseUrl || this.localSettings.baseUrl === oldDefaults.baseUrl) {
        this.localSettings.baseUrl = nextDefaults.baseUrl
      }
      if (!this.localSettings.model || this.localSettings.model === oldDefaults.model) {
        this.localSettings.model = nextDefaults.model
      }
    }
  },
  created () {
    // Load history once when component is created
    this.loadHistory()
  },
  methods: {
    loadHistory () {
      const history = this.$store.state.preferences.aiHistory
      if (history && Array.isArray(history) && history.length > 0) {
        this.messages = [...history]
      }
    },

    togglePanel () {
      this.$store.dispatch('TOGGLE_AI_PANEL')
    },

    scrollToBottom () {
      if (this.$refs.messagesArea) {
        this.$refs.messagesArea.scrollTop = this.$refs.messagesArea.scrollHeight
      }
    },

    formatMessage (content) {
      if (!content) return ''
      return content.replace(/\n/g, '<br>')
    },

    async handleSend () {
      if (!this.inputText.trim()) return
      this.loading = true
      this.streamingBuffer = ''
      this.lastUpdateTime = 0

      const userMessage = this.inputText.trim()
      this.messages.push({ role: 'user', content: userMessage })
      this.inputText = ''
      this.$nextTick(() => this.scrollToBottom())

      // Build action-specific prompt with document context
      let promptText = userMessage
      const hasDoc = this.hasDocument
      const hasSel = this.hasSelection
      const docName = this.currentFilename
      const docContent = this.currentMarkdown
      const selection = this.currentSelection

      switch (this.currentAction) {
        case 'rewrite': {
          if (hasSel) {
            promptText = `请改写以下选中的文本（来自文档"${docName}"），保持原意但换一种表达方式。只输出改写后的文本，不要添加任何解释：\n\n${selection}`
          } else {
            promptText = `请改写以下文本，保持原意但换一种表达方式：\n\n${userMessage}`
          }
          break
        }
        case 'polish': {
          if (hasSel) {
            promptText = `请润色以下选中的文本（来自文档"${docName}"），优化表达方式，使其更加流畅优美。只输出润色后的文本，不要添加任何解释：\n\n${selection}`
          } else {
            promptText = `请润色以下文本，优化表达方式：\n\n${userMessage}`
          }
          break
        }
        case 'continue': {
          if (hasDoc) {
            promptText = `请根据以下文档内容续写（文档名："${docName}"）。在续写前，请先简要理解文档主题，然后自然地继续内容。只输出续写部分，不要重复原文：\n\n${docContent}\n\n用户要求：${userMessage}`
          } else {
            promptText = `请续写以下文本：\n\n${userMessage}`
          }
          break
        }
        case 'insert': {
          promptText = `请根据以下要求生成内容，用于插入到文档"${docName}"中。只输出要插入的内容，不要添加任何解释：\n\n用户要求：${userMessage}`
          if (hasDoc) {
            promptText += `\n\n当前文档内容（供参考）：\n${docContent.substring(0, 2000)}${docContent.length > 2000 ? '...' : ''}`
          }
          break
        }
        case 'replace': {
          if (hasSel) {
            promptText = `请根据以下要求，重新生成选中的文本内容（来自文档"${docName}"）。只输出替换后的文本，不要添加任何解释：\n\n当前选中内容：\n${selection}\n\n用户要求：${userMessage}`
          } else if (hasDoc) {
            promptText = `请根据以下要求，修改文档"${docName}"的内容。只输出修改后的完整文档内容，不要添加任何解释：\n\n当前文档内容：\n${docContent}\n\n用户要求：${userMessage}`
          } else {
            promptText = `请根据以下要求生成内容：\n\n${userMessage}`
          }
          break
        }
        case 'qa': {
          if (hasDoc) {
            promptText = `你是文档"${docName}"的AI助手。请基于以下文档内容回答用户问题。如果问题与文档无关，请直接回答。\n\n文档内容：\n${docContent.substring(0, 3000)}${docContent.length > 3000 ? '...' : ''}\n\n用户问题：${userMessage}`
          } else {
            promptText = userMessage
          }
          break
        }
        default: {
          promptText = userMessage
        }
      }

      const systemPrompt = hasDoc
        ? `你是一个专业的Markdown写作助手。当前用户正在编辑文档"${docName}"。你可以查看文档内容、选中文本，并根据用户要求修改文档。请用中文回答，保持专业简洁。当用户要求你修改文档时，只输出修改后的内容，不要添加解释。`
        : '你是一个专业的Markdown写作助手，帮助用户进行文本编辑、改写、润色和问答。请用中文回答，保持回答简洁专业。'

      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...this.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: promptText }
      ]

      this.messages.push({ role: 'assistant', content: '' })
      const lastIndex = this.messages.length - 1

      try {
        for await (const content of callLLM(apiMessages, this.aiSettings)) {
          this.streamingBuffer += content
          const now = Date.now()
          if (now - this.lastUpdateTime >= 50) {
            this.messages[lastIndex].content = this.streamingBuffer
            this.lastUpdateTime = now
            this.scrollToBottom()
          }
        }

        // Final update with complete content
        this.messages[lastIndex].content = this.streamingBuffer
      } catch (error) {
        console.error('AI request error:', error)
        this.messages[lastIndex].content = `错误: ${error.message}`
      } finally {
        this.loading = false
        this.streamingBuffer = ''
        this.saveHistory()
        this.$nextTick(() => this.scrollToBottom())
      }
    },

    saveHistory () {
      const historyToSave = this.messages.slice(-50)
      this.$store.dispatch('SET_SINGLE_PREFERENCE', {
        type: 'aiHistory',
        value: historyToSave
      })
    },

    clearHistory () {
      this.messages = []
      this.$store.dispatch('SET_SINGLE_PREFERENCE', {
        type: 'aiHistory',
        value: []
      })
    },

    async testConnection () {
      this.testResult = '测试中...'
      this.testSuccess = false

      try {
        const result = await testLLMConnection(this.localSettings)
        if (result.ok) {
          this.testResult = '连接成功！'
          this.testSuccess = true
        } else {
          this.testResult = `连接失败: ${result.error}`
          this.testSuccess = false
        }
      } catch (error) {
        this.testResult = `连接失败: ${error.message}`
        this.testSuccess = false
      }
    },

    saveSettings () {
      this.$store.dispatch('SET_SINGLE_PREFERENCE', {
        type: 'aiSettings',
        value: normalizeLLMSettings(this.localSettings)
      })
      this.showSettings = false
    },

    applyToDocument (type, content) {
      if (!content) return

      switch (type) {
        case 'insert': {
          // Insert at cursor position
          bus.$emit('ai-replace-selection', content)
          notice.notify({
            title: 'AI 助手',
            message: '内容已插入到光标位置',
            type: 'success',
            time: 2000
          })
          break
        }
        case 'replace': {
          // Replace selected text
          if (!this.hasSelection) {
            notice.notify({
              title: 'AI 助手',
              message: '请先选中文本再使用替换功能',
              type: 'warning',
              time: 3000
            })
            return
          }
          bus.$emit('smart-rewrite-accept', {
            selectionInfo: this.$store.state.editor.currentSelectionInfo,
            newText: content
          })
          notice.notify({
            title: 'AI 助手',
            message: '已替换选中内容',
            type: 'success',
            time: 2000
          })
          break
        }
        case 'replaceAll': {
          // Replace entire document
          bus.$emit('ai-replace-document', content)
          notice.notify({
            title: 'AI 助手',
            message: '已替换整个文档内容',
            type: 'success',
            time: 2000
          })
          break
        }
        default:
          break
      }
    },

    async copyToClipboard (content) {
      if (!content) return
      try {
        await navigator.clipboard.writeText(content)
        notice.notify({
          title: 'AI 助手',
          message: '内容已复制到剪贴板',
          type: 'success',
          time: 2000
        })
      } catch (err) {
        console.error('Failed to copy:', err)
        notice.notify({
          title: 'AI 助手',
          message: '复制失败，请手动复制',
          type: 'error',
          time: 3000
        })
      }
    }
  }
}
</script>

<style scoped>
.ai-assistant {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bgColor);
  border-left: 1px solid var(--borderColor);
  flex-shrink: 0;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--borderColor);
}

.ai-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--sideBarColor);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.clear-history-btn,
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

.clear-history-btn:hover,
.close-btn:hover {
  background: var(--itemBgColor);
}

.clear-history-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.ai-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 12px 16px;
}

.no-config {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--iconColor);
  text-align: center;
}

.no-config button {
  margin-top: 12px;
  font-size: 13px;
  padding: 8px 16px;
  border: 1px solid var(--borderColor);
  background: var(--themeColor);
  color: white;
  border-radius: 4px;
  cursor: pointer;
}

.chat-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;
}

/* 消息历史区域 */
.messages-area {
  flex: 1;
  overflow-y: auto;
  min-height: 100px;
}

.empty-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--iconColor);
  text-align: center;
}

.welcome-icon {
  opacity: 0.5;
  margin-bottom: 16px;
}

.empty-hint p {
  margin: 4px 0;
  font-size: 14px;
}

.hint-text {
  font-size: 13px;
  opacity: 0.7;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}

.message {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  flex-shrink: 0;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  background: var(--themeColor);
  color: white;
}

.ai-avatar {
  background: var(--sideBarBgColor);
  border: 1px solid var(--borderColor);
  color: var(--themeColor);
}

.message-content {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.message.user .message-content {
  background: var(--themeColor);
  color: white;
  border-radius: 8px 2px 8px 8px;
}

.message.assistant .message-content {
  background: var(--sideBarBgColor);
  border: 1px solid var(--borderColor);
  color: var(--sideBarColor);
  border-radius: 2px 8px 8px 8px;
}

.message-text {
  white-space: pre-wrap;
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  margin-top: 8px;
  background: var(--sideBarBgColor);
  border-radius: 6px;
  font-size: 13px;
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

.thinking-dots .dot:nth-child(1) {
  animation-delay: 0s;
}

.thinking-dots .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.thinking-dots .dot:nth-child(3) {
  animation-delay: 0.4s;
}

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

.loading-center {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  color: var(--iconColor);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--borderColor);
  border-top-color: var(--themeColor);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.loading-spinner.small {
  width: 12px;
  height: 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 输入区域 */
.input-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.input-area textarea {
  width: 100%;
  min-height: 60px;
  max-height: 120px;
  padding: 10px;
  border: 1px solid var(--borderColor);
  border-radius: 8px;
  background: var(--sideBarBgColor);
  color: var(--sideBarColor);
  font-size: 13px;
  resize: none;
  box-sizing: border-box;
}

.input-area textarea:focus {
  outline: none;
  border-color: var(--themeColor);
}

.input-actions {
  display: flex;
  gap: 8px;
}

.action-select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--borderColor);
  border-radius: 6px;
  background: var(--sideBarBgColor);
  color: var(--sideBarColor);
  font-size: 13px;
  cursor: pointer;
}

.send-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: var(--themeColor);
  color: white;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 80px;
  transition: all 0.2s ease;
}

.send-btn .btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.send-btn .send-icon {
  flex-shrink: 0;
}

.send-btn .btn-text {
  white-space: nowrap;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  opacity: 0.9;
}

.send-btn.loading-state {
  /* Keep green background, just show spinner */
}

.ai-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--borderColor);
}

.settings-link {
  display: flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  color: var(--iconColor);
  font-size: 12px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.settings-link:hover {
  background: var(--itemBgColor);
  color: var(--sideBarColor);
}

/* 设置弹窗 */
.settings-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.settings-content {
  background: var(--floatBgColor, #ffffff);
  padding: 20px;
  border-radius: 8px;
  width: 320px;
  max-width: 90%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid var(--floatBorderColor, #e0e0e0);
}

.settings-content h3 {
  margin: 0 0 16px;
  font-size: 16px;
  color: var(--floatFontColor, #333333);
}

.form-item {
  margin-bottom: 12px;
}

.form-item label {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
  color: var(--floatFontColor, #666666);
}

.form-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  border-radius: 4px;
  background: var(--floatBgColor, #f5f5f5);
  color: var(--floatFontColor, #333333);
  font-size: 13px;
  box-sizing: border-box;
}

.form-item .protocol-select {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  border-radius: 4px;
  background: var(--floatBgColor, #f5f5f5);
  color: var(--floatFontColor, #333333);
  font-size: 13px;
  box-sizing: border-box;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.form-actions button {
  flex: 1;
  padding: 8px;
  border: 1px solid var(--floatBorderColor, #e0e0e0);
  background: var(--floatBgColor, #ffffff);
  color: var(--floatFontColor, #333333);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
}

.form-actions button:hover {
  background: var(--itemBgColor, #f0f0f0);
}

.form-actions button:first-child {
  background: var(--themeColor);
  color: white;
  border-color: var(--themeColor);
}

.test-result {
  margin-top: 12px;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.test-result.success {
  background: rgba(46, 204, 113, 0.2);
  color: #2ecc71;
}

.test-result.error {
  background: rgba(231, 76, 60, 0.2);
  color: #e74c3c;
}

/* Message action buttons */
.message-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--borderColor);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.message.assistant:hover .message-actions {
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid var(--borderColor);
  border-radius: 4px;
  background: var(--sideBarBgColor);
  color: var(--iconColor);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--themeColor);
  color: white;
  border-color: var(--themeColor);
}

.action-btn svg {
  flex-shrink: 0;
}
</style>
