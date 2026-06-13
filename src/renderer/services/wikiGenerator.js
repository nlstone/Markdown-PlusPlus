/**
 * Wiki Generator Service
 *
 * Generates technical wiki documentation for a local project directory.
 * Uses LLM to analyze code structure and generate markdown pages.
 * Output format is compatible with ZRead (.zread) under .md++ directory.
 *
 * Uses intelligent batching: reads files once, analyzes in batches, generates outline, then content.
 * Prompts adapted from deepwiki-open for high-quality documentation generation.
 */

import { ipcRenderer } from 'electron'

// Token estimation constants
const CHARS_PER_TOKEN = 4 // Average for code
const TOKENS_PER_FILE_META = 100 // File path + metadata overhead
const MAX_FILES_PER_BATCH = 50 // Max files per LLM request

// Wiki generation modes
const WIKI_MODE = {
  FAST: 'fast', // Quick overview, token-efficient
  DEEP: 'deep' // Comprehensive documentation, no token limits
}

// Mode-specific configurations
const MODE_CONFIG = {
  [WIKI_MODE.FAST]: {
    linesPerFile: 300,
    maxFilesToRead: 100,
    batchEnabled: true,
    tokensPerBatch: 150000,
    pageCountMin: 15,
    pageCountMax: 25,
    additionalFilesPerPage: 5,
    diagramsPerSection: 1,
    includeTests: false
  },
  [WIKI_MODE.DEEP]: {
    linesPerFile: 0, // 0 = full file
    maxFilesToRead: 999999, // no limit
    batchEnabled: false,
    tokensPerBatch: 999999,
    pageCountMin: 25,
    pageCountMax: 40,
    additionalFilesPerPage: 20,
    diagramsPerSection: 3,
    includeTests: true
  }
}

/**
 * Estimate token count for a string
 */
function estimateTokens (text) {
  if (!text) return 0
  return Math.ceil(text.length / CHARS_PER_TOKEN) + TOKENS_PER_FILE_META
}

/**
 * IPC helper: read file tree
 */
function readFileTree (rootPath) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('File tree read timeout')), 30000)

    ipcRenderer.once('mt::wiki-file-tree-result', (e, result) => {
      clearTimeout(timeout)
      resolve(result)
    })
    ipcRenderer.once('mt::wiki-file-tree-error', (e, error) => {
      clearTimeout(timeout)
      reject(new Error(error.message))
    })
    ipcRenderer.send('mt::wiki-read-file-tree', rootPath)
  })
}

/**
 * IPC helper: read specific file contents
 */
function readFiles (rootPath, filePaths, maxLines) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('File read timeout')), 60000)

    ipcRenderer.once('mt::wiki-read-files-result', (e, result) => {
      clearTimeout(timeout)
      resolve(result.files)
    })
    ipcRenderer.once('mt::wiki-read-files-error', (e, error) => {
      clearTimeout(timeout)
      reject(new Error(error.message))
    })
    ipcRenderer.send('mt::wiki-read-files', { rootPath, filePaths, maxLines })
  })
}

/**
 * IPC helper: save wiki
 */
function saveWiki (rootPath, wikiJson, pages) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Wiki save timeout')), 15000)

    ipcRenderer.once('mt::wiki-save-result', (e, result) => {
      clearTimeout(timeout)
      if (result.success) resolve(result)
      else reject(new Error('Save failed'))
    })
    ipcRenderer.once('mt::wiki-save-error', (e, error) => {
      clearTimeout(timeout)
      reject(new Error(error.message))
    })
    ipcRenderer.send('mt::wiki-save', { rootPath, wikiJson, pages })
  })
}

// ============================================================================
// LLM Call Functions
// ============================================================================

/**
 * Detect protocol based on baseUrl
 */
function detectProtocol (baseUrl) {
  if (!baseUrl) return 'openai'
  const lower = baseUrl.toLowerCase()
  if (lower.includes('anthropic')) return 'anthropic'
  return 'openai'
}

/**
 * Call LLM with support for both OpenAI and Anthropic protocols
 */
async function * callLLM (messages, settings, signal) {
  const { baseUrl, apiKey, model, temperature } = settings
  // Auto-detect protocol if not explicitly set, or use override
  const protocol = settings.protocol || detectProtocol(baseUrl)

  if (protocol === 'anthropic') {
    yield * callAnthropic(messages, { baseUrl, apiKey, model, temperature }, signal)
  } else {
    yield * callOpenAI(messages, { baseUrl, apiKey, model, temperature }, signal)
  }
}

