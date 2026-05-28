<p align="center"><img src="static/logo-small.png" alt="MarkDown++" width="100" height="100"></p>

<h1 align="center">MarkDown++</h1>

<div align="center">
  <strong>你一直在等待的 Markdown 编辑器</strong><br>
  免费、强大，专为 AI 时代打造。<br>
  <sub>支持 Linux、macOS 和 Windows。</sub>
</div>

<br>

<div align="center">
  <!-- License -->
  <a href="LICENSE">
    <img src="https://img.shields.io/github/license/nlstone/Markdown-PlusPlus.svg" alt="LICENSE">
  </a>
  <!-- Downloads total -->
  <a href="https://github.com/nlstone/Markdown-PlusPlus/releases">
    <img src="https://img.shields.io/github/downloads/nlstone/Markdown-PlusPlus/total.svg" alt="total download">
  </a>
  <!-- Downloads latest release -->
  <a href="https://github.com/nlstone/Markdown-PlusPlus/releases/latest">
    <img src="https://img.shields.io/github/downloads/nlstone/Markdown-PlusPlus/latest/total.svg" alt="latest download">
  </a>
  <!-- Language -->
  <a href="README.md">English</a> | <a href="README_zh-CN.md">中文</a>
</div>

<div align="center">
  <h3>
    <a href="#为什么选择-markdown">为什么选择 MarkDown++</a>
    <span> | </span>
    <a href="#功能特性">功能特性</a>
    <span> | </span>
    <a href="#对比">对比</a>
    <span> | </span>
    <a href="#下载安装">下载安装</a>
    <span> | </span>
    <a href="#开发构建">开发构建</a>
  </h3>
</div>

<br />

## 为什么选择 MarkDown++？

### AI 时代需要更好的 Markdown 编辑器

在 AI 时代，Markdown 已经成为**人与 AI 之间的通用桥梁**。无论你是向 Claude、ChatGPT 还是其他 AI 助手提问，Markdown 都是用来交换想法、结构化思维和与 AI 协作的语言。

**但问题是：** 大多数免费的 Markdown 编辑器感觉像是 2010 年建的。它们笨拙、缺乏现代功能，没有随着 AI 革命进化。

### 为什么我们开发 MarkDown++

我们相信每个人都应该拥有一个**强大、免费、优美**的 Markdown 编辑器：

- **对于写作者** — 干净、无干扰的写作体验，实时预览
- **对于开发者** — GitHub 风格 Markdown、语法高亮、代码块
- **对于 AI 进阶用户** — 无缝编辑和格式化提示词、回复和对话
- **对于每个人** — 简单易上手，功能足够强大

### 现有编辑器的痛点

| 编辑器 | 价格 | 主要问题 |
|--------|------|----------|
| **Typora** | 付费 (~$15) | 不再免费，闭源 |
| **Obsidian** | 免费但复杂 | 知识库而非纯编辑器；资源占用大 |
| **Notion** | 免费版有限 | 云端应用，非桌面端，隐私担忧 |
| **VS Code** | 免费但笨重 | 对 Markdown 来说过度开发，不够用户友好 |
| **MarkText** (我们的基础) | 免费但维护停滞 | 开发停滞，Bug 修复缓慢 |

**MarkDown++** 解决这些问题 — 一款现代、持续维护、免费的桌面编辑器，为今天的用户而生。

## 功能特性

### 核心编辑器（继承并增强）

一款世界级 Markdown 编辑器应有的所有功能：

