# Build Instructions

Clone the repository:

```
git clone https://github.com/nlstone/Markdown-PlusPlus.git
```

### Prerequisites

Before you can get started developing, you need set up your build environment:

- Node.js `>=v16` but `<v17` and yarn
- Python `>=v3.6` for node-gyp
- C++ compiler and development tools
- Build is supported on Linux, macOS and Windows

**Additional development dependencies on Linux:**

- libX11 (with headers)
- libxkbfile (with headers)
- libsecret (with headers)
- libfontconfig (with headers)

On Debian-based Linux: `sudo apt-get install libx11-dev libxkbfile-dev libsecret-1-dev libfontconfig-dev`

On Red Hat-based Linux: `sudo dnf install libX11-devel libxkbfile-devel libsecret-devel fontconfig-devel`

**Additional development dependencies on Windows:**

- Windows 10 SDK (only needed before Windows 10)
- Visual Studio 2019 (preferred)

### Let's build

1. Go to `MarkdownPlus` folder
2. Install dependencies: `yarn install` or `yarn install --frozen-lockfile`
3. Build MarkDown++ binaries and packages: `yarn run build`
4. MarkDown++ binary is located under `build` folder

Copy the build app to applications folder, or if on Windows run the executable installer.

### Important scripts

```
$ yarn run <script> # or npm run <script>
```

| Script          | Description                                      |
| --------------- | ------------------------------------------------ |
| `build`         | Build MarkDown++ binaries and packages for your OS |
| `build:bin`     | Build MarkDown++ binary for your OS                |
| `dev`           | Build and run MarkDown++ in developer mode         |
| `lint`          | Lint code style                                  |
| `test` / `unit` | Run unit tests                                   |

For more scripts please see `package.json`.