async function * callOpenAI (messages, { baseUrl, apiKey, model, temperature }, signal) {
  // Use same URL pattern as aiAssistant for consistency
  const url = `${baseUrl}/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model || 'gpt-3.5-turbo',
      messages,
      temperature: temperature || 0.7,
      stream: true
    }),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMsg = `${response.status} ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMsg = errorJson.error?.message || errorJson.message || errorMsg
    } catch (e) {}
    throw new Error(`API 请求失败 (${url}): ${errorMsg}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]' || !data) continue
      try {
        const json = JSON.parse(data)
        const content = json.choices?.[0]?.delta?.content
        if (content) yield content
      } catch (e) {}
    }
  }
}

async function * callAnthropic (messages, { baseUrl, apiKey, model, temperature }, signal) {
  let systemPrompt = ''
  const userMessages = []
  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content
    } else {
      userMessages.push(msg)
    }
  }

  // Build URL - avoid duplicate /v1
  const base = baseUrl.replace(/\/+$/, '')
  const url = base.endsWith('/v1') ? `${base}/messages` : `${base}/v1/messages`

  const body = {
    model: model || 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: userMessages,
    stream: true
  }
  if (systemPrompt) body.system = systemPrompt
  if (temperature) body.temperature = temperature

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body),
    signal
  })

  if (!response.ok) {
    const errorText = await response.text()
    let errorMsg = `${response.status} ${response.statusText}`
    try {
      const errorJson = JSON.parse(errorText)
      errorMsg = errorJson.error?.message || errorJson.message || errorMsg
    } catch (e) {}
    throw new Error(`API 请求失败 (${url}): ${errorMsg}`)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (!data) continue
      try {
        const json = JSON.parse(data)
        if (json.type === 'content_block_delta' && json.delta?.text) {
          yield json.delta.text
        }
      } catch (e) {}
    }
  }
}

/**
 * Call LLM and collect full response
 */
async function callLLMFull (messages, settings, signal) {
  let result = ''
  for await (const chunk of callLLM(messages, settings, signal)) {
    result += chunk
  }
  return result
}

// ============================================================================
// Prompt Templates
// ============================================================================

/**
 * Batch analysis prompt - analyze a batch of files to understand their roles
 */
function getBatchAnalysisPrompt (files, language, mode = WIKI_MODE.FAST) {
  const filesContent = Object.entries(files).map(([path, data]) => {
    if (data.error) return `### ${path}\n(Error: ${data.error})\n`
    const truncated = data.truncated ? `\n... (文件共 ${data.lines} 行，仅显示前 ${data.content.split('\n').length} 行)` : ''
    return `### ${path}\n\`\`\`\n${data.content}\n\`\`\`${truncated}\n`
  }).join('\n')

  const isDeepMode = mode === WIKI_MODE.DEEP
  const detailLevel = isDeepMode ? '详细' : '简洁'

  if (language === 'zh') {
    return `分析以下源代码文件，理解每个文件的职责和它们之间的关系。

${filesContent}

请��以下格式输出分析结果（每个文件一条）：

文件路径 | 主要职责 | 关键导出/接口 | 与其他文件的关系
--------|---------|--------------|----------------
src/main.js | 应用入口，初始化窗口 | createWindow() | 依赖 app.js, menu.js
src/app.js | 应用生命周期管理 | App 类 | 被 main.js 使用
...

${detailLevel}明了，每个文件的分析控制在 ${isDeepMode ? '2-4' : '1-2'} 行。${isDeepMode ? '\n\n对于核心文件，请详细说明：\n- 重要的类和方法及其作用\n- 关键的数据结构\n- 核心算法逻辑' : ''}`
  } else {
    return `Analyze the following source code files to understand each file's responsibilities and their relationships.

${filesContent}

Please output the analysis in the following format (one entry per file):

File Path | Main Responsibility | Key Exports/Interfaces | Relationships
----------|-------------------|----------------------|--------------
src/main.js | App entry, window init | createWindow() | Depends on app.js, menu.js
src/app.js | App lifecycle management | App class | Used by main.js
...

Be ${detailLevel.toLowerCase()}, keep each file's analysis to ${isDeepMode ? '2-4' : '1-2'} lines.${isDeepMode ? '\n\nFor core files, please elaborate:\n- Important classes and methods and their purposes\n- Key data structures\n- Core algorithm logic' : ''}`
  }
}

/**
 * Project summary prompt - synthesize batch analyses into a comprehensive project understanding
 */
function getProjectSummaryPrompt (batchAnalyses, fileTree, readme, language, mode = WIKI_MODE.FAST) {
  const analysesText = batchAnalyses.join('\n\n---\n\n')
  const isDeepMode = mode === WIKI_MODE.DEEP

  if (language === 'zh') {
    return `基于以下代码仓库的逐文件分析结果，综合提炼出一份结构化的项目摘要。

## 项目文件树
<file_tree>
${fileTree}
</file_tree>

## README
<readme>
${readme || '(无 README)'}
</readme>

## 逐文件分析
<file_analyses>
${analysesText}
</file_analyses>

请输出以下结构化摘要（使用 markdown 格式）：

### 项目定位
用 2-3 句话描述项目的核心价值和目标用户。

### 技术栈
列出主要技术栈（语言、框架、关键库）。

### 架构模式
描述整体架构模式（如 MVC、微服务、事件驱动等）。

### 核心功能清单
列出项目提供的所有核心功能/能力，每个功能包含：
- 功能名称
- 功能描述（1 句话）
- 实现该功能的关键文件

例如：对于一个检测工具项目，应列出所有检测方法；对于一个 API 项目，应列出所有端点；对于一个组件库，应列出所有组件。

### 核心模块
按重要性排序，列出 ${isDeepMode ? '10-15' : '5-10'} 个核心模块，每个模块包含：
- 模块名称
- 职责描述（1-2 句话）
- 关键文件路径
- 对外接口/导出

### 模块依赖关系
描述核心模块之间的依赖和调用关系（文字描述，如"A 依赖 B，C 被 D 和 E 调用"）。

### 关键数据流
描述 ${isDeepMode ? '4-5' : '2-3'} 个最重要的数据流/工作流（如"用户请求 → 路由 → 控制器 → 数据库 → 响应"）。

### 配置与部署
${isDeepMode ? '详细' : '简'}述项目的配置方式和部署方式。

### 独特特性
列出此项目区别于同类项目的 ${isDeepMode ? '4-5' : '2-3'} 个独特设计或特性。

${isDeepMode ? '### 详细模块分析\n对于每个核心模块，请提供：\n- 详细的职责说明\n- 核心类/函数清单\n- 对外 API 列表\n- 关键数据流\n\n' : ''}请确保摘要基于实际代码分析结果，不要臆测。`
  } else {
    return `Based on the following per-file analysis results of a code repository, synthesize a comprehensive structured project summary.

## Project File Tree
<file_tree>
${fileTree}
</file_tree>

## README
<readme>
${readme || '(No README found)'}
</readme>

## Per-File Analyses
<file_analyses>
${analysesText}
</file_analyses>

Please output the following structured summary in markdown format:

### Project Positioning
Describe the project's core value and target users in 2-3 sentences.

### Tech Stack
List the main tech stack (languages, frameworks, key libraries).

### Architecture Pattern
Describe the overall architecture pattern (e.g., MVC, microservices, event-driven, etc.).

### Core Feature List
List ALL core features/capabilities the project provides, each including:
- Feature name
- Description (1 sentence)
- Key files implementing this feature

For example: for a detection tool, list all detection methods; for an API project, list all endpoints; for a component library, list all components.

### Core Modules
List ${isDeepMode ? '10-15' : '5-10'} core modules in order of importance, each including:
- Module name
- Responsibility (1-2 sentences)
- Key file paths
- Public exports/interfaces

### Module Dependencies
Describe dependencies and call relationships between core modules (text description, e.g., "A depends on B, C is called by D and E").

### Key Data Flows
Describe ${isDeepMode ? '4-5' : '2-3'} most important data flows/workflows (e.g., "User request → Router → Controller → Database → Response").

### Configuration & Deployment
${isDeepMode ? 'In detail' : 'Briefly'} describe the project's configuration and deployment approach.

### Unique Features
List ${isDeepMode ? '4-5' : '2-3'} unique design choices or features that distinguish this project from similar ones.

${isDeepMode ? '### Detailed Module Analysis\nFor each core module, provide:\n- Detailed responsibility description\n- Core class/function list\n- Public API list\n- Key data flows\n\n' : ''}Ensure the summary is based on actual code analysis results, not assumptions.`
  }
}

