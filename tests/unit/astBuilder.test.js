/**
 * AST Builder Tests
 * Тести для побудови AST
 */

const ASTBuilder = require("../../src/core/astBuilder");
const Tokenizer = require("../../src/core/tokenizer");

describe("ASTBuilder", () => {
  let builder;
  let tokenizer;

  beforeEach(() => {
    builder = new ASTBuilder();
    tokenizer = new Tokenizer();
  });

  describe("Build AST", () => {
    test("builds root node", () => {
      const tokens = tokenizer.tokenize("# Title");
      const ast = builder.build(tokens);
      expect(ast.type).toBe("root");
      expect(ast.children).toBeDefined();
    });

    test("builds heading nodes", () => {
      const tokens = tokenizer.tokenize("# Title\n## Subtitle");
      const ast = builder.build(tokens);
      const headings = ast.children.filter((n) => n.type === "heading");
      expect(headings.length).toBe(2);
      expect(headings[0].level).toBe(1);
    });

    test("builds paragraph nodes", () => {
      const tokens = tokenizer.tokenize("Text");
      const ast = builder.build(tokens);
      expect(ast.children.some((n) => n.type === "paragraph")).toBe(true);
    });

    test("includes metadata", () => {
      const tokens = tokenizer.tokenize("# Title");
      const ast = builder.build(tokens);
      expect(ast.metadata).toBeDefined();
      expect(ast.metadata.generated).toBeDefined();
      expect(ast.metadata.nodeCount).toBeGreaterThan(0);
    });
  });

  describe("Heading IDs", () => {
    test("generates heading IDs", () => {
      const tokens = tokenizer.tokenize("# My Title");
      const ast = builder.build(tokens);
      const heading = ast.children.find((n) => n.type === "heading");
      expect(heading.id).toBeDefined();
      expect(heading.id).toContain("my");
    });

    test("normalizes heading IDs", () => {
      const tokens = tokenizer.tokenize("# Title With Special!@# Chars");
      const ast = builder.build(tokens);
      const heading = ast.children.find((n) => n.type === "heading");
      expect(heading.id).not.toContain("!");
      expect(heading.id).not.toContain("@");
    });
  });

  describe("Validation", () => {
    test("validates AST structure", () => {
      const tokens = tokenizer.tokenize("# Title");
      const ast = builder.build(tokens);
      expect(builder.validate(ast)).toBe(true);
    });

    test("rejects invalid AST", () => {
      expect(builder.validate(null)).toBe(false);
      expect(builder.validate({})).toBe(false);
    });
  });

  describe("Extract Operations", () => {
    test("extracts links", () => {
      const tokens = tokenizer.tokenize("[Link](https://example.com)");
      const ast = builder.build(tokens);
      const links = builder.extractLinks(ast);
      expect(links.length).toBeGreaterThan(0);
    });

    test("extracts images", () => {
      const tokens = tokenizer.tokenize("![alt](image.jpg)");
      const ast = builder.build(tokens);
      const images = builder.extractImages(ast);
      expect(images.length).toBeGreaterThan(0);
    });

    test("extracts headings", () => {
      const tokens = tokenizer.tokenize("# Title\n## Subtitle");
      const ast = builder.build(tokens);
      const headings = builder.extractHeadings(ast);
      expect(headings.length).toBe(2);
    });
  });

  describe("Filter Operations", () => {
    test("filters by type", () => {
      const tokens = tokenizer.tokenize("# Title\n## Subtitle\nText");
      const ast = builder.build(tokens);
      const headings = builder.filterByType(ast, "heading");
      expect(headings.length).toBe(2);
      expect(headings.every((h) => h.type === "heading")).toBe(true);
    });

    test("returns empty array when no matches", () => {
      const tokens = tokenizer.tokenize("Text only");
      const ast = builder.build(tokens);
      const tables = builder.filterByType(ast, "table");
      expect(tables.length).toBe(0);
    });
  });

  describe("Table of Contents", () => {
    test("generates TOC", () => {
      const tokens = tokenizer.tokenize("# Title\n## Section\n### Subsection");
      const ast = builder.build(tokens);
      const toc = builder.generateTableOfContents(ast);
      expect(toc.length).toBeGreaterThan(0);
    });

    test("TOC has correct hierarchy", () => {
      const tokens = tokenizer.tokenize("# Title\n## Section");
      const ast = builder.build(tokens);
      const toc = builder.generateTableOfContents(ast);
      expect(toc[0].level).toBe(1);
    });
  });

  describe("Transform", () => {
    test("transforms AST", () => {
      const tokens = tokenizer.tokenize("# Title");
      const ast = builder.build(tokens);
      const transformed = builder.transform(ast, (node) => {
        if (node.type === "heading") {
          node.transformed = true;
        }
        return node;
      });
      const heading = transformed.children.find((n) => n.type === "heading");
      expect(heading.transformed).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    test("handles empty markdown", () => {
      const tokens = tokenizer.tokenize("");
      const ast = builder.build(tokens);
      expect(ast.children.length).toBe(0);
    });

    test("handles deeply nested content", () => {
      const markdown = "> Quote with *emphasis* and **strong**";
      const tokens = tokenizer.tokenize(markdown);
      const ast = builder.build(tokens);
      expect(ast.children.length).toBeGreaterThan(0);
    });
  });
});
