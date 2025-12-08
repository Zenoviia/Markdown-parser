/**
 * Usage Examples
 * Приклади використання Markdown Parser
 */

const MarkdownParser = require("../src/core/parser");
const API = require("../src/api");
const {
  PluginManager,
  HeadingIdPlugin,
  AnchorLinkPlugin,
} = require("../src/plugins/pluginSystem");
const fs = require("fs");

console.log("=== Markdown Parser Examples ===\n");

// ===== Example 1: Basic Parsing =====
console.log("1. Basic Parsing:");
const parser = new MarkdownParser();
const markdown = `# Hello World

This is a **bold** text and this is *italic*.

- Item 1
- Item 2
- Item 3
`;

const html = parser.parse(markdown);
console.log(html);
console.log("\n");

// ===== Example 2: AST Generation =====
console.log("2. AST Generation:");
const ast = parser.parseToAST(markdown);
console.log(JSON.stringify(ast, null, 2));
console.log("\n");

// ===== Example 3: Statistics =====
console.log("3. Document Statistics:");
const stats = parser.getStatistics(markdown);
console.log("Statistics:", stats);
console.log("\n");

// ===== Example 4: Validation =====
console.log("4. Markdown Validation:");
const validation = parser.validate(markdown);
console.log("Valid:", validation.valid);
console.log("Errors:", validation.errors);
console.log("\n");

// ===== Example 5: Table of Contents =====
console.log("5. Table of Contents:");
const complexMarkdown = `# Introduction

This is introduction.

## Chapter 1

### Section 1.1

Content here.

### Section 1.2

More content.

## Chapter 2

Final chapter.
`;

const toc = API.generateTableOfContents(complexMarkdown);
console.log("TOC:", JSON.stringify(toc, null, 2));
console.log("\n");

// ===== Example 6: Extract Information =====
console.log("6. Extract Information:");
const markdownWithLinks = `
# Article

Check out [Google](https://google.com) and [GitHub](https://github.com).

![Cat Image](https://example.com/cat.jpg)
`;

const links = API.extractLinks(markdownWithLinks);
const images = API.extractImages(markdownWithLinks);
console.log("Links:", links);
console.log("Images:", images);
console.log("\n");

// ===== Example 7: Using Plugins =====
console.log("7. Using Plugins:");
const parserWithPlugins = new MarkdownParser();

// Add heading ID plugin
parserWithPlugins.use("headingId", (ast) => {
  const plugin = new HeadingIdPlugin();
  plugin.execute(ast);
});

// Add anchor link plugin
parserWithPlugins.use("anchorLink", (ast) => {
  const plugin = new AnchorLinkPlugin();
  plugin.execute(ast);
});

const astWithIds = parserWithPlugins.parseToAST("# My Section");
console.log("AST with plugins:", JSON.stringify(astWithIds, null, 2));
console.log("\n");

// ===== Example 8: Custom Options =====
console.log("8. Custom Options:");
const customParser = new MarkdownParser({
  breaks: true,
  gfm: true,
  tables: true,
  strikethrough: true,
});

const customMarkdown = "~~Strike~~ text\n\nLine 1\nLine 2 (with break)";
const customHtml = customParser.parse(customMarkdown);
console.log(customHtml);
console.log("\n");

// ===== Example 9: HTML Page Generation =====
console.log("9. HTML Page Generation:");
const fullPage = API.generateHTMLPage("# My Document\n\nThis is a paragraph.", {
  title: "My Page",
  author: "John Doe",
  description: "A sample page",
});
console.log(fullPage.substring(0, 300) + "...");
console.log("\n");

// ===== Example 10: Working with Files =====
console.log("10. Working with Files:");

// Create sample markdown file
const sampleMarkdown = `# Sample Document

## Introduction

This is a sample document for testing.

## Features

- Markdown parsing
- HTML rendering
- AST generation
- Plugin system

\`\`\`javascript
// Code example
const greeting = "Hello";
console.log(greeting);
\`\`\`

## Conclusion

Markdown parser is powerful!
`;

fs.writeFileSync("sample.md", sampleMarkdown);
console.log("✓ Created sample.md");

// Parse the file
const fileContent = fs.readFileSync("sample.md", "utf-8");
const fileHtml = parser.parse(fileContent);
fs.writeFileSync("sample.html", fileHtml);
console.log("✓ Generated sample.html");

// Generate statistics
const fileStats = parser.getStatistics(fileContent);
console.log("File stats:", fileStats);

// Clean up
fs.unlinkSync("sample.md");
fs.unlinkSync("sample.html");
console.log("✓ Cleaned up test files\n");

// ===== Example 11: API Methods =====
console.log("11. Using API Methods:");
console.log("API version:", API.getVersion());
console.log("API info:", JSON.stringify(API.getInfo(), null, 2));
console.log("\n");

// ===== Example 12: Parser Cloning =====
console.log("12. Parser Cloning:");
const originalParser = new MarkdownParser({ gfm: true });
const clonedParser = originalParser.clone({ breaks: true });
console.log("Original GFM:", originalParser.options.gfm);
console.log("Cloned breaks:", clonedParser.options.breaks);
console.log("\n");

// ===== Example 13: Error Handling =====
console.log("13. Error Handling:");
try {
  parser.parse(123); // This should throw
} catch (error) {
  console.log("Caught error:", error.message);
}
console.log("\n");

// ===== Example 14: Complex Document =====
console.log("14. Complex Document Parsing:");
const complexDoc = `# Technical Documentation

## Overview

This is a comprehensive guide.

### Prerequisites

- Node.js v12+
- npm or yarn

\`\`\`bash
npm install markdown-parser
\`\`\`

## Usage

### Basic Example

\`\`\`javascript
const parser = new MarkdownParser();
const html = parser.parse('# Hello');
\`\`\`

## Features Comparison

| Feature | Supported |
|---------|-----------|
| Headings | Yes |
| Lists | Yes |
| Tables | Yes |
| Code | Yes |

## References

- [Official Docs](https://example.com)
- [GitHub](https://github.com)

---

*Last updated: ${new Date().toISOString()}*
`;

const complexStats = parser.getStatistics(complexDoc);
console.log("Complex document stats:", complexStats);
console.log("\n");

// ===== Example 15: Performance Testing =====
console.log("15. Performance Testing:");
let largeMarkdown = "";
for (let i = 0; i < 50; i++) {
  largeMarkdown += `# Section ${i}\n\nContent paragraph ${i}\n\n`;
}

const startTime = Date.now();
const largeHtml = parser.parse(largeMarkdown);
const endTime = Date.now();

console.log(
  `Parsed ${largeMarkdown.length} characters in ${endTime - startTime}ms`
);
console.log(`Generated HTML size: ${largeHtml.length} characters\n`);

console.log("=== All Examples Completed ===");