/**
 * Structure generation prompt - generate wiki outline from file analysis
 */
function getStructurePrompt (fileTree, readme, projectSummary, language, mode = WIKI_MODE.FAST) {
  const isDeepMode = mode === WIKI_MODE.DEEP

  if (language === 'zh') {
    return `基于以下代码仓库信息，创建一个 wiki 结构。

## 项目文件树
<file_tree>
${fileTree}
</file_tree>

## README
<readme>
${readme || '(无 README)'}
</readme>

## 项目摘要
<project_summary>
${projectSummary}
</project_summary>

请确定此仓库 wiki 的最合理结构。

## 核心原则

**章节必须反映项目的实际业务领域，不要使用通用模板。**

在设计结构之前，先回答以下问题：
1. 这个项目解决什么问题？它的核心价值是什么？
2. 项目中最重要的功能/模块有哪些？（每个重要功能都应该有独立页面）
3. 用户最需要了解哪些内容才能用好这个项目？
4. 项目有哪些独特的设计或机制值得专门讲解？

## 章节组织要求

采用三级组织结构：**章节 → 分组 → 页面**

### 章节划分原则：
- **不要使用固定的章节模板**（如"入门指南/深度探索/功能扩展"）
- 章节应根据项目的实际功能领域来划分
- 典型的章节模式（选择最适合项目的）：
  - 按功能模块划分（如"检测系统/评分引擎/报告生成"）
  - 按用户旅程划分（如"快速上手/核心功能/高级配置"）
  - 按技术层次划分（如"数据层/业务逻辑/展示层"）
- 第一个章节通常是"入门"或"概述"，其余章节应完全基于项目内容

### 页面设计原则：
- **项目的核心功能必须有独立页面**，不能被合并或省略
- 如果项目有"功能清单"（如检测方法列表、API 端点、组件库），必须有专门页面列出所有项目
- 如果项目有"核心机制"（如算法、协议、工作流），每个机制应有独立的详解页面
- 页面标题要具体明确（如"OpenAI 协议检测方法"而非"检测"）
- 每个页面应有清晰的职责边界，不要有重叠

### 分组要求：
- 每个章节下按主题分组
- 每个分组包含 2-5 个相关页面
- 分组名称应描述内容主题，不要用"其他"或"杂项"

### 难度级别：
- **Beginner**：基础概念、快速上手、概述类页面
- **Intermediate**：核心功能、配置、使用指南类页面
- **Advanced**：底层机制、扩展开发、高级特性类页面

### 页面数量：
- 小型项目（<20 文件）：${isDeepMode ? '15-20' : '10-15'} 个页面
- 中型项目（20-100 文件）：${isDeepMode ? '25-35' : '15-25'} 个页面
- 大型项目（>100 文件）：${isDeepMode ? '35-50' : '20-35'} 个页面

请以以下 XML 格式返回分析结果：

<wiki_structure>
  <title>[Wiki 总标题]</title>
  <description>[仓库简要描述]</description>
  <sections>
    <section id="section-1">
      <title>[章节标题]</title>
      <pages>
        <page_ref>page-1</page_ref>
      </pages>
      <subsections>
        <section_ref>section-2</section_ref>
      </subsections>
    </section>
  </sections>
  <pages>
    <page id="page-1">
      <title>[页面标题]</title>
      <description>[此页面将涵盖内容的简要描述]</description>
      <importance>high|medium|low</importance>
      <group>[分组名称，可选]</group>
      <relevant_files>
        <file_path>[相关文件路径]</file_path>
      </relevant_files>
      <related_pages>
        <related>page-2</related>
      </related_pages>
      <parent_section>section-1</parent_section>
    </page>
  </pages>
</wiki_structure>

重要格式要求：
- 只返回上述指定的有效 XML 结构
- 不要用 markdown 代码块包裹 XML
- 不要在 XML 前后包含任何解释文字
- 以 <wiki_structure> 开头，以 </wiki_structure> 结尾
- 每个页面关注代码库的特定方面
- relevant_files 应该是仓库中用于生成该页面的实际文件
- 只返回上述指定格式的有效 XML`
  } else {
    return `Based on the following code repository information, create a wiki structure.

## Project File Tree
<file_tree>
${fileTree}
</file_tree>

## README
<readme>
${readme || '(No README found)'}
</readme>

## Project Summary
<project_summary>
${projectSummary}
</project_summary>

Determine the most logical structure for a wiki based on the repository's content.

## Core Principle

**Sections must reflect the project's actual business domain. Do NOT use generic templates.**

Before designing the structure, answer these questions:
1. What problem does this project solve? What is its core value?
2. What are the most important features/modules? (Each important feature should have its own page)
3. What do users need to know to use this project effectively?
4. What unique designs or mechanisms deserve dedicated pages?

## Structure Requirements

Use three-level organization: **Sections → Groups → Pages**

### Section Design Principles:
- **Do NOT use fixed section templates** (like "Getting Started / Deep Dive / Extensions")
- Sections should be based on the project's actual functional domains
- Typical section patterns (choose what fits best):
  - By functional module (e.g., "Detection System / Scoring Engine / Report Generation")
  - By user journey (e.g., "Quick Start / Core Features / Advanced Configuration")
  - By technical layer (e.g., "Data Layer / Business Logic / Presentation Layer")
- The first section is typically "Overview" or "Getting Started"; the rest should be entirely project-specific

### Page Design Principles:
- **Core features of the project MUST have dedicated pages** — do not merge or omit them
- If the project has "feature lists" (e.g., detection methods, API endpoints, component library), there MUST be a dedicated page listing all items
- If the project has "core mechanisms" (e.g., algorithms, protocols, workflows), each mechanism should have its own detailed page
- Page titles must be specific and clear (e.g., "OpenAI Protocol Detection Methods" not just "Detection")
- Each page should have a clear scope with no overlap

### Grouping Requirements:
- Group related pages under each section
- Each group should contain 2-5 related pages
- Group names should describe content topics; avoid "Other" or "Miscellaneous"

### Difficulty Levels:
- **Beginner**: Basic concepts, quick start, overview pages
- **Intermediate**: Core features, configuration, usage guide pages
- **Advanced**: Underlying mechanisms, extension development, advanced features

### Page Count:
- Small project (<20 files): ${isDeepMode ? '15-20' : '10-15'} pages
- Medium project (20-100 files): ${isDeepMode ? '25-35' : '15-25'} pages
- Large project (>100 files): ${isDeepMode ? '35-50' : '20-35'} pages

Return your analysis in the following XML format:

<wiki_structure>
  <title>[Overall title for the wiki]</title>
  <description>[Brief description of the repository]</description>
  <sections>
    <section id="section-1">
      <title>[Section title]</title>
      <pages>
        <page_ref>page-1</page_ref>
      </pages>
      <subsections>
        <section_ref>section-2</section_ref>
      </subsections>
    </section>
  </sections>
  <pages>
    <page id="page-1">
      <title>[Page title]</title>
      <description>[Brief description of what this page will cover]</description>
      <importance>high|medium|low</importance>
      <group>[Group name, optional]</group>
      <relevant_files>
        <file_path>[Path to a relevant file]</file_path>
      </relevant_files>
      <related_pages>
        <related>page-2</related>
      </related_pages>
      <parent_section>section-1</parent_section>
    </page>
  </pages>
</wiki_structure>

IMPORTANT FORMATTING INSTRUCTIONS:
- Return ONLY the valid XML structure specified above
- DO NOT wrap the XML in markdown code blocks
- DO NOT include any explanation text before or after the XML
- Start with <wiki_structure>, end with </wiki_structure>
- Each page should focus on a specific aspect of the codebase
- relevant_files should be actual files from the repository
- Return ONLY valid XML`
  }
}

