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
      expect(html).toMatch(/<h1[^>]*>Heading 1<\/h1>/);
      expect(html).toMatch(/<h2[^>]*>Heading 2<\/h2>/);
      expect((html.match(/Heading 1/g) || []).length).toBe(1);
      expect((html.match(/Heading 2/g) || []).length).toBe(1);
    });

    test("parses paragraphs", () => {
      const markdown = "This is a paragraph.\n\nThis is another paragraph.";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<p[^>]*>This is a paragraph\.<\/p>/);
      expect(html).toMatch(/<p[^>]*>This is another paragraph\.<\/p>/);
      expect((html.match(/This is a paragraph\./g) || []).length).toBe(1);
      expect((html.match(/This is another paragraph\./g) || []).length).toBe(1);
    });

    test("parses emphasis", () => {
      const markdown = "*italic* and **bold**";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<em[^>]*>italic<\/em>/);
      expect(html).toMatch(/<strong[^>]*>bold<\/strong>/);
      expect((html.match(/italic/g) || []).length).toBe(1);
      expect((html.match(/bold/g) || []).length).toBe(1);
    });

    test("parses links", () => {
      const markdown = "[Link](https://example.com)";
      const html = parser.parse(markdown);
      expect(html).toMatch(
        /<a[^>]*href=["']https:\/\/example\.com["'][^>]*>Link<\/a>/
      );
      expect((html.match(/Link/g) || []).length).toBe(1);
    });

    test("parses images", () => {
      const markdown = "![alt](image.jpg)";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<img[^>]*src=["']image\.jpg["']/);
      expect(html).toMatch(/<img[^>]*alt=["']alt["']/);
      expect((html.match(/image\.jpg/g) || []).length).toBe(1);
    });

    test("parses code blocks", () => {
      const markdown = "```javascript\nconst x = 1;\n```";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<pre[^>]*>/);
      expect(html).toMatch(/<code[^>]*>/);
      expect(html).toMatch(/const x = 1/);
      expect((html.match(/const x = 1/g) || []).length).toBe(1);
    });

    test("parses inline code", () => {
      const markdown = "Use `const` keyword";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<code[^>]*>const<\/code>/);
      expect((html.match(/const/g) || []).length).toBe(1);
    });

    test("parses lists", () => {
      const markdown = "- item 1\n- item 2";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<ul[^>]*>/);
      expect(html).toMatch(/<li[^>]*>item 1<\/li>/);
      expect(html).toMatch(/<li[^>]*>item 2<\/li>/);
      expect(html).toMatch(/<\/ul>/);
      expect((html.match(/item 1/g) || []).length).toBe(1);
      expect((html.match(/item 2/g) || []).length).toBe(1);
    });

    test("parses ordered lists", () => {
      const markdown = "1. first\n2. second";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<ol[^>]*>/);
      expect(html).toMatch(/<li[^>]*>first<\/li>/);
      expect(html).toMatch(/<li[^>]*>second<\/li>/);
      expect(html).toMatch(/<\/ol>/);
      expect((html.match(/first/g) || []).length).toBe(1);
      expect((html.match(/second/g) || []).length).toBe(1);
    });

    test("parses blockquotes", () => {
      const markdown = "> This is a quote";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<blockquote[^>]*>/);
      expect(html).toMatch(/This is a quote/);
      expect(html).toMatch(/<\/blockquote>/);
      expect((html.match(/This is a quote/g) || []).length).toBe(1);
    });

    test("parses horizontal rules", () => {
      const markdown = "---";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<hr[^>]*\s*\/?\s*>/);
    });

    test("parses strikethrough", () => {
      const markdown = "~~deleted~~";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<del[^>]*>deleted<\/del>/);
      expect((html.match(/deleted/g) || []).length).toBe(1);
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
      expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
      expect(html).toMatch(/<em[^>]*>emphasis<\/em>/);
      expect(html).toMatch(/<strong[^>]*>strong<\/strong>/);
      expect(html).toMatch(/<code[^>]*>/);
      expect(html).toMatch(/<ul[^>]*>/);
    });

    test("parses deeply nested structures", () => {
      const markdown = "> Quote with *emphasis* and [link](url)";
      const html = parser.parse(markdown);
      expect(html).toMatch(/<blockquote[^>]*>/);
      expect(html).toMatch(/<em[^>]*>emphasis<\/em>/);
      expect(html).toMatch(/<a[^>]*href=["']url["'][^>]*>link<\/a>/);
    });
  });
});
