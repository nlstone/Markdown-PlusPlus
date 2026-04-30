# Portable Mode

MarkDown++ stores all user configuration inside the [application data directory](APPLICATION_DATA_DIRECTORY.md) that can be changed with `--user-data-dir` command-line flag.

## Linux and Windows

On Linux and Windows you can also create a directory called `markdownpp-user-data` to save all user data inside the directory. Like:

```
markdownpp-portable/
 ├── markdownpp (Linux) or MarkDown++.exe (Windows)
 ├── markdownpp-user-data/
 ├── resources/
 ├── THIRD-PARTY-LICENSES.txt
 └── ...
```