/**
 * Page content generation prompt - adapted from ZRead style
 */
function getPageContentPrompt (pageTitle, filePaths, language, relatedPages = [], mode = WIKI_MODE.FAST, config = {}) {
  const filePathsStr = filePaths.map(p => `- ${p}`).join('\n')
  const isDeepMode = mode === WIKI_MODE.DEEP
  const diagramsPerSection = config.diagramsPerSection || (isDeepMode ? 3 : 1)

  if (language === 'zh') {
    return `你是一位专业的技术文档撰写者和软件架构师。
你的任务是为一个软件项目生成一个全面、准确的技术 wiki 页面（Markdown 格式）。

你会收到：
1. "[WIKI_PAGE_TOPIC]" — 你需要创建的页面主题。
2. "[RELEVANT_SOURCE_FILES]" — 你必须作为内容唯一来源的项目源文件。

## 页面格式要求

### 开头格式（重要！）
页面的第一部分必须是一个 \`<details>\` 块，列���你使用的所有源文件：
<details>
<summary>相关源文件</summary>

以下是生成此 wiki 页面时使用的上下文文件：

${filePathsStr}
</details>

在 \`<details>\` 块之后，**不要使用 H1 标题**，直接开始写概述段落（1-2 段），解释该模块的目的、范围和高层概述。

### 内容结构

1.  **概述段落：** 直接开始，不要加标题，解释 "${pageTitle}" 的核心价值和作用。

2.  **架构图（首要内容）：**
    *   第一个 H2 章节应该是架构总览
    *   必须包含一个 Mermaid 流程图（graph TD）展示整体架构
    *   使用 subgraph 分组，清晰展示层次关系
    *   节点名称要简洁（3-4 个词）

3.  **核心组件表：**
    *   使用表格列出核心组件及其职责
    *   格式：| 组件 | 位置 | 职责 |

4.  **流程详解：**
    *   使用 H2/H3 分章节
    *   每个流程配一个 Mermaid 时序图或流程图
    *   用文字解释流程的每个步骤
    *   重点解释"怎么做"和"为什么这样做"

5.  **数据模型/配置表：**
    *   使用表格呈现数据结构、配置项、API 参数
    *   格式：| 字段 | 类型 | 说明 |

6.  **技术机制说明：**
    *   解释核心算法、设计模式、优化策略
    *   用文字+图表说明，不要贴代码

7.  **源码引用：** 在关键信息后标注来源：\`Sources: [filename:start-end]()\`

8.  **交叉引用：** 使用 \`[页面标题](slug)\` 格式链接到相关页面。

9.  **下一步阅读：** 页面末尾添加"下一步"或"相关阅读"部分，推荐 2-3 个逻辑上连贯的后续页面。

10. **避免代码：** 不要大段贴代码，只在必要时引用极短的代码片段（1-3行）。

### 核心原则
- **图表比文字重要**：每个章节都应该有 ${diagramsPerSection} 个 Mermaid 图表
- **表格比列表重要**：用表格呈现结构化信息
- **流程比实现重要**：解释工作流程，不是代码实现
- **机制比细节重要**：解释技术原理，不是代码细节
- **链接比重复重要**：引用其他页面而不是重复内容
- **${isDeepMode ? '深度模式：每个概念都需要多角度图表解释，包括架构图、流程图、时序图、状态图等' : '快速模式：聚焦核心架构图'}**

${isDeepMode ? '### 深度模式附加要求\n- 每个核心概念需要包含：\n  - 架构层次图（展示组件关系）\n  - 数据流图（展示信息流动）\n  - 状态机图（如果适用）\n  - 时序图（展示交互流程）\n- 提供详细的配置项说明表格\n- 包含常见使用场景和最佳实践\n- 源码引用要覆盖所有关键实现细节\n\n' : ''}重要：用中文生成内容。`
  } else {
    return `You are an expert technical writer and software architect.
Your task is to generate a comprehensive and accurate technical wiki page in Markdown format.

You will receive:
1. The "[WIKI_PAGE_TOPIC]" for the page you need to create.
2. A list of "[RELEVANT_SOURCE_FILES]" from the project that you MUST use as the sole basis for the content.

## Page Format Requirements

### Opening Format (IMPORTANT!)
The first part of the page MUST be a \`<details>\` block listing all source files:
<details>
<summary>Relevant source files</summary>

The following files were used as context for generating this wiki page:

${filePathsStr}
</details>

After the \`<details>\` block, do NOT use H1 title. Start directly with an overview paragraph (1-2 sentences) explaining the purpose, scope, and high-level overview of "${pageTitle}".

### Content Structure

1.  **Overview Paragraph:** Start directly without a heading, explain the core value and purpose of "${pageTitle}".

2.  **Architecture Diagram (PRIMARY CONTENT):**
    *   The first H2 section should be architecture overview
    *   MUST include a Mermaid flowchart (graph TD) showing the overall architecture
    *   Use subgraph for grouping, clearly show layer relationships
    *   Node names should be concise (3-4 words)

3.  **Core Components Table:**
    *   Use a table to list core components and their responsibilities
    *   Format: | Component | Location | Responsibility |

4.  **Flow Details:**
    *   Use H2/H3 sections
    *   Each flow should have a Mermaid sequence diagram or flowchart
    *   Explain each step of the flow with text
    *   Focus on "how it works" and "why it's designed this way"

5.  **Data Model/Configuration Table:**
    *   Use tables for data structures, configuration items, API parameters
    *   Format: | Field | Type | Description |

6.  **Technical Mechanism Explanation:**
    *   Explain core algorithms, design patterns, optimization strategies
    *   Use text + diagrams, not code

7.  **Source Citations:** Cite sources after key information: \`Sources: [filename:start-end]()\`

8.  **Cross References:** Use \`[Page Title](slug)\` format to link to related pages.

9.  **Next Steps:** At the end of the page, add a "Next Steps" or "Related Reading" section recommending 2-3 logically sequential pages to read next.

10. **Avoid Code:** Do NOT paste large code blocks. Only cite very short code snippets (1-3 lines) when absolutely necessary.

### Core Principles
- **Diagrams are more important than text**: Every section should have ${diagramsPerSection} Mermaid diagrams
- **Tables are more important than lists**: Use tables for structured information
- **Flows are more important than implementation**: Explain workflows, not code implementation
- **Mechanisms are more important than details**: Explain technical principles, not code details
- **Links are better than repetition**: Reference other pages instead of duplicating content
- **${isDeepMode ? 'Deep mode: Every concept needs multi-angle diagrams including architecture, flow, sequence, and state diagrams' : 'Fast mode: Focus on core architecture diagrams'}**

${isDeepMode ? '### Deep Mode Additional Requirements\n- Each core concept needs:\n  - Architecture layer diagram (component relationships)\n  - Data flow diagram (information flow)\n  - State machine diagram (if applicable)\n  - Sequence diagram (interaction flow)\n- Provide detailed configuration options tables\n- Include common use cases and best practices\n- Source citations should cover all key implementation details\n\n' : ''}IMPORTANT: Generate the content in English.`
  }
}

