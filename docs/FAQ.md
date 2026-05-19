# Frequently Asked Questions (FAQ)

### What are the supported platforms?

MarkDown++ is a desktop application and available for:

- Linux x64 (tested on Debian and Red Hat based distros)
- macOS 10.10 x64 or later
- Windows 7-10 x86 and x64

### Is MarkDown++ open-source and free?

MarkDown++ is dual-licensed:

- **MIT License** — Free for personal use, open-source projects, education, and non-commercial purposes. The source code is available on [GitHub](https://github.com/nlstone/Markdown-PlusPlus).
- **Commercial License** — Required for commercial SaaS deployment, proprietary redistribution, or OEM embedding. See [COMMERCIAL_LICENSE.md](https://github.com/nlstone/Markdown-PlusPlus/blob/master/COMMERCIAL_LICENSE.md) for details.

If you are unsure whether your use case requires a commercial license, please contact us at license@markdownpp.dev.

### Can I use MarkDown++ as note management/taking app?

MarkDown++ is a pure markdown editor without feature such as knowledge management and tags but yes, you can do this via the integrated filesystem explorer and task lists.

### Where can I find documentation?

Documentation is currently under development.

- [End-user documentation](https://github.com/nlstone/Markdown-PlusPlus/blob/develop/docs/README.md)

- [Developer documentation](https://github.com/nlstone/Markdown-PlusPlus/blob/develop/docs/dev/README.md)

### Can I run a portable version of MarkDown++?

Yes, please see [here](PORTABLE.md) for further information.

### How can I report bugs and problems

You can report bugs and problems via our [GitHub issue tracker](https://github.com/nlstone/Markdown-PlusPlus/issues). Please provide a detailed description of the problem to better solve the issue.

### I cannot launch MarkDown++ on Linux (SUID sandbox)

> *The SUID sandbox helper binary was found, but is not configured correctly.*

Normally, you should never get this error but if you disabled user namespaces, this error message may appears in the command output when launching MarkDown++. To solve the issue, that Chromium cannot start the sandbox (process), you can choose one of the following steps:

- Enable Linux kernel user namespaces to use the preferred sandbox: `sudo sysctl kernel.unprivileged_userns_clone=1`.
- Set correct SUID sandbox helper binary permissions: `sudo chown root <path_to_markdownpp_dir>/chrome-sandbox && sudo chmod 4755 <path_to_markdownpp_dir>/chrome-sandbox`. This is preferred if you don't want to enable user namespaces.
- Launch MarkDown++ with `--no-sandbox` argument.
