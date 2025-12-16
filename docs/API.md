# Markdown Parser - API Documentation

## Quick Start

### Installation

```bash
npm install markdown-parser
```

### Basic Usage

```javascript
const { MarkdownParser } = require("markdown-parser");

const parser = new MarkdownParser();
const html = parser.parse("# Hello\n\nThis is **bold** text.");
```

### Using the API

```javascript
const API = require("markdown-parser").API;

const html = API.parseMarkdown("# Title");
const stats = API.getStatistics(markdown);
const toc = API.generateTableOfContents(markdown);
const links = API.extractLinks(markdown);
```

## Core Classes

### MarkdownParser

Main class for parsing Markdown documents.

```javascript
const parser = new MarkdownParser(options);
```

#### Constructor Options

- `breaks` - Convert line breaks to `<br>` tags (default: false)
- `gfm` - Use GitHub Flavored Markdown (default: true)
- `tables` - Parse tables (default: true)
- `strikethrough` - Parse ~~strikethrough~~ (default: true)
- `smartypants` - Use smart typography (default: false)

#### Main Methods

| Method                    | Returns | Description                                    |
| ------------------------- | ------- | ---------------------------------------------- |
| `parse(markdown)`         | string  | Convert Markdown to HTML                       |
| `parseToAST(markdown)`    | object  | Convert Markdown to AST                        |
| `validate(markdown)`      | object  | Check Markdown validity                        |
| `getStatistics(markdown)` | object  | Get document stats (lines, words, links, etc.) |
| `exportAsJSON(markdown)`  | string  | Export as JSON                                 |

#### Plugin Methods

```javascript
parser.use(name, pluginFunction); // Register plugin
parser.unuse(name); // Remove plugin
parser.setOptions(options); // Update options
parser.getOptions(); // Get current options
```

### Renderers

#### HTMLRenderer

```javascript
const { HTMLRenderer } = require("markdown-parser");
const renderer = new HTMLRenderer();

renderer.render(ast); // AST to HTML
renderer.generateFullPage(html, meta); // Full HTML page
renderer.generateCSS(); // Default styles
```

#### MarkdownRenderer

```javascript
const { MarkdownRenderer } = require("markdown-parser");
const renderer = new MarkdownRenderer();

renderer.render(ast); // AST to Markdown
```

## Plugin System

### Built-in Plugins

```javascript
const {
  LinkProcessorPlugin,
  ImageProcessorPlugin,
  HeadingIdPlugin,
  AnchorLinkPlugin,
  CodeHighlightPlugin,
  EmojiPlugin,
} = require("markdown-parser");

// Example: Add heading IDs
parser.use("headingId", (ast) => {
  new HeadingIdPlugin().execute(ast);
});
```

**Available Plugins:**

- **LinkProcessorPlugin** - Validate and process links
- **ImageProcessorPlugin** - Add lazy loading and responsive images
- **HeadingIdPlugin** - Auto-generate heading IDs
- **AnchorLinkPlugin** - Create anchor links for headings
- **CodeHighlightPlugin** - Syntax highlighting for code blocks
- **EmojiPlugin** - Convert `:emoji:` codes

### Custom Plugins

```javascript
const { BasePlugin } = require("markdown-parser");

class MyPlugin extends BasePlugin {
  execute(ast) {
    this.traverse(ast);
  }

  traverse(node) {
    if (!node) return;

    // Process node
    if (node.type === "heading") {
      // Modify heading
    }

    if (node.children) {
      node.children.forEach((child) => this.traverse(child));
    }
  }
}

parser.use("myPlugin", (ast) => {
  new MyPlugin().execute(ast);
});
```

## Public API Methods

```javascript
const API = require("markdown-parser").API;
```

