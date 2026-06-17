<p align="center"><img src="static/logo-small.png" alt="MarkDown++" width="100" height="100"></p>

<h1 align="center">MarkDown++</h1>

<div align="center">
  <strong>你一直在等待的 Markdown 编辑器</strong><br>
  免费、强大，专为 AI 时代和代码文档阅读打造。<br>
  <sub>支持 Windows，Linux/macOS 可从源码构建。</sub>
</div>

<br>

<div align="center">
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/nlstone/Markdown-PlusPlus.svg" alt="LICENSE">
  </a>
  <a href="https://github.com/nlstone/Markdown-PlusPlus/releases">
    <img src="https://img.shields.io/github/downloads/nlstone/Markdown-PlusPlus/total.svg" alt="total download">
  </a>
  <a href="https://github.com/nlstone/Markdown-PlusPlus/releases/latest">
    <img src="https://img.shields.io/github/downloads/nlstone/Markdown-PlusPlus/latest/total.svg" alt="latest download">
  </a>
  <br>
  <a href="README.md">中文</a> | <a href="README_EN.md">English</a>
</div>

<div align="center">
  <h3>
    <a href="#为什么选择-markdown">为什么选择</a>
    <span> | </span>
    <a href="#功能特性">功能特性</a>
    <span> | </span>
    <a href="#下载安装">下载安装</a>
    <span> | </span>
    <a href="#开发构建">开发构建</a>
  </h3>
</div>

<br />

## 为什么选择 MarkDown++？

在 AI 时代，Markdown 已经成为人与 AI、开发者与知识库之间的通用文本格式。MarkDown++ 在 MarkText 的基础上继续演进，面向写作、AI 辅助编辑、代码库文档阅读和项目 Wiki 生成，提供一个免费、现代、可本地运行的桌面体验。

适合这些场景：

- **写作者**：专注写作、实时预览、主题和导出能力齐全。
- **开发者**：支持 GFM、代码高亮、图表、项目文档和代码库 Wiki。
- **AI 用户**：直接在编辑器中重写、扩写、总结内容，并可连接 OpenAI、Anthropic 或兼容接口。
- **团队文档维护者**：为项目生成结构化 Wiki，阅读 `.md++` / `.zread` 文档集。

## 功能特性

### 核心 Markdown 编辑体验

- **默认预览阅读体验**：打开文档默认进入源码预览模式，并隐藏源码面板，只显示预览视图，更适合阅读。
- **实时编辑与源码模式**：保留 WYSIWYG 实时编辑、源码编辑和分屏预览能力。
- **完整 Markdown 支持**：CommonMark、GitHub Flavored Markdown、表格、任务列表、脚注、代码块。
- **数学公式和图表**：支持 KaTeX、Mermaid、PlantUML、Vega 等内容。
- **导出能力**：支持 HTML、PDF，并扩展 DOCX / Pandoc 导出流程。
- **多主题与专注写作**：浅色、深色主题，专注模式、打字机模式和可配置编辑体验。
- **图片处理**：支持拖放、剪贴板粘贴和图床上传。

### 项目 Wiki 与 ZRead 阅读

- **`.md++` 项目 Wiki**：在项目中生成 MarkDown++ 兼容的结构化 Wiki 文档。
- **ZRead 兼容模式**：可读取 `.zread/wiki` 文档，像浏览知识库一样阅读代码库说明。
- **多版本 Wiki**：支持发现、切换和浏览不同版本的 Wiki 文档。
- **Wiki 导出**：侧边栏中的 Wiki / ZRead 文档可导出为 HTML 或 PDF。

### AI 智能编辑

- **AI 助手面板**：在编辑器内直接与 AI 对话，用于摘要、解释、扩写和修改。
- **智能重写**：选中文本后让 AI 改写、润色或按指令调整。
- **多协议支持**：支持 OpenAI、Anthropic，以及 OpenAI 兼容接口。
- **连接测试和超时处理**：设置页可验证 AI 配置，减少无响应请求带来的等待。

### Wiki 生成器

- **项目代码分析**：读取项目文件结构和源码，生成面向用户/开发者的项目 Wiki。
- **快速模式**：默认聚焦项目理解、使用方式、关键架构和常见工作流。
- **可最小化任务窗口**：生成 Wiki 时可最小化面板，继续编辑文档。
- **Token 预算控制**：按预算分批读取文件，降低超长项目生成失败概率。

### 多语言界面

- 简体中文
- English

## 对比

| 特性 | MarkDown++ | Typora | Obsidian | MarkText |
|------|:-----------:|:------:|:--------:|:--------:|
| 免费个人使用 | 是 | 否 | 是 | 是 |
| 开源 | 是 | 否 | 否 | 是 |
| Markdown 编辑 | 是 | 是 | 是 | 是 |
| 默认预览阅读 | 是 | 否 | 否 | 否 |
| AI 助手 | 是 | 否 | 插件 | 否 |
| 项目 Wiki 生成 | 是 | 否 | 否 | 否 |
| ZRead / `.md++` 文档浏览 | 是 | 否 | 否 | 否 |
| Windows 桌面包 | 是 | 是 | 是 | 是 |

个人和非商业用途免费。商业使用请查看 [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md)。

## 截图

![MarkDown++ 截图](docs/markdownpp-main.png?raw=true)

## 下载安装

### Windows 推荐方式

从 [最新版本](https://github.com/nlstone/Markdown-PlusPlus/releases/latest) 下载：

- **安装包**：`markdownpp-setup.exe`
- **便携版**：`markdownpp-portable.exe`
- **压缩包**：`markdownpp-x64-win.zip`

Windows 是当前主要测试平台。Linux/macOS 可以从源码构建。

### 从源码构建

```bash
git clone https://github.com/nlstone/Markdown-PlusPlus.git
cd Markdown-PlusPlus
yarn install
yarn dev
yarn build
```

详见 [构建说明](docs/dev/BUILD.md)。

## 开发构建

### 前置要求

- Node.js >= 16
- Yarn 1.x
- Python 和 C++ 编译环境，用于原生模块编译

### 常用命令

```bash
yarn install
yarn dev
yarn lint
yarn unit
yarn build
```

## 快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl+S` / `Cmd+S` | 保存 |
| `Ctrl+Shift+S` / `Cmd+Shift+S` | 另存为 |
| `Ctrl+P` / `Cmd+P` | 快速打开 |
| `Ctrl+F` / `Cmd+F` | 查找 |
| `Ctrl+H` / `Cmd+Alt+F` | 替换 |
| `Ctrl+E` / `Cmd+Option+S` | 切换源码模式 |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | 命令面板 |

## 许可证

MarkDown++ 对个人和非商业用途免费。

| 许可证 | 适用场景 |
|--------|----------|
| MIT License | 个人项目、开源项目、教育和非商业用途 |
| Commercial License | 商业 SaaS、OEM 嵌入、闭源再分发 |

详见 [LICENSE](LICENSE) 和 [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md)。

## 贡献

欢迎提交 Issue 和 Pull Request。开发分支为 `dev`。

<div align="center">

**如果你喜欢 MarkDown++，欢迎给项目一个 Star。**

</div>