/**
 * File expansion prompt - expand relevant files for a page
 */
function getFileExpansionPrompt (pageTitle, pageDescription, initialFiles, allFiles, language, mode = WIKI_MODE.FAST, config = {}) {
  const initialFilesStr = initialFiles.map(f => `- ${f}`).join('\n')
  const allFilesStr = allFiles.map(f => `- ${f}`).join('\n')

  const minFiles = config.additionalFilesPerPage || (mode === WIKI_MODE.DEEP ? 20 : 5)
  const maxFiles = minFiles + 5

  if (language === 'zh') {
    return `你正在为 wiki 页面 "${pageTitle}" 识别所有相关源文件。

页面描述：${pageDescription || pageTitle}

当前已关联的文件：
${initialFilesStr}

项目中的所有文件：
${allFilesStr}

请从完整文件列表中，找出与此页面主题相关的所有文件。包括：
- 核心实现文件
- 相关的工具函数、辅助类
- 配置文件、常量定义
- 测试文件（如果有助于理解功能）
- 相关的类型定义、接口

请以以下格式返回（每行一个文件路径，只返回文件路径，不要其他内容）：
src/path/to/file1.js
src/path/to/file2.js
src/path/to/file3.js

重要：
- 只返回与当前页面主题直接相关的文件
- 不要重复已有的文件
- 文件路径必须与项目中的实际路径一致
- 返回 ${minFiles}-${maxFiles} 个额外的相关文件`
  } else {
    return `You are identifying all relevant source files for the wiki page "${pageTitle}".

Page description: ${pageDescription || pageTitle}

Currently associated files:
${initialFilesStr}

All files in the project:
${allFilesStr}

Please find ALL files from the complete file list that are relevant to this page's topic. Include:
- Core implementation files
- Related utility functions, helper classes
- Configuration files, constant definitions
- Test files (if they help understand the functionality)
- Related type definitions, interfaces

Return in the following format (one file path per line, only file paths, no other content):
src/path/to/file1.js
src/path/to/file2.js
src/path/to/file3.js

Important:
- Only return files directly relevant to the current page topic
- Do not repeat existing files
- File paths must match actual paths in the project
- Return ${minFiles}-${maxFiles} additional relevant files`
  }
}

