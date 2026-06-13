/* eslint-disable no-unused-expressions */

import {
  callLLM,
  collectLLMResponse,
  getProtocolDefaults,
  normalizeLLMSettings,
  testLLMConnection
} from '@/services/llmClient'

const encoder = new TextEncoder()

function streamFromChunks (chunks) {
  let index = 0
  return {
    getReader () {
      return {
        read () {
          if (index >= chunks.length) {
            return Promise.resolve({ done: true })
          }
          return Promise.resolve({
            done: false,
            value: encoder.encode(chunks[index++])
          })
        }
      }
    }
  }
}

function createResponse ({ ok = true, status = 200, statusText = 'OK', chunks = [], text = '', json = {} } = {}) {
  return {
    ok,
    status,
    statusText,
    body: streamFromChunks(chunks),
    text: () => Promise.resolve(text),
    json: () => Promise.resolve(json)
  }
}

describe('LLM Client', () => {
  let originalFetch
  let requests

  beforeEach(() => {
    originalFetch = window.fetch
    requests = []
  })

  afterEach(() => {
    window.fetch = originalFetch
  })

  it('normalizes OpenAI settings with defaults', () => {
    const settings = normalizeLLMSettings({ apiKey: 'sk-test' })

    expect(settings.protocol).to.equal('openai')
    expect(settings.baseUrl).to.equal('https://api.openai.com/v1')
    expect(settings.model).to.equal('gpt-3.5-turbo')
  })

  it('normalizes Anthropic settings with defaults', () => {
    const settings = normalizeLLMSettings({ protocol: 'anthropic', apiKey: 'sk-ant-test' })

    expect(settings.protocol).to.equal('anthropic')
    expect(settings.baseUrl).to.equal('https://api.anthropic.com')
    expect(settings.model).to.equal('claude-sonnet-4-20250514')
  })

  it('returns protocol-specific UI defaults', () => {
    expect(getProtocolDefaults('openai').baseUrl).to.equal('https://api.openai.com/v1')
    expect(getProtocolDefaults('anthropic').apiKeyPlaceholder).to.equal('sk-ant-...')
  })

  it('streams OpenAI chat completion chunks', async () => {
    window.fetch = (url, options) => {
      requests.push({ url, options })
      return Promise.resolve(createResponse({
        chunks: [
          'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
          'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
          'data: [DONE]\n\n'
        ]
      }))
    }

    const content = await collectLLMResponse([
      { role: 'user', content: 'Say hello' }
    ], {
      protocol: 'openai',
      baseUrl: 'https://example.test/v1',
      apiKey: 'sk-test',
      model: 'gpt-test'
    })

    expect(content).to.equal('Hello')
    expect(requests[0].url).to.equal('https://example.test/v1/chat/completions')
    expect(requests[0].options.headers.Authorization).to.equal('Bearer sk-test')
    expect(JSON.parse(requests[0].options.body).stream).to.equal(true)
  })

  it('parses a final OpenAI event without a trailing blank line', async () => {
    window.fetch = (url, options) => {
      requests.push({ url, options })
      return Promise.resolve(createResponse({
        chunks: [
          'data: {"choices":[{"delta":{"content":"Tail"}}]}'
        ]
      }))
    }

    const content = await collectLLMResponse([
      { role: 'user', content: 'Say tail' }
    ], {
      protocol: 'openai',
      baseUrl: 'https://example.test/v1',
      apiKey: 'sk-test',
      model: 'gpt-test'
    })

    expect(content).to.equal('Tail')
  })

  it('streams Anthropic message chunks and separates system prompt', async () => {
    window.fetch = (url, options) => {
      requests.push({ url, options })
      return Promise.resolve(createResponse({
        chunks: [
          'event: content_block_delta\n',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hel"}}\n\n',
          'event: content_block_delta\n',
          'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"lo"}}\n\n',
          'event: message_stop\n',
          'data: {"type":"message_stop"}\n\n'
        ]
      }))
    }

    const chunks = []
    for await (const chunk of callLLM([
      { role: 'system', content: 'Be concise' },
      { role: 'user', content: 'Say hello' }
    ], {
      protocol: 'anthropic',
      baseUrl: 'https://api.anthropic.com/v1',
      apiKey: 'sk-ant-test',
      model: 'claude-test'
    })) {
      chunks.push(chunk)
    }

    const body = JSON.parse(requests[0].options.body)
    expect(chunks.join('')).to.equal('Hello')
    expect(requests[0].url).to.equal('https://api.anthropic.com/v1/messages')
    expect(requests[0].options.headers['x-api-key']).to.equal('sk-ant-test')
    expect(requests[0].options.headers['anthropic-version']).to.equal('2023-06-01')
    expect(body.system).to.equal('Be concise')
    expect(body.messages).to.deep.equal([{ role: 'user', content: 'Say hello' }])
    expect(body.stream).to.equal(true)
  })

  it('tests Anthropic connections with the Anthropic endpoint', async () => {
    window.fetch = (url, options) => {
      requests.push({ url, options })
      return Promise.resolve(createResponse({
        json: {
          content: [{ type: 'text', text: 'ok' }]
        }
      }))
    }

    const result = await testLLMConnection({
      protocol: 'anthropic',
      apiKey: 'sk-ant-test'
    })

    expect(result.ok).to.equal(true)
    expect(requests[0].url).to.equal('https://api.anthropic.com/v1/messages')
    expect(JSON.parse(requests[0].options.body).stream).to.equal(false)
  })
})
