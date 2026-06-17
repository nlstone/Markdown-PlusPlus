<p align="center"><img src="static/logo-small.png" alt="MarkDown++" width="100" height="100"></p>

<h1 align="center">MarkDown++</h1>

<div align="center">
  <strong>The Markdown Editor You've Been Waiting For</strong><br>
  Free, powerful, and designed for the AI era.<br>
  <sub>Available for Linux, macOS, and Windows.</sub>
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
  <a href="README_EN.md">English</a> | <a href="README.md">中文</a>
</div>

<div align="center">
  <h3>
    <a href="#why-markdown-in-the-ai-era">Why MarkDown++</a>
    <span> | </span>
    <a href="#features">Features</a>
    <span> | </span>
    <a href="#comparison">Comparison</a>
    <span> | </span>
    <a href="#download-and-installation">Downloads</a>
    <span> | </span>
    <a href="#development">Development</a>
  </h3>
</div>

<br />

## Why MarkDown++?

### The AI Era Demands a Better Markdown Editor

In the age of AI, Markdown has become the **universal bridge** between humans and AI. Whether you're prompting Claude, ChatGPT, or any other AI assistant, Markdown is the language you use to exchange ideas, structure thoughts, and collaborate with AI.

**But here's the problem:** Most free Markdown editors feel like they were built in 2010. They're clunky, lack modern features, and haven't evolved with the AI revolution.

### Why We Built MarkDown++

We believe everyone deserves a **powerful, free, and beautiful** Markdown editor:

- **For Writers** — Clean, distraction-free writing with real-time preview
- **For Developers** — GitHub Flavored Markdown, syntax highlighting, code blocks
- **For AI Power Users** — Seamlessly edit and format prompts, responses, and conversations
- **For Everyone** — Intuitive enough for beginners, powerful enough for pros

### The Problem with Existing Editors

| Editor | Price | Key Issues |
|--------|-------|------------|
| **Typora** | Paid (~$15) | No longer free, closed source |
| **Obsidian** | Free but complex | Knowledge base, not a pure editor; heavy resource usage |
| **Notion** | Free tier limited | Cloud-based, not a desktop app, privacy concerns |
| **VS Code** | Free but heavy | Overkill for Markdown, not user-friendly |
| **MarkText** (our base) | Free but unmaintained | Development停滞, bug fixes slow |

**MarkDown++** solves these problems — a modern, actively maintained, free desktop editor built for today's users.

## Features

### Core Editor (Inherited & Enhanced)

Everything you'd expect from a world-class Markdown editor:

- **Preview-first Reading by Default** — Open documents directly in source-preview mode with the source pane hidden, ideal for reading.
- **Real-time Preview (WYSIWYG)** — See your formatted output as you type
- **Live Split-Pane View** — Edit on the left, preview on the right — the best of both worlds
- **Full Markdown Support** — [CommonMark](https://spec.commonmark.org/0.29/) + [GitHub Flavored Markdown](https://github.github.com/gfm/) + Pandoc extensions
- **Advanced Syntax** — Math equations (KaTeX), tables, task lists, footnotes
- **Rich Diagrams** — Mermaid, PlantUML, Vega charts
- **Export Options** — HTML, PDF with beautiful formatting
- **DOCX / Pandoc Export Flow** — Improved export path for office-friendly documents
- **Multiple Themes** — Light, dark, and color schemes to match your style
- **Focus & Typewriter Modes** — Distraction-free writing experience
- **Image Handling** — Drag & drop, clipboard paste, cloud upload to GitHub/Imgur

### MarkDown++ Exclusive Features

#### :book: ZRead Mode

A dedicated reading mode for codebase documentation. After [ZRead](https://github.com/ZreadAI/zread_cli) generates documentation for your codebase, open the project folder in MarkDown++ — a "Z" button will appear in the left sidebar, allowing you to browse technical documentation just like ZRead's browse feature. Perfect for exploring and reading generated codebase documentation with zero distractions.

#### :books: Project Wiki Generator

Generate and browse project documentation directly inside MarkDown++:

- **`.md++` Wiki** — Generate MarkDown++ compatible project Wiki documents from a codebase
- **Versioned Wiki Browsing** — Discover and switch between generated Wiki versions
- **Wiki Export** — Export Wiki / ZRead documentation to HTML or PDF from the sidebar
- **Fast Documentation Mode** — Focuses on project understanding, usage, architecture, and workflows instead of line-by-line source commentary

#### :robot: AI-Powered Editing

Built-in AI assistant to supercharge your writing:

- **Smart Rewrite** — Let AI help rephrase and improve your content
- **AI Assistant** — Chat with AI directly in the editor for suggestions, summaries, or expansions
- **Inline AI Actions** — Quick AI commands without leaving your document
- **Connection Testing and Timeouts** — Validate AI settings and avoid hanging requests

*Works with OpenAI, Anthropic, or any compatible API.*

#### :globe_with_meridians: Multi-Language UI

Full i18n support:
- :cn: 简体中文
- :us: English

More languages coming — [contributions welcome!](#contribution)

## Comparison

| Feature | MarkDown++ | Typora | Obsidian | MarkText |
|---------|:-----------:|:------:|:--------:|:--------:|
| **Price** | Free* | ~$15 | Free | Free |
| **Source Code** | Open | Closed | Open | Open |
| **Actively Maintained** | :white_check_mark: | :x: | :white_check_mark: | :x: |
| **Split-Pane Preview** | :white_check_mark: | :white_check_mark: | :x: | :white_check_mark: |
| **Preview-first Reading** | :white_check_mark: | :x: | :x: | :x: |
| **ZRead Mode** | :white_check_mark: | :x: | :x: | :x: |
| **Project Wiki Generator** | :white_check_mark: | :x: | :x: | :x: |
| **AI Integration** | :white_check_mark: | :x: | Plugins | :x: |
| **i18n Support** | :white_check_mark: | Limited | Plugins | Limited |
| **Windows/macOS/Linux** | :white_check_mark: | :white_check_mark: | :white_check_mark: | :white_check_mark: |

*Free for personal/非商业 use. Commercial use requires [commercial license](COMMERCIAL_LICENSE.md).

## Screenshot

![MarkDown++ Screenshot](docs/markdownpp-main.png?raw=true)

*MarkDown++ combines powerful features with a beautiful, modern interface.*

## Download and Installation

### Windows (Recommended)

Download from the [latest release](https://github.com/nlstone/Markdown-PlusPlus/releases/latest):

- **Installer** (`markdownpp-setup.exe`) — Recommended. Includes "Open with MarkDown++" context menu integration.
- **Portable** (`markdownpp-portable.exe`) — No installation required, runs from anywhere.

> Windows is the primary tested platform. Linux/macOS builds available soon — or build from source!

### Building from Source

```bash
git clone https://github.com/nlstone/Markdown-PlusPlus.git
cd Markdown-PlusPlus
yarn install
yarn dev        # Run in development mode
yarn build      # Build for production
```

See [Build Instructions](docs/dev/BUILD.md) for detailed requirements.

## License

**MarkDown++ is free for personal and non-commercial use.**

| License | Use Case |
|---------|----------|
| **MIT License** | Personal projects, open-source, education, non-commercial purposes |
| **Commercial License** | Commercial SaaS, OEM embedding, proprietary redistribution |

See [LICENSE](LICENSE) and [COMMERCIAL_LICENSE.md](COMMERCIAL_LICENSE.md) for details.

---

## Development

Want to contribute or build from source?

### Prerequisites

- **Node.js**: >= v16
- **Yarn**: v1.x (classic)
- **Python**: For native module compilation
- **C++ Compiler**: Platform-specific (VS Build Tools / Xcode / gcc)

### Quick Start

```bash
yarn install
yarn dev
yarn lint
yarn test
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` / `Cmd+S` | Save |
| `Ctrl+Shift+S` / `Cmd+Shift+S` | Save As |
| `Ctrl+P` / `Cmd+P` | Quick Open |
| `Ctrl+F` / `Cmd+F` | Find |
| `Ctrl+H` / `Cmd+Alt+F` | Replace |
| `Ctrl+/` / `Cmd+/` | Toggle source code mode |
| `Ctrl+Shift+P` / `Cmd+Shift+P` | Command palette |

---

## Contribution

MarkDown++ is in active development. We welcome contributions!

- **Bug reports**: [Open an issue](https://github.com/nlstone/Markdown-PlusPlus/issues/new?template=bug_report.md)
- **Feature requests**: [Suggest an idea](https://github.com/nlstone/Markdown-PlusPlus/issues/new?template=feature_request.md)
- **Pull requests**: Submit PRs against the `dev` branch

Please read the [Contributing Guide](CONTRIBUTING.md) before making a pull request.

---

<div align="center">

**Star us on GitHub if you like MarkDown++!** :star:

</div>
