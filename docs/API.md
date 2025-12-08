# Markdown Parser - API Documentation

## Table of Contents

1. [Installation](#installation)
2. [Quick Start](#quick-start)
3. [Core Classes](#core-classes)
4. [API Reference](#api-reference)
5. [Plugin System](#plugin-system)
6. [Examples](#examples)
7. [Configuration](#configuration)
8. [CLI Usage](#cli-usage)

## Installation

```bash
npm install markdown-parser
```

Or with yarn:

```bash
yarn add markdown-parser
```

## Quick Start

### Basic Usage

```javascript
const { MarkdownParser } = require("markdown-parser");

const parser = new MarkdownParser();
const html = parser.parse("# Hello\n\nThis is **bold** text.");
console.log(html);
```

### Using the API

```javascript
const API = require("markdown-parser").API;

// Parse markdown to HTML
const html = API.parseMarkdown("# Title\n\nContent");

// Get statistics
const stats = API.getStatistics("# Title");

// Generate table of contents
const toc = API.generateTableOfContents("# Title\n## Section");

// Extract information
const links = API.extractLinks("Check [this](url)");
const images = API.extractImages("![alt](image.jpg)");
```

## Core Classes

### MarkdownParser

Main class for parsing Markdown documents.

#### Constructor

```javascript
const parser = new MarkdownParser(options);
```

#### Options

- `breaks` (boolean): Convert line breaks to `<br>` tags
- `pedantic` (boolean): Use strict Markdown parsing
- `gfm` (boolean): Use GitHub Flavored Markdown
- `tables` (boolean): Parse tables
- `strikethrough` (boolean): Parse ~~strikethrough~~ text
- `taskLists` (boolean): Parse task lists
- `smartypants` (boolean): Use smart typography
- `langPrefix` (string): Prefix for code block language classes
- `sanitize` (boolean): Sanitize HTML output

#### Methods

##### `parse(markdown: string): string`

Converts Markdown to HTML.

```javascript
const html = parser.parse("# Title");
```

##### `parseToAST(markdown: string): object`

Generates an Abstract Syntax Tree from Markdown.

```javascript
const ast = parser.parseToAST("# Title");
```

##### `parseWithRenderer(markdown: string, renderer: object): string`

Parse with a custom renderer.

```javascript
const customRenderer = {
  render: (ast) => {
    // Custom rendering logic
  },
};
const output = parser.parseWithRenderer(markdown, customRenderer);
```

##### `getStatistics(markdown: string): object`

Get document statistics.

```javascript
const stats = parser.getStatistics(markdown);
// Returns: { lines, characters, tokens, nodes, headings, links, images, lists, codeBlocks, tables }
```

##### `validate(markdown: string): object`

Validate Markdown syntax.

```javascript
const validation = parser.validate(markdown);
// Returns: { valid: boolean, errors: string[] }
```

##### `use(name: string, plugin: function): MarkdownParser`

Register a plugin.

```javascript
parser.use("myPlugin", (ast) => {
  // Process AST
});
```

##### `extend(name: string, extension: object): MarkdownParser`

Register an extension.

```javascript
parser.extend("customSyntax", {
  tokenRules: {
    /* ... */
  },
  renderers: {
    /* ... */
  },
});
```

### HTMLRenderer

Renders AST to HTML.

```javascript
const { HTMLRenderer } = require("markdown-parser");

const renderer = new HTMLRenderer(options);
const html = renderer.render(ast);
```

#### Methods

- `render(ast: object): string` - Render AST to HTML
- `generateFullPage(content: string, meta: object): string` - Generate complete HTML page
- `generateCSS(): string` - Generate default CSS

### MarkdownRenderer

Renders AST back to Markdown.

```javascript
const { MarkdownRenderer } = require("markdown-parser");

const renderer = new MarkdownRenderer();
const markdown = renderer.render(ast);
```

### Tokenizer

Converts Markdown to tokens.

```javascript
const { Tokenizer } = require("markdown-parser");

const tokenizer = new Tokenizer();
const tokens = tokenizer.tokenize(markdown);
const inlineTokens = tokenizer.tokenizeInline(text);
```

### ASTBuilder

Builds AST from tokens.

```javascript
const { ASTBuilder } = require("markdown-parser");

const builder = new ASTBuilder();
const ast = builder.build(tokens);
```

## API Reference

### MarkdownAPI

Convenient methods for common operations.

```javascript
const API = require("markdown-parser").API;
```

#### Methods

##### `parseMarkdown(markdown: string, options?: object): string`

Parse Markdown to HTML.

##### `parseToAST(markdown: string, options?: object): object`

Parse Markdown to AST.

##### `generateHTMLPage(markdown: string, meta?: object, options?: object): string`

Generate a complete HTML page.

##### `validate(markdown: string, options?: object): object`

Validate Markdown.

##### `getStatistics(markdown: string, options?: object): object`

Get document statistics.

##### `generateTableOfContents(markdown: string, options?: object): array`

Generate table of contents.

##### `extractLinks(markdown: string, options?: object): array`

Extract all links from document.

##### `extractImages(markdown: string, options?: object): array`

Extract all images from document.

##### `extractHeadings(markdown: string, options?: object): array`

Extract all headings from document.

##### `filterByType(markdown: string, type: string, options?: object): array`

Filter nodes by type.

##### `transform(markdown: string, transform: function, options?: object): string`

Transform document using a function.

## Plugin System

### Available Plugins

#### LinkProcessorPlugin

Process and validate links.

```javascript
const { LinkProcessorPlugin } = require("markdown-parser");

const plugin = new LinkProcessorPlugin({
  validateUrls: true,
  externalLinkTarget: true,
});
```

#### ImageProcessorPlugin

Process images with lazy loading and responsive options.

```javascript
const { ImageProcessorPlugin } = require("markdown-parser");

const plugin = new ImageProcessorPlugin({
  lazyLoading: true,
  responsive: true,
});
```

#### HeadingIdPlugin

Automatically generate IDs for headings.

```javascript
const { HeadingIdPlugin } = require("markdown-parser");
const plugin = new HeadingIdPlugin();
```

#### CodeHighlightPlugin

Enable syntax highlighting for code blocks.

```javascript
const { CodeHighlightPlugin } = require("markdown-parser");
const plugin = new CodeHighlightPlugin();
```

#### AnchorLinkPlugin

Create anchor links for headings.

```javascript
const { AnchorLinkPlugin } = require("markdown-parser");
const plugin = new AnchorLinkPlugin();
```

#### EmojiPlugin

Convert emoji codes to emoji characters.

```javascript
const { EmojiPlugin } = require("markdown-parser");
const plugin = new EmojiPlugin();
```

### Creating Custom Plugins

```javascript
const { BasePlugin } = require("markdown-parser");

class MyPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "MyPlugin";
  }

  execute(ast) {
    // Process the AST
    this.traverse(ast);
  }

  traverse(node) {
    if (!node) return;

    // Your processing logic here
    if (node.type === "heading") {
      // Do something with heading
    }

    if (node.children) {
      node.children.forEach((child) => this.traverse(child));
    }
  }
}

// Use the plugin
const parser = new MarkdownParser();
parser.use("myPlugin", (ast) => {
  new MyPlugin().execute(ast);
});
```

## Examples

### Example 1: Basic Conversion

```javascript
const parser = new MarkdownParser();
const markdown = "# Hello\n\nThis is **bold**.";
const html = parser.parse(markdown);
console.log(html);
// Output: <h1>Hello</h1>\n<p>This is <strong>bold</strong>.</p>
```

### Example 2: Using Plugins

```javascript
const parser = new MarkdownParser();
const { HeadingIdPlugin } = require("markdown-parser");

parser.use("headingId", (ast) => {
  new HeadingIdPlugin().execute(ast);
});

const ast = parser.parseToAST("# My Title");
console.log(ast.children[0].id); // 'my-title'
```

### Example 3: Extract Information

```javascript
const API = require("markdown-parser").API;

const markdown = "# Document\n\n[Link](url) and ![Image](img.jpg)";
const links = API.extractLinks(markdown);
const images = API.extractImages(markdown);

console.log(links); // [{ text: 'Link', href: 'url', ... }]
console.log(images); // [{ alt: 'Image', src: 'img.jpg', ... }]
```

### Example 4: File Processing

```javascript
const fs = require("fs");
const API = require("markdown-parser").API;

// Read Markdown file
const markdown = fs.readFileSync("document.md", "utf-8");

// Convert to HTML
const html = API.parseMarkdown(markdown);

// Generate full page
const page = API.generateHTMLPage(markdown, {
  title: "My Document",
  author: "John Doe",
});

// Write output
fs.writeFileSync("document.html", page);
```

### Example 5: Table of Contents

```javascript
const API = require("markdown-parser").API;

const markdown = `
# Introduction
## Getting Started
### Installation
## Usage
### Basic Example
# Conclusion
`;

const toc = API.generateTableOfContents(markdown);
console.log(JSON.stringify(toc, null, 2));
```

## Configuration

### Parser Options

```javascript
const parser = new MarkdownParser({
  // Block elements
  gfm: true, // GitHub Flavored Markdown
  tables: true, // Parse tables
  pedantic: false, // Strict parsing

  // Inline elements
  strikethrough: true, // ~~text~~
  breaks: false, // Line breaks to <br>

  // Output
  sanitize: false, // Sanitize HTML
  langPrefix: "language-", // Code block prefix
  smartypants: false, // Smart typography
});
```

### Renderer Options

```javascript
const renderer = new HTMLRenderer({
  sanitize: false,
  highlightCode: false,
  breaks: false,
  typographer: false,
});
```

## CLI Usage

### Commands

#### Convert

Convert Markdown to HTML:

```bash
markdown-parser convert document.md
markdown-parser convert document.md --output output.html
markdown-parser convert document.md --full-page --title "My Document"
```

#### Validate

Validate Markdown syntax:

```bash
markdown-parser validate document.md
```

#### Statistics

Get document statistics:

```bash
markdown-parser stats document.md
```

#### Table of Contents

Generate table of contents:

```bash
markdown-parser toc document.md
markdown-parser toc document.md --output toc.md
```

#### Watch

Watch for file changes:

```bash
markdown-parser watch document.md --output document.html
```

#### Other Commands

```bash
markdown-parser version      # Show version
markdown-parser help         # Show help
markdown-parser plugins      # List available plugins
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please visit: https://github.com/Zenoviia/Markdown-parser/issues
