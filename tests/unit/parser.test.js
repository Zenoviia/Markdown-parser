/**
 * Parser Tests
 * Тести для основного парсера
 */

const MarkdownParser = require("../../src/core/parser");

describe("MarkdownParser", () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe("Basic Parsing", () => {
    test("parses headings", () => {
      const markdown = "# Heading 1\n## Heading 2";
      const html = parser.parse(markdown);
      expect(html).toContain("<h1");
      expect(html).toContain("</h1>");
      expect(html).toContain("<h2");
      expect(html).toContain("</h2>");
    });

    test("parses paragraphs", () => {
      const markdown = "This is a paragraph.\n\nThis is another paragraph.";
      const html = parser.parse(markdown);
      expect(html).toContain("<p>");
      expect(html).toContain("</p>");
    });

    test("parses emphasis", () => {
      const markdown = "*italic* and **bold**";
      const html = parser.parse(markdown);
      expect(html).toContain("<em>italic</em>");
      expect(html).toContain("<strong>bold</strong>");
    });

    test("parses links", () => {
      const markdown = "[Link](https://example.com)";
      const html = parser.parse(markdown);
      expect(html).toContain('<a href="https://example.com">Link</a>');
    });

    test("parses images", () => {
      const markdown = "![alt](image.jpg)";
      const html = parser.parse(markdown);
      expect(html).toContain("<img");
      expect(html).toContain("alt");
    });

    test("parses code blocks", () => {
      const markdown = "```javascript\nconst x = 1;\n```";
      const html = parser.parse(markdown);
      expect(html).toContain("<code");
      expect(html).toContain("const x = 1");
    });

    test("parses inline code", () => {
      const markdown = "Use `const` keyword";
      const html = parser.parse(markdown);
      expect(html).toContain("<code>const</code>");
    });

    test("parses lists", () => {
      const markdown = "- item 1\n- item 2";
      const html = parser.parse(markdown);
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>");
      expect(html).toContain("</ul>");
    });

    test("parses ordered lists", () => {
      const markdown = "1. first\n2. second";
      const html = parser.parse(markdown);
      expect(html).toContain("<ol>");
      expect(html).toContain("</ol>");
    });

    test("parses blockquotes", () => {
      const markdown = "> This is a quote";
      const html = parser.parse(markdown);
      expect(html).toContain("<blockquote>");
      expect(html).toContain("</blockquote>");
    });

    test("parses horizontal rules", () => {
      const markdown = "---";
      const html = parser.parse(markdown);
      expect(html).toContain("<hr");
    });

    test("parses strikethrough", () => {
      const markdown = "~~deleted~~";
      const html = parser.parse(markdown);
      expect(html).toContain("<del>deleted</del>");
    });
  });

  describe("AST Generation", () => {
    test("generates AST from markdown", () => {
      const markdown = "# Title\nParagraph";
      const ast = parser.parseToAST(markdown);
      expect(ast).toBeDefined();
      expect(ast.type).toBe("root");
      expect(ast.children).toBeDefined();
    });

    test("AST has correct structure", () => {
      const markdown = "# Title";
      const ast = parser.parseToAST(markdown);
      expect(ast.children.length).toBeGreaterThan(0);
      expect(ast.children[0].type).toBe("heading");
    });
  });

  describe("Validation", () => {
    test("validates correct markdown", () => {
      const markdown = "# Title\nParagraph";
      const result = parser.validate(markdown);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test("rejects non-string input", () => {
      const result = parser.validate(123);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("Statistics", () => {
    test("calculates statistics", () => {
      const markdown = "# Title\nParagraph\n[link](url)";
      const stats = parser.getStatistics(markdown);
      expect(stats.lines).toBeGreaterThan(0);
      expect(stats.characters).toBeGreaterThan(0);
      expect(stats.links).toBe(1);
    });

    test("counts headings", () => {
      const markdown = "# Title\n## Subtitle";
      const stats = parser.getStatistics(markdown);
      expect(stats.headings).toBe(2);
    });

    test("counts lists", () => {
      const markdown = "- item\n\n1. first";
      const stats = parser.getStatistics(markdown);
      expect(stats.lists).toBeGreaterThan(0);
    });
  });

  describe("Options", () => {
    test("sets options correctly", () => {
      parser.setOptions({ gfm: false });
      const options = parser.getOptions();
      expect(options.gfm).toBe(false);
    });

    test("uses custom options", () => {
      const customParser = new MarkdownParser({ breaks: true });
      expect(customParser.options.breaks).toBe(true);
    });
  });

  describe("Error Handling", () => {
    test("throws on non-string input to parse", () => {
      expect(() => parser.parse(123)).toThrow();
    });

    test("throws on non-string input to parseToAST", () => {
      expect(() => parser.parseToAST(null)).toThrow();
    });

    test("handles null input gracefully", () => {
      expect(() => parser.getStatistics(undefined)).toThrow();
    });
  });

  describe("Complex Documents", () => {
    test("parses mixed content", () => {
      const markdown = `# Title

Paragraph with *emphasis* and **strong**.

\`\`\`js
const x = 1;
\`\`\`

- List item
- Another item
`;
      const html = parser.parse(markdown);
      expect(html).toContain("<h1");
      expect(html).toContain("<em");
      expect(html).toContain("<code");
      expect(html).toContain("<ul");
    });

    test("parses deeply nested structures", () => {
      const markdown = "> Quote with *emphasis* and [link](url)";
      const html = parser.parse(markdown);
      expect(html).toContain("<blockquote");
      expect(html).toContain("<em");
      expect(html).toContain("<a");
    });
  });
});
