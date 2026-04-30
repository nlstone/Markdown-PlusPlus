# Application Data Directory

The per-user application data directory is located in the following directory:

- `%APPDATA%\markdownpp` on Windows
- `$XDG_CONFIG_HOME/markdownpp` or `~/.config/markdownpp` on Linux
- `~/Library/Application Support/markdownpp` on macOS

When [portable mode](PORTABLE.md) is enabled, the directory location is either the `--user-data-dir` parameter or `markdownpp-user-data` directory.