// ============================================================================
// XML Parsing
// ============================================================================

function parseStructureXML (xmlText) {
  // Strip markdown code fences (may wrap the whole response)
  xmlText = xmlText.replace(/^```(?:xml|XML)?\s*/i, '').replace(/```\s*$/i, '').trim()

  // Try to extract <wiki_structure>...</wiki_structure>
  let xmlMatch = xmlText.match(/<wiki_structure>[\s\S]*?<\/wiki_structure>/m)

  // Fallback: LLM sometimes returns <wiki> or <structure> instead
  if (!xmlMatch) {
    xmlMatch = xmlText.match(/<wiki>[\s\S]*?<\/wiki>/m)
  }
  if (!xmlMatch) {
    xmlMatch = xmlText.match(/<structure>[\s\S]*?<\/structure>/m)
  }
  // Last resort: grab everything from first < to last >
  if (!xmlMatch) {
    const firstTag = xmlText.indexOf('<')
    const lastTag = xmlText.lastIndexOf('>')
    if (firstTag !== -1 && lastTag > firstTag) {
      const candidate = xmlText.slice(firstTag, lastTag + 1)
      if (candidate.includes('<page') || candidate.includes('<section')) {
        xmlMatch = [candidate]
      }
    }
  }

  if (!xmlMatch) {
    console.error('[WikiGenerator] No XML found in response. First 1000 chars:', xmlText.slice(0, 1000))
    throw new Error('No valid XML found in response')
  }

  let xml = xmlMatch[0]
  // eslint-disable-next-line no-control-regex
  xml = xml.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  // Sanitize common XML issues from LLM output
  xml = xml.replace(/&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[\da-fA-F]+;)/g, '&amp;')

  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xml, 'text/xml')

  const parseError = xmlDoc.querySelector('parsererror')
  if (parseError) {
    console.warn('[WikiGenerator] XML parse warning:', parseError.textContent?.slice(0, 200))
  }

  const title = xmlDoc.querySelector('title')?.textContent || ''
  const description = xmlDoc.querySelector('description')?.textContent || ''

  const pages = []
  const pageElements = xmlDoc.querySelectorAll('page')
  pageElements.forEach((pageEl, index) => {
    const id = pageEl.getAttribute('id') || `page-${index + 1}`
    const pageTitle = pageEl.querySelector('title')?.textContent || ''
    const importance = pageEl.querySelector('importance')?.textContent || 'medium'
    const group = pageEl.querySelector('group')?.textContent || ''

    const filePaths = []
    pageEl.querySelectorAll('file_path').forEach(el => {
      if (el.textContent) filePaths.push(el.textContent.trim())
    })

    const relatedPages = []
    pageEl.querySelectorAll('related').forEach(el => {
      if (el.textContent) relatedPages.push(el.textContent.trim())
    })

    const parentSection = pageEl.querySelector('parent_section')?.textContent || ''

    pages.push({ id, title: pageTitle, importance, group, filePaths, relatedPages, parentSection })
  })

  const sections = []
  const sectionElements = xmlDoc.querySelectorAll('section')
  sectionElements.forEach(sectionEl => {
    const id = sectionEl.getAttribute('id') || `section-${sections.length + 1}`
    const sectionTitle = sectionEl.querySelector('title')?.textContent || ''
    const pageRefs = []
    sectionEl.querySelectorAll('page_ref').forEach(el => {
      if (el.textContent) pageRefs.push(el.textContent.trim())
    })
    sections.push({ id, title: sectionTitle, pageRefs })
  })

  return { title, description, pages, sections }
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateTimestampId () {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const h = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  const s = String(now.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d}-${h}${min}${s}` // Format: YYYY-MM-DD-HHMMSS (ZRead compatible)
}

function generateSlug (index, title, language) {
  if (language === 'zh') {
    // For Chinese, try to use pinyin slug if available, otherwise use transliteration
    const slug = title
      .replace(/[^[\w\s一-鿿]-]/g, '')
      .slice(0, 40)
    return `${index + 1}-${slug || 'page'}`
  } else {
    // For English, use the existing logic
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
    return `${index + 1}-${slug || 'page'}`
  }
}

// ============================================================================
// Main Generation Functions
// ============================================================================

/**
 * Phase 1: Generate wiki outline
 * Yields progress events, then a final 'outline' event with structure + context.
 *
 * @param {Object} options
 * @param {string} options.rootPath - Project root path
 * @param {string} options.language - Language code ('zh' or 'en')
 * @param {Object} options.aiSettings - AI settings (baseUrl, apiKey, model, protocol, temperature)
 * @param {AbortSignal} options.signal - Abort signal
 * @param {string} [options.mode] - 'fast' or 'deep' (default: 'fast')
 * @param {number} [options.tokensPerBatch] - Token budget per batch (default: 150000)
 */
export async function * generateOutline ({ rootPath, language, aiSettings, signal, mode = WIKI_MODE.FAST, tokensPerBatch }) {
  const config = MODE_CONFIG[mode] || MODE_CONFIG[WIKI_MODE.FAST]
  const batchTokenBudget = tokensPerBatch || config.tokensPerBatch

  // Step 1: Read file tree
  yield { type: 'progress', message: language === 'zh' ? '正在扫描项目文件...' : 'Scanning project files...', current: 0, total: 0 }

  const fileTreeData = await readFileTree(rootPath)

  if (!fileTreeData.fileTree) {
    throw new Error('No files found in the project directory')
  }

  // Parse file tree to get list of source files
  const allFiles = fileTreeData.fileTree.split('\n').filter(f => f.trim())

  // Step 2: Read file contents
  yield { type: 'progress', message: language === 'zh' ? '正在读取源代码...' : 'Reading source code...', current: 0, total: 0 }

  // Calculate max files to read based on mode config
  const maxFilesToRead = config.maxFilesToRead
  const linesPerFile = config.linesPerFile

  // Read files (small files fully, large files first N lines)
  const filesToRead = allFiles.slice(0, maxFilesToRead)
  const fileContents = await readFiles(rootPath, filesToRead, linesPerFile)

  // Step 3: Analyze files in batches (or all at once for deep mode)
  yield { type: 'progress', message: language === 'zh' ? '正在分析代码...' : 'Analyzing code...', current: 0, total: 0 }

  // Split files into batches for analysis based on token budget
  const fileEntries = Object.entries(fileContents).filter(([_, data]) => !data.error)
  const batches = []

  if (config.batchEnabled) {
    // Fast mode: split into batches
    let currentBatch = {}
    let currentTokens = 0

    for (const [filePath, data] of fileEntries) {
      const fileTokens = estimateTokens(data.content || '')

      if (currentTokens + fileTokens > batchTokenBudget && Object.keys(currentBatch).length > 0) {
        batches.push({ ...currentBatch })
        currentBatch = {}
        currentTokens = 0
      }

      currentBatch[filePath] = data
      currentTokens += fileTokens

      if (Object.keys(currentBatch).length >= MAX_FILES_PER_BATCH) {
        batches.push({ ...currentBatch })
        currentBatch = {}
        currentTokens = 0
      }
    }

    if (Object.keys(currentBatch).length > 0) {
      batches.push(currentBatch)
    }
  } else {
    // Deep mode: no batching, analyze all files at once
    const allFilesBatch = {}
    for (const [filePath, data] of fileEntries) {
      allFilesBatch[filePath] = data
    }
    batches.push(allFilesBatch)
  }

  // Analyze each batch
  const batchAnalyses = []

  for (let i = 0; i < batches.length; i++) {
    yield {
      type: 'progress',
      message: language === 'zh'
        ? `正在分析代码 (${i + 1}/${batches.length})...`
        : `Analyzing code (${i + 1}/${batches.length})...`,
      current: i + 1,
      total: batches.length
    }

    const batchPrompt = getBatchAnalysisPrompt(batches[i], language, mode)
    const batchMessages = [{ role: 'user', content: batchPrompt }]

    const analysis = await callLLMFull(batchMessages, aiSettings, signal)
    batchAnalyses.push(analysis)
  }

  // Step 4: Synthesize project summary from batch analyses
  yield { type: 'progress', message: language === 'zh' ? '正在综合项目理解...' : 'Synthesizing project understanding...', current: 0, total: 0 }

  const summaryPrompt = getProjectSummaryPrompt(
    batchAnalyses,
    fileTreeData.fileTree,
    fileTreeData.readme,
    language,
    mode
  )
  const summaryMessages = [{ role: 'user', content: summaryPrompt }]
  const projectSummary = await callLLMFull(summaryMessages, aiSettings, signal)

  // Step 5: Generate wiki structure
  yield { type: 'progress', message: language === 'zh' ? '正在生成文档大纲...' : 'Generating wiki outline...', current: 0, total: 0 }

  const structurePrompt = getStructurePrompt(
    fileTreeData.fileTree,
    fileTreeData.readme,
    projectSummary,
    language,
    mode,
    config
  )

  const structureMessages = [{ role: 'user', content: structurePrompt }]
  const structureResponse = await callLLMFull(structureMessages, aiSettings, signal)

  let structure
  try {
    structure = parseStructureXML(structureResponse)
  } catch (parseErr) {
    // Retry with a simpler direct prompt
    console.warn('[WikiGenerator] First parse failed, retrying with simpler prompt...')
    yield { type: 'progress', message: language === 'zh' ? '正在重试生成大纲...' : 'Retrying outline generation...', current: 0, total: 0 }

    const retryPrompt = language === 'zh'
      ? `基于以下项目摘要，生成 wiki 大纲。必须返回 <wiki_structure> XML 格式。\n\n${projectSummary}\n\n要求：\n1. 根据项目实际功能划分章节，不要用通用模板\n2. 项目的核心功能必须有独立页面\n3. 创建 15-25 个页面\n4. 只返回 XML，不要其他文字\n\n格式：\n<wiki_structure>\n  <title>标题</title>\n  <description>描述</description>\n  <sections><section id="s1"><title>章节</title><pages><page_ref>p1</page_ref></pages></section></sections>\n  <pages><page id="p1"><title>页面</title><description>描述</description><importance>high</importance><relevant_files><file_path>路径</file_path></relevant_files><parent_section>s1</parent_section></page></pages>\n</wiki_structure>`
      : `Based on the following project summary, generate a wiki outline. You MUST return <wiki_structure> XML format.\n\n${projectSummary}\n\nRequirements:\n1. Sections based on actual project features, NOT generic templates\n2. Core features must have dedicated pages\n3. Create 15-25 pages\n4. Return ONLY XML, no other text\n\nFormat:\n<wiki_structure>\n  <title>Title</title>\n  <description>Description</description>\n  <sections><section id="s1"><title>Section</title><pages><page_ref>p1</page_ref></pages></section></sections>\n  <pages><page id="p1"><title>Page</title><description>Description</description><importance>high</importance><relevant_files><file_path>path</file_path></relevant_files><parent_section>s1</parent_section></page></pages>\n</wiki_structure>`

    const retryMessages = [{ role: 'user', content: retryPrompt }]
    const retryResponse = await callLLMFull(retryMessages, aiSettings, signal)

    structure = parseStructureXML(retryResponse)
  }

  if (!structure.pages || structure.pages.length === 0) {
    throw new Error('Failed to generate wiki structure: no pages returned')
  }

  // Return outline + context needed for content generation
  yield {
    type: 'outline',
    structure,
    context: { rootPath, language, aiSettings, fileTreeData, fileContents, allFiles, structure, mode, config }
  }
}

/**
 * Phase 2: Generate wiki content from a confirmed outline
 * Yields progress events for each page, then 'done' when saved.
 *
 * @param {Object} context - Context from generateOutline
 * @param {AbortSignal} signal - Abort signal
 */
export async function * generateContent (context, signal) {
  const { rootPath, language, aiSettings, fileContents, allFiles, structure, mode = WIKI_MODE.FAST, config: contextConfig } = context
  const config = contextConfig || MODE_CONFIG[mode] || MODE_CONFIG[WIKI_MODE.FAST]

  // Step 6: Expand relevant files for each page
  const totalPages = structure.pages.length
  const expandedPages = []

  for (let i = 0; i < totalPages; i++) {
    const page = structure.pages[i]
    yield {
      type: 'progress',
      message: language === 'zh' ? `正在分析相关文件: ${page.title}` : `Analyzing related files: ${page.title}`,
      current: i + 1,
      total: totalPages,
      currentPage: page.title
    }

    // Ask LLM to expand the relevant files list (more files for deep mode)
    const expansionPrompt = getFileExpansionPrompt(
      page.title,
      page.description,
      page.filePaths,
      allFiles,
      language,
      mode,
      config
    )

    const expansionMessages = [{ role: 'user', content: expansionPrompt }]
    const expansionResponse = await callLLMFull(expansionMessages, aiSettings, signal)

    // Parse the response to get additional files
    const additionalFiles = expansionResponse
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('-') && !line.startsWith('*') && !line.includes(':'))
      .filter(line => allFiles.includes(line))

    // Merge with original files (remove duplicates)
    const expandedFileList = [...new Set([...page.filePaths, ...additionalFiles])]

    expandedPages.push({
      ...page,
      expandedFiles: expandedFileList
    })
  }

  // Step 7: Generate page content
  const pageContents = []

  for (let i = 0; i < totalPages; i++) {
    const page = expandedPages[i]
    yield {
      type: 'progress',
      message: language === 'zh' ? `正在生成: ${page.title}` : `Generating: ${page.title}`,
      current: i + 1,
      total: totalPages,
      currentPage: page.title
    }

    // Read full content for expanded relevant files
    const relevantFilesContent = []
    const filesToReadFull = []

    for (const filePath of page.expandedFiles) {
      if (fileContents[filePath] && !fileContents[filePath].truncated) {
        relevantFilesContent.push({ path: filePath, content: fileContents[filePath].content })
      } else {
        filesToReadFull.push(filePath)
      }
    }

    // Read full content for files that were truncated or not yet read
    if (filesToReadFull.length > 0) {
      const fullContents = await readFiles(rootPath, filesToReadFull, 0)
      for (const [filePath, data] of Object.entries(fullContents)) {
        if (!data.error) {
          relevantFilesContent.push({ path: filePath, content: data.content })
        }
      }
    }

    // Generate page content with expanded files
    const pagePrompt = getPageContentPrompt(page.title, page.expandedFiles, language, page.relatedPages, mode, config)

    // Build messages with file contents as context
    const pageMessages = [
      { role: 'user', content: pagePrompt }
    ]

    // Add file contents as system context
    let fileContext = ''
    for (const file of relevantFilesContent) {
      fileContext += `\n\n### ${file.path}\n\`\`\`\n${file.content}\n\`\`\``
    }

    if (fileContext) {
      pageMessages.unshift({
        role: 'system',
        content: `You have access to the following source files for generating the wiki page:\n${fileContext}`
      })
    }

    let pageContent = ''
    for await (const chunk of callLLM(pageMessages, aiSettings, signal)) {
      pageContent += chunk
    }

    // Clean up markdown delimiters
    pageContent = pageContent.replace(/^```markdown\s*/i, '').replace(/```\s*$/i, '')

    const slug = generateSlug(i, page.title, language)
    const filename = `${slug}.md`

    const parentSection = structure.sections.find(s => s.pageRefs.includes(page.id))
    pageContents.push({
      slug,
      title: page.title,
      filename,
      content: pageContent,
      section: parentSection?.title || 'Other',
      group: page.group || '',
      importance: page.importance
    })

    yield { type: 'page', index: i, page: pageContents[pageContents.length - 1] }
  }

  // Step 8: Save to .md++
  const versionId = generateTimestampId()
  const wikiJson = {
    id: versionId,
    generated_at: new Date().toISOString(),
    language,
    pages: pageContents.map(p => ({
      slug: p.slug,
      title: p.title,
      file: p.filename,
      section: p.section,
      group: p.group || '',
      level: p.importance === 'high' ? 'Beginner' : p.importance === 'low' ? 'Advanced' : 'Intermediate'
    }))
  }

  yield { type: 'progress', message: language === 'zh' ? '正在保存...' : 'Saving...', current: totalPages, total: totalPages }

  await saveWiki(rootPath, wikiJson, pageContents.map(p => ({ filename: p.filename, content: p.content })))

  yield { type: 'done', versionId, wikiJson, pages: pageContents }
}

/**
 * Legacy: Full wiki generation (outline + content in one pass)
 * @param {Object} options
 * @param {string} options.rootPath - Project root path
 * @param {string} options.language - Language code ('zh' or 'en')
 * @param {Object} options.aiSettings - AI settings
 * @param {AbortSignal} options.signal - Abort signal
 * @param {string} [options.mode] - 'fast' or 'deep' (default: 'fast')
 * @param {number} [options.tokensPerBatch] - Token budget per batch
 */
export async function * generateWiki ({ rootPath, language, aiSettings, signal, mode = WIKI_MODE.FAST, tokensPerBatch }) {
  let context = null
  for await (const event of generateOutline({ rootPath, language, aiSettings, signal, mode, tokensPerBatch })) {
    if (event.type === 'outline') {
      context = event.context
      yield { type: 'structure', structure: event.structure }
    } else {
      yield event
    }
  }
  if (context) {
    for await (const event of generateContent(context, signal)) {
      yield event
    }
  }
}

export default {
  generateOutline,
  generateContent,
  generateWiki
}
