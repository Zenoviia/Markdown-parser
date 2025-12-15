const MarkdownParser = require("../../src/core/parser");

describe("MarkdownParser", () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe("AST Generation - Basic Structures", () => {
    test("generates AST for headings", () => {
      const markdown = "# Heading 1\n## Heading 2";
      const ast = parser.parseToAST(markdown);
      expect(ast).toBeDefined();
      expect(ast.type).toBe("root");
      expect(ast.children.length).toBeGreaterThanOrEqual(2);
      const heading1 = ast.children.find(
        (n) => n.type === "heading" && n.level === 1
      );
      const heading2 = ast.children.find(
        (n) => n.type === "heading" && n.level === 2
      );
      expect(heading1).toBeDefined();
      expect(heading2).toBeDefined();
      expect(heading1.level).toBe(1);
      expect(heading2.level).toBe(2);
    });

    test("generates AST for paragraphs", () => {
      const markdown = "This is a paragraph.\n\nThis is another paragraph.";
      const ast = parser.parseToAST(markdown);
      const paragraphs = ast.children.filter((n) => n.type === "paragraph");
      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].children).toBeDefined();
      expect(paragraphs[1].children).toBeDefined();
    });

    test("generates AST for emphasis (italic and bold)", () => {
      const markdown = "*italic* and **bold**";
      const ast = parser.parseToAST(markdown);
      const paragraph = ast.children.find((n) => n.type === "paragraph");
      expect(paragraph).toBeDefined();
      expect(paragraph.children.length).toBeGreaterThan(0);
      const hasEm = paragraph.children.some((n) => n.type === "em");
      const hasStrong = paragraph.children.some((n) => n.type === "strong");
      expect(hasEm).toBe(true);
      expect(hasStrong).toBe(true);
    });

    test("generates AST for links", () => {
      const markdown = "[Link](https://example.com)";
      const ast = parser.parseToAST(markdown);
      const paragraph = ast.children.find((n) => n.type === "paragraph");
      expect(paragraph).toBeDefined();
      const link = paragraph.children.find((n) => n.type === "link");
      expect(link).toBeDefined();
      expect(link.href).toBe("https://example.com");
    });

    test("generates AST for images", () => {
      const markdown = "![alt](image.jpg)";
      const ast = parser.parseToAST(markdown);
      const paragraph = ast.children.find((n) => n.type === "paragraph");
      expect(paragraph).toBeDefined();
      const image = paragraph.children.find((n) => n.type === "image");
      expect(image).toBeDefined();
      expect(image.src).toBe("image.jpg");
      expect(image.alt).toBe("alt");
    });

    test("generates AST for code blocks", () => {
      const markdown = "```javascript\nconst x = 1;\n```";
      const ast = parser.parseToAST(markdown);
      const codeBlock = ast.children.find((n) => n.type === "codeBlock");
      expect(codeBlock).toBeDefined();
      expect(codeBlock.language).toBe("javascript");
      expect(codeBlock.code).toContain("const x = 1");
    });

    test("generates AST for inline code", () => {
      const markdown = "Use `const` keyword";
      const ast = parser.parseToAST(markdown);
      const paragraph = ast.children.find((n) => n.type === "paragraph");
      expect(paragraph).toBeDefined();
      const inlineCode = paragraph.children.find(
        (n) => n.type === "inlineCode"
      );
      expect(inlineCode).toBeDefined();
      expect(inlineCode.code).toBe("const");
    });

    test("generates AST for unordered lists", () => {
      const markdown = "- item 1\n- item 2";
      const ast = parser.parseToAST(markdown);
      const list = ast.children.find((n) => n.type === "list");
      expect(list).toBeDefined();
      expect(list.items).toBeDefined();
      expect(list.items.length).toBe(2);
      expect(list.items.every((item) => item.type === "listItem")).toBe(true);
    });

    test("generates AST for ordered lists", () => {
      const markdown = "1. first\n2. second";
      const ast = parser.parseToAST(markdown);
      const list = ast.children.find(
        (n) => n.type === "orderedList" || (n.type === "list" && n.ordered)
      );
      expect(list).toBeDefined();
      expect(list.items).toBeDefined();
      expect(list.items.length).toBe(2);
    });

    test("generates AST for blockquotes", () => {
      const markdown = "> This is a quote";
      const ast = parser.parseToAST(markdown);
      const blockquote = ast.children.find((n) => n.type === "blockquote");
      expect(blockquote).toBeDefined();
      expect(blockquote.children).toBeDefined();
    });

    test("generates AST for horizontal rules", () => {
      const markdown = "---";
      const ast = parser.parseToAST(markdown);
      const hr = ast.children.find((n) => n.type === "hr");
      expect(hr).toBeDefined();
    });

    test("generates AST for strikethrough", () => {
      const markdown = "~~deleted~~";
      const ast = parser.parseToAST(markdown);
      const paragraph = ast.children.find((n) => n.type === "paragraph");
      expect(paragraph).toBeDefined();
      const del = paragraph.children.find((n) => n.type === "del");
      expect(del).toBeDefined();
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

  describe("Complex Documents - AST Structures", () => {
    test("generates AST for mixed content", () => {
      const markdown = `# Title

Paragraph with *emphasis* and **strong**.

\`\`\`js
const x = 1;
\`\`\`

- List item
- Another item
`;
      const ast = parser.parseToAST(markdown);
      expect(ast.type).toBe("root");
      expect(ast.children.length).toBeGreaterThan(0);

      const heading = ast.children.find(
        (n) => n.type === "heading" && n.level === 1
      );
      expect(heading).toBeDefined();

      const paragraph = ast.children.find((n) => n.type === "paragraph");
      expect(paragraph).toBeDefined();

      const codeBlock = ast.children.find((n) => n.type === "codeBlock");
      expect(codeBlock).toBeDefined();
      expect(codeBlock.language).toBe("js");

      const list = ast.children.find((n) => n.type === "list");
      expect(list).toBeDefined();
      expect(list.items).toBeDefined();
      expect(list.items.length).toBe(2);
    });

    test("generates AST for deeply nested structures", () => {
      const markdown = "> Quote with *emphasis* and [link](url)";
      const ast = parser.parseToAST(markdown);

      const blockquote = ast.children.find((n) => n.type === "blockquote");
      expect(blockquote).toBeDefined();
      expect(blockquote.children).toBeDefined();
      expect(blockquote.children.length).toBeGreaterThan(0);

      const paragraph = blockquote.children.find((n) => n.type === "paragraph");
      expect(paragraph).toBeDefined();
      expect(paragraph.children).toBeDefined();
    });
  });
});
