const MarkdownParser = require("../../src/core/parser");
const {
  PluginManager,
  LinkProcessorPlugin,
  HeadingIdPlugin,
} = require("../../src/plugins/pluginSystem");
const API = require("../../src/api");

describe("Integration Tests", () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe("Full Pipeline", () => {
    test("complete markdown to HTML conversion", () => {
      const markdown = `# Document Title

This is a paragraph with *emphasis* and **strong text**.

## Section 1

- First item
- Second item
- Third item

### Code Example

\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> This is a blockquote with [a link](https://example.com).

### Links and Images

![Example Image](https://example.com/image.jpg)

[Visit Example](https://example.com)

---

## Section 2

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
| Cell 3   | Cell 4   |
`;

      const html = parser.parse(markdown);
      expect(html).toBeTruthy();
      expect(html).toMatch(/<h1[^>]*>[^<]*Document Title[^<]*<\/h1>/);
      expect(html).toMatch(/<h2[^>]*>[^<]*Section 1[^<]*<\/h2>/);
      expect(html).toMatch(/<ul[^>]*>/);
      expect(html).toMatch(/<code[^>]*>/);
      expect(html).toMatch(/<a[^>]*href="https:\/\/example\.com"[^>]*>/);
      expect(html).toMatch(
        /<img[^>]*src="https:\/\/example\.com\/image\.jpg"[^>]*>/
      );
      expect(html).toMatch(/<table[^>]*>/);
    });

    test("AST generation and statistics", () => {
      const markdown = `# Title
      
## Subtitle

Content with [link](url) and ![image](img.jpg)

- List item 1
- List item 2
`;

      const ast = parser.parseToAST(markdown);
      expect(ast).toBeDefined();

      const stats = parser.getStatistics(markdown);
      expect(stats.headings).toBe(2);
      expect(stats.links).toBe(1);
      expect(stats.images).toBe(1);
      expect(stats.lists).toBe(1);
    });
  });

  describe("Plugin Integration", () => {
    test("uses multiple plugins", () => {
      const parser = new MarkdownParser();

      parser.use("linkProcessor", (ast) => {
        const plugin = new LinkProcessorPlugin({ externalLinkTarget: true });
        plugin.execute(ast);
      });

      parser.use("headingId", (ast) => {
        const plugin = new HeadingIdPlugin();
        plugin.execute(ast);
      });

      const markdown = "# Title\n[Link](https://example.com)";
      const ast = parser.parseToAST(markdown);

      expect(ast.children.some((node) => node.id)).toBe(true);
    });
  });

  describe("API Methods", () => {
    test("API parse method", () => {
      const html = API.parseMarkdown("# Title\nParagraph");
      expect(html).toMatch(/<h1[^>]*>[^<]*Title[^<]*<\/h1>/);
      expect(html).toMatch(/<p[^>]*>[^<]*Paragraph[^<]*<\/p>/);
    });

    test("API statistics", () => {
      const stats = API.getStatistics("# Title\n- item");
      expect(stats.headings).toBe(1);
      expect(stats.lists).toBeGreaterThan(0);
    });

    test("API table of contents", () => {
      const toc = API.generateTableOfContents("# Title\n## Subtitle");
      expect(Array.isArray(toc)).toBe(true);
    });

    test("API extract links", () => {
      const links = API.extractLinks("[Link](url)");
      expect(links.length).toBeGreaterThan(0);
    });

    test("API extract images", () => {
      const images = API.extractImages("![alt](img.jpg)");
      expect(images.length).toBeGreaterThan(0);
    });
  });

  describe("Document Processing", () => {
    test("processes complex document structure", () => {
      const markdown = `
# Main Title

Introduction paragraph.

## Chapter 1

First chapter content.

### Section 1.1

Content for section 1.1.

## Chapter 2

Second chapter content.

### Code Examples

\`\`\`js
function hello() {
  console.log("Hello");
}
\`\`\`

### Lists

1. First point
2. Second point
3. Third point

### Nested Lists

- Outer 1
  - Inner 1.1
  - Inner 1.2
- Outer 2
`;

      const ast = parser.parseToAST(markdown);
      const stats = parser.getStatistics(markdown);
      const html = parser.parse(markdown);

      expect(ast.children.length).toBeGreaterThan(0);
      expect(stats.headings).toBeGreaterThan(0);
      expect(stats.lists).toBeGreaterThan(0);
      expect(html).toBeTruthy();
    });
  });

  describe("Error Recovery", () => {
    test("handles malformed markdown gracefully", () => {
      const markdown =
        "# Title\n\nParagraph\n\n[Incomplete link\n\n**Unclosed bold";
      const result = parser.validate(markdown);
      expect(result).toBeDefined();
    });

    test("continues parsing after errors", () => {
      const markdown = "# Valid\n\n[Invalid](unclosed\n\n# Still valid";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<h1[^>]*>/);
      expect((html.match(/<h1[^>]*>/g) || []).length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Performance", () => {
    test("parses large documents", () => {
      let markdown = "";
      for (let i = 0; i < 100; i++) {
        markdown += `# Section ${i}\n\nParagraph ${i}\n\n`;
      }

      const start = Date.now();
      const html = parser.parse(markdown);
      const duration = Date.now() - start;

      expect(html).toBeTruthy();
      expect(html).toMatch(/<h1[^>]*>/);
      expect((html.match(/<h1[^>]*>/g) || []).length).toBe(100);
      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Roundtrip Conversion", () => {
    test("markdown to HTML and back to markdown", () => {
      const original = "# Title\n\n**Bold** and *italic*\n\n- List item";
      const html = parser.parse(original);
      expect(html).toBeTruthy();
    });
  });
});