- **实时预览 (WYSIWYG)** — 边写边看格式化效果
- **分屏预览** — 左边编辑，右边预览 — 兼得鱼与熊掌
- **完整 Markdown 支持** — [CommonMark](https://spec.commonmark.org/0.29/) + [GitHub 风格 Markdown](https://github.github.com/gfm/) + Pandoc 扩展
- **高级语法** — 数学公式 (KaTeX)、表格、脚注、任务列表
- **丰富图表** — Mermaid、PlantUML、Vega 图表
- **导出选项** — HTML、PDF，格式优美
- **多主题** — 浅色、深色等多种配色方案
- **专注模式 & 打字机模式** — 无干扰写作体验
- **图片处理** — 拖放、剪贴板粘贴、上传到 GitHub/Imgur

### MarkDown++ 独有功能

#### :book: ZRead 阅读模式

专为长内容设计的阅读模式。非常适合阅读文档、文章和转换后的网页。沉浸式排版，零干扰。

#### :robot: AI 智能编辑

内置 AI 助手，让你的写作效率飞升：

- **智能重写** — 让 AI 帮助改写和改进你的内容
- **AI 助手** — 在编辑器中直接与 AI 对话，获取建议、摘要或扩展
- **行内 AI 操作** — 快速 AI 命令，无需离开文档

*支持 OpenAI、Anthropic 或任何兼容的 API。*

#### :globe_with_meridians: 多语言界面

完整的国际化支持：
- :cn: 简体中文
- :us: English

更多语言持续加入中 — [欢迎贡献！](#贡献)

## 对比

| 特性 | MarkDown++ | Typora | Obsidian | MarkText |
|------|:-----------:|:------:|:--------:|:--------:|
| **价格** | 免费* | ~$15 | 免费 | 免费 |
| **源代码** | 开源 | 闭源 | 开源 | 开源 |
| **活跃维护** | :white_check_mark: | :x: | :white_check_mark: | :x: |
| **分屏预览** | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: |
| **ZRead 模式** | :white_check_mark: | :x: | :x: | :x: |
| **AI 集成** | :white_check_mark: | :x: | 插件 | :x: |
| **多语言** | :white_check_mark: | 有限 | 插件 | 有限 |
| **Windows/macOS/Linux** | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |

*个人/非商业用途免费。商业使用需购买[商业许可证](COMMERCIAL_LICENSE.md)。

## 截图

![MarkDown++ 截图](docs/markdownpp-main.png?raw=true)

*MarkDown++ 将强大功能与美观、现代的界面相结合。*

## 下载安装

### Windows（推荐）

从 [最新版本](https://github.com/nlstone/Markdown-PlusPlus/releases/latest) 下载：

- **安装包** (`markdownpp-setup.exe`) — 推荐。包含"使用 MarkDown++ 打开"右键菜单集成。
- **便携版** (`markdownpp-portable.exe`) — 无需安装，从任何位置运行。

> Windows 是主要测试平台。Linux/macOS 构建即将推出 — 也可以从源码构建！

### 从源码构建

```bash
git clone https://github.com/nlstone/Markdown-PlusPlus.git
cd Markdown-PlusPlus
yarn install
yarn dev        # 开发模式运行
yarn build      # 生产构建
```

详见 [构建说明](docs/dev/BUILD.md)。

## 许可证

**MarkDown++ 对个人和非商业用途免费。**

| 许可证 | 适用场景 |
|--------|----------|
| **MIT 许可证** | 个人项目、开源、教育、非商业目的 |
| **商业许可证** | 商业 SaaS、OEM 嵌入、闭源再分发 |

详见 [LICENSE](LICENSE) 和 [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md)。

---

## 开发构建

想参与开发或从源码构建？

### 前置要求

- **Node.js**: >= v16
- **Yarn**: v1.x (classic)
- **Python**: 用于原生模块编译
- **C++ 编译器**: 平台相关（VS Build Tools / Xcode / gcc）

### 快速开始

```bash
yarn install
yarn dev
yarn lint
yarn test
```

## 键盘快捷键

| 快捷键 | 操作 |
|--------|------|
| `Ctrl+S` / `Cmd+S` | 保存 |
| `Ctrl+Shift+S` / `Cmd+Shift+S` | 另存为 |
| `Ctrl+P` / `Cmd+P` | 快速打开 |
| `Ctrl+F` / `Cmd+F` | 查找 |
| `Ctrl+H` / `Cmd+Alt+F` | 替换 |
| `Ctrl+/` / `Cmd+/` | 切换源代码模式 |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | 命令面板 |

---

## 贡献

MarkDown++ 正在积极开发中。欢迎贡献！

- **Bug 报告**: [提交问题](https://github.com/nlstone/Markdown-PlusPlus/issues/new?template=bug_report.md)
- **功能建议**: [提出建议](https://github.com/nlstone/Markdown-PlusPlus/issues/new?template=feature_request.md)
- **Pull Request**: 提交 PR 到 `dev` 分支

提交 PR 前请阅读 [贡献指南](CONTRIBUTING.md)。

---

<div align="center">

**如果你喜欢 MarkDown++，请给我们一个 Star！** :star:

</div>