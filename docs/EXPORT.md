# Export a Document

MarkDown++ allows you to export a markdown document as PDF, HTML, or Word `.docx` file, or to print the document.

## Word documents

Word `.docx` export requires [pandoc](https://pandoc.org/) to be installed. You can set the `MARKDOWNPP_PANDOC` environment variable if pandoc is not available on your `PATH`.

DOCX export converts the current Markdown source through pandoc. It uses Word/pandoc document styles, so it will not exactly match the HTML/PDF export theme.

## Options

### Page options

You can set the page size, orientation and margin before exporting a document.

### Style

Adjust the page style without modify the page theme:

- Overwrite font family, size and line height.
- Auto numbering headings.
- Option to show the front matter on the exported document.

### Theme

MarkDown++ allows you to select a page theme before exporting. You can learn more about page themes [here](EXPORT_THEMES.md).

### Header and footer

You can include a header and/or footer in the exported document if you choose PDF or printing and also adjust the header/footer style. You can select between no, a single or a three cell header in export options. The header and/or footer appear on each page when defined and the header can be multiline but the footer only single line. Unfortunately, page numbering is currently not supported. An example can be seen below.

![](assets/markdownpp-export-header.png)

![](assets/markdownpp-export-pdf.png)
