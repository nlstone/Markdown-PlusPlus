const PROTOCOL_DEFAULTS = {
  openai: {
    protocol: 'openai',
    label: 'OpenAI 兼容',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-3.5-turbo',
    apiKeyPlaceholder: 'sk-...',
    modelPlaceholder: 'gpt-3.5-turbo'
  },
  anthropic: {
    protocol: 'anthropic',
    label: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-20250514',
    apiKeyPlaceholder: 'sk-ant-...',
    modelPlaceholder: 'claude-sonnet-4-20250514'
  }
}
const DEFAULT_REQUEST_TIMEOUT_MS = 300000

export function detectProtocol (baseUrl) {
  if (!baseUrl) return 'openai'
  return baseUrl.toLowerCase().includes('anthropic') ? 'anthropic' : 'openai'
}

export function getProtocolDefaults (protocol = 'openai') {
  return PROTOCOL_DEFAULTS[protocol] || PROTOCOL_DEFAULTS.openai
}

export function normalizeLLMSettings (settings = {}) {
  const protocol = settings.protocol || detectProtocol(settings.baseUrl)
  const defaults = getProtocolDefaults(protocol)

  return {
    ...settings,
    protocol: defaults.protocol,
    baseUrl: settings.baseUrl || defaults.baseUrl,
    model: settings.model || defaults.model,
    temperature: settings.temperature == null ? 0.7 : settings.temperature
  }
}

export async function * callLLM (messages, settings, signal) {
  const normalized = normalizeLLMSettings(settings)

  if (normalized.protocol === 'anthropic') {
    yield * callAnthropic(messages, normalized, signal)
  } else {
    yield * callOpenAI(messages, normalized, signal)
  }
}

export async function collectLLMResponse (messages, settings, signal) {
  let result = ''
  for await (const chunk of callLLM(messages, settings, signal)) {
    result += chunk
  }
  return result
}

export async function testLLMConnection (settings, signal) {
  try {
    await collectLLMResponse([{ role: 'user', content: 'test' }], {
      ...settings,
      stream: false,
      maxTokens: 1
    }, signal)
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

async function * callOpenAI (messages, settings, signal) {
  const url = `${settings.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const request = withRequestTimeout(signal, settings.requestTimeoutMs)
  let response

  try {
    response = await request.race(fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model,
        messages,
        temperature: settings.temperature,
        stream: settings.stream !== false,
        max_tokens: settings.maxTokens
      }),
      signal: request.signal
    }), url)

    await ensureResponseOk(response, url)

    if (settings.stream === false) {
      const json = await request.race(response.json(), url)
      const content = json.choices?.[0]?.message?.content || ''
      if (content) yield content
      return
    }

    yield * parseEventStream(response, event => {
      if (event === '[DONE]') return ''
      const json = parseJsonEvent(event)
      return json?.choices?.[0]?.delta?.content || ''
    }, request, url)
  } catch (error) {
    throw normalizeRequestError(error, url, request)
  } finally {
    request.clear()
  }
}

async function * callAnthropic (messages, settings, signal) {
  const { systemPrompt, userMessages } = splitSystemPrompt(messages)
  const url = getAnthropicMessagesUrl(settings.baseUrl)
  const body = {
    model: settings.model,
    max_tokens: settings.maxTokens || 8192,
    messages: userMessages,
    stream: settings.stream !== false
  }
  if (systemPrompt) body.system = systemPrompt
  if (settings.temperature != null) body.temperature = settings.temperature

  const request = withRequestTimeout(signal, settings.requestTimeoutMs)
  let response

  try {
    response = await request.race(fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body),
      signal: request.signal
    }), url)

    await ensureResponseOk(response, url)

    if (settings.stream === false) {
      const json = await request.race(response.json(), url)
      const content = (json.content || [])
        .filter(item => item.type === 'text' && item.text)
        .map(item => item.text)
        .join('')
      if (content) yield content
      return
    }

    yield * parseEventStream(response, event => {
      const json = parseJsonEvent(event)
      if (json?.type !== 'content_block_delta') return ''
      return json.delta?.text || ''
    }, request, url)
  } catch (error) {
    throw normalizeRequestError(error, url, request)
  } finally {
    request.clear()
  }
}

function splitSystemPrompt (messages) {
  let systemPrompt = ''
  const userMessages = []

  for (const message of messages) {
    if (message.role === 'system') {
      systemPrompt = systemPrompt ? `${systemPrompt}\n\n${message.content}` : message.content
    } else {
      userMessages.push(message)
    }
  }

  return { systemPrompt, userMessages }
}

function getAnthropicMessagesUrl (baseUrl) {
  const base = baseUrl.replace(/\/+$/, '')
  return base.endsWith('/v1') ? `${base}/messages` : `${base}/v1/messages`
}

function withRequestTimeout (externalSignal, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS) {
  const controller = new AbortController()
  let rejectAbort
  const abortPromise = new Promise((resolve, reject) => {
    rejectAbort = reject
  })
  const request = {
    signal: controller.signal,
    timedOut: false,
    race: (promise, url) => {
      request.url = url
      return Promise.race([promise, abortPromise])
    },
    clear: () => {
      clearTimeout(timer)
      controller.signal.removeEventListener('abort', rejectFromAbort)
      if (externalSignal) externalSignal.removeEventListener('abort', abortFromExternalSignal)
    }
  }

  const rejectFromAbort = () => {
    const error = request.timedOut
      ? createTimeoutError(request.url)
      : new DOMException('The operation was aborted.', 'AbortError')
    rejectAbort(error)
  }
  const abortFromExternalSignal = () => {
    controller.abort()
  }
  const timer = setTimeout(() => {
    request.timedOut = true
    controller.abort()
  }, Math.max(1, timeoutMs))

  controller.signal.addEventListener('abort', rejectFromAbort)
  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternalSignal()
    } else {
      externalSignal.addEventListener('abort', abortFromExternalSignal)
    }
  }

  return request
}

function normalizeRequestError (error, url, request) {
  if (request.timedOut) {
    return createTimeoutError(url)
  }
  return error
}

function createTimeoutError (url) {
  return new Error(`API 请求超时 (${url})，请检查网络、模型响应速度，或调低项目文档的每批 Token 预算后重试。`)
}

async function ensureResponseOk (response, url) {
  if (response.ok) return

  const errorText = await response.text()
  let errorMsg = `${response.status} ${response.statusText}`
  try {
    const errorJson = JSON.parse(errorText)
    errorMsg = errorJson.error?.message || errorJson.message || errorMsg
  } catch (e) {}
  throw new Error(`API 请求失败 (${url}): ${errorMsg}`)
}

async function * parseEventStream (response, pickContent, request, url) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await request.race(reader.read(), url)
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop() || ''

    for (const event of events) {
      yield * parseEventData(event, pickContent)
    }
  }

  if (buffer) {
    yield * parseEventData(buffer, pickContent)
  }
}

function * parseEventData (event, pickContent) {
  const dataLines = event
    .split(/\r?\n/)
    .filter(line => line.startsWith('data: '))
    .map(line => line.slice(6).trim())

  for (const data of dataLines) {
    if (!data) continue
    const content = pickContent(data)
    if (content) yield content
  }
}

function parseJsonEvent (event) {
  try {
    return JSON.parse(event)
  } catch (e) {
    return null
  }
}