| Method                        | Description             |
| ----------------------------- | ----------------------- |
| `parseMarkdown(md)`           | Parse to HTML           |
| `parseToAST(md)`              | Parse to AST            |
| `validate(md)`                | Check validity          |
| `getStatistics(md)`           | Get document stats      |
| `generateTableOfContents(md)` | Extract headings as TOC |
| `extractLinks(md)`            | Get all links           |
| `extractImages(md)`           | Get all images          |
| `extractHeadings(md)`         | Get all headings        |
| `generateHTMLPage(md, meta)`  | Full HTML page          |

## Configuration

### Parser Options

```javascript
const parser = new MarkdownParser({
  gfm: true, // GitHub Flavored Markdown
  tables: true, // Parse tables
  strikethrough: true, // ~~text~~
  breaks: false, // Line breaks to <br>
  sanitize: false, // Sanitize HTML
  smartypants: false, // Smart typography
});
```

## Utility Functions

See [UTILITIES.md](UTILITIES.md) for complete reference:

- **String utilities** - `escapeHtml`, `unescapeHtml`, `escapeRegex`
- **Validation** - `isUrl`, `isEmail`, `containsHtmlTags`
- **Text search** - `findUrls`, `findEmails`
- **Array utilities** - `unique`, `shuffle`, `groupBy`, `sortBy`

```javascript
const { Utils } = require("markdown-parser");

Utils.escapeHtml("<div>"); // "&lt;div&gt;"
Utils.isUrl("https://example.com"); // true
Utils.unique([1, 2, 2, 3]); // [1, 2, 3]
```

## Error Handling

### Type Errors

```javascript
try {
  parser.parse(123); // Must be string
} catch (error) {
  console.error(error.message);
}
```

### Validation

```javascript
const result = parser.validate(markdown);
if (!result.valid) {
  console.log(result.errors);
}
```

### Plugin Errors

Plugins fail gracefully - errors don't crash parsing:

```javascript
parser.use("plugin", (ast) => {
  throw new Error("Plugin failed");
});

const html = parser.parse(markdown); // Still generates output
```

## Examples

### Basic Conversion

```javascript
const parser = new MarkdownParser();
const html = parser.parse("# Title\n\n**Bold** text");
```

### With Statistics

```javascript
const parser = new MarkdownParser();
const stats = parser.getStatistics(markdown);

console.log(stats.lines);
console.log(stats.words);
console.log(stats.links);
```

### Table of Contents

```javascript
const API = require("markdown-parser").API;
const toc = API.generateTableOfContents(markdown);

// Returns: [
//   { level: 1, text: "Title", id: "title" },
//   { level: 2, text: "Section", id: "section" },
//   ...
// ]
```

### File Processing

```javascript
const fs = require("fs");
const API = require("markdown-parser").API;

const markdown = fs.readFileSync("input.md", "utf-8");
const html = API.parseMarkdown(markdown);
const page = API.generateHTMLPage(html, { title: "My Doc" });

fs.writeFileSync("output.html", page);
```

### Using Plugins

```javascript
const parser = new MarkdownParser();
const { HeadingIdPlugin } = require("markdown-parser");

parser.use("headingId", (ast) => {
  new HeadingIdPlugin().execute(ast);
});

const ast = parser.parseToAST("# My Title");
console.log(ast.children[0].id); // "my-title"
```

## CLI Usage

See [README.md](../README.md#-cli-usage) for complete CLI reference.

### Commands

```bash
markdown-parser convert input.md --output output.html
markdown-parser validate document.md
markdown-parser stats document.md
markdown-parser toc document.md
markdown-parser watch input.md --output output.html
```

## Server API

See [README.md](../README.md#-http-server--endpoints) for REST API documentation.

### Endpoints

- `POST /parse` - Parse to AST
- `POST /convert` - Parse to HTML
- `POST /validate` - Validate Markdown
- `POST /statistics` - Get statistics

## Additional Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - System design and component overview
- [TESTING.md](TESTING.md) - Testing strategy and test structure
- [UTILITIES.md](UTILITIES.md) - Complete utility functions reference
- [README.md](../README.md) - Project overview with CLI and Server guides

## Support

For issues and questions: https://github.com/Zenoviia/Markdown-parser/issues
