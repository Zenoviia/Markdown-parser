/**
 * Tokenizer Tests
 * Тести для токенізатора
 */

const Tokenizer = require("../../src/core/tokenizer");

describe("Tokenizer", () => {
  let tokenizer;

  beforeEach(() => {
    tokenizer = new Tokenizer({ strikethrough: true });
  });

  describe("Block Tokens", () => {
    test("tokenizes headings", () => {
      const markdown = "# Title\n## Subtitle";
      const tokens = tokenizer.tokenize(markdown);
      const headings = tokens.filter((t) => t.type === "heading");
      expect(headings.length).toBe(2);
      expect(headings[0].level).toBe(1);
      expect(headings[1].level).toBe(2);
    });

    describe("All Heading Levels (H1-H6)", () => {
      test("tokenizes H1 heading", () => {
        const markdown = "# H1 Heading";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(1);
        expect(headings[0].level).toBe(1);
        expect(headings[0].text).toBe("H1 Heading");
      });

      test("tokenizes H2 heading", () => {
        const markdown = "## H2 Heading";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(1);
        expect(headings[0].level).toBe(2);
        expect(headings[0].text).toBe("H2 Heading");
      });

      test("tokenizes H3 heading", () => {
        const markdown = "### H3 Heading";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(1);
        expect(headings[0].level).toBe(3);
        expect(headings[0].text).toBe("H3 Heading");
      });

      test("tokenizes H4 heading", () => {
        const markdown = "#### H4 Heading";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(1);
        expect(headings[0].level).toBe(4);
        expect(headings[0].text).toBe("H4 Heading");
      });

      test("tokenizes H5 heading", () => {
        const markdown = "##### H5 Heading";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(1);
        expect(headings[0].level).toBe(5);
        expect(headings[0].text).toBe("H5 Heading");
      });

      test("tokenizes H6 heading", () => {
        const markdown = "###### H6 Heading";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(1);
        expect(headings[0].level).toBe(6);
        expect(headings[0].text).toBe("H6 Heading");
      });

      test("does not tokenize H7 as heading", () => {
        const markdown = "####### H7 (not a heading)";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(0);
      });

      test("tokenizes all heading levels together", () => {
        const markdown = "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(6);
        expect(headings[0].level).toBe(1);
        expect(headings[1].level).toBe(2);
        expect(headings[2].level).toBe(3);
        expect(headings[3].level).toBe(4);
        expect(headings[4].level).toBe(5);
        expect(headings[5].level).toBe(6);
      });

      test("heading with trailing hashes", () => {
        const markdown = "# H1 Heading #";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(1);
        expect(headings[0].level).toBe(1);
        expect(headings[0].text).toBe("H1 Heading");
      });

      test("heading with multiple trailing hashes", () => {
        const markdown = "### H3 Heading ###";
        const tokens = tokenizer.tokenize(markdown);
        const headings = tokens.filter((t) => t.type === "heading");
        expect(headings.length).toBe(1);
        expect(headings[0].level).toBe(3);
        expect(headings[0].text).toBe("H3 Heading");
      });
    });

    test("tokenizes paragraphs", () => {
      const markdown = "First paragraph.\n\nSecond paragraph.";
      const tokens = tokenizer.tokenize(markdown);
      const paragraphs = tokens.filter((t) => t.type === "paragraph");
      expect(paragraphs.length).toBeGreaterThan(0);
    });

    test("tokenizes lists", () => {
      const markdown = "- item 1\n- item 2";
      const tokens = tokenizer.tokenize(markdown);
      const lists = tokens.filter((t) => t.type === "list");
      expect(lists.length).toBeGreaterThan(0);
    });

    test("tokenizes ordered lists", () => {
      const markdown = "1. first\n2. second";
      const tokens = tokenizer.tokenize(markdown);
      const lists = tokens.filter((t) => t.type === "orderedList");
      expect(lists.length).toBeGreaterThan(0);
    });

    test("tokenizes code blocks", () => {
      const markdown = "```js\nconst x = 1;\n```";
      const tokens = tokenizer.tokenize(markdown);
      const codeBlocks = tokens.filter((t) => t.type === "codeBlock");
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    test("tokenizes blockquotes", () => {
      const markdown = "> Quote line";
      const tokens = tokenizer.tokenize(markdown);
      const quotes = tokens.filter((t) => t.type === "blockquote");
      expect(quotes.length).toBeGreaterThan(0);
    });

    test("tokenizes horizontal rules", () => {
      const markdown = "---";
      const tokens = tokenizer.tokenize(markdown);
      const hrs = tokens.filter((t) => t.type === "hr");
      expect(hrs.length).toBeGreaterThan(0);
    });

    test("tokenizes tables", () => {
      const markdown = "| a | b |\n|---|---|\n| 1 | 2 |";
      const tokens = tokenizer.tokenize(markdown);
      const tables = tokens.filter((t) => t.type === "table");
      expect(tables.length).toBeGreaterThan(0);
    });

    test("tokenizes blank lines", () => {
      const markdown = "text\n\nmore text";
      const tokens = tokenizer.tokenize(markdown);
      const blanks = tokens.filter((t) => t.type === "blank");
      expect(blanks.length).toBeGreaterThan(0);
    });
  });

  describe("Inline Tokens", () => {
    test("tokenizes inline code", () => {
      const text = "Use `code` here";
      const tokens = tokenizer.tokenizeInline(text);
      const codes = tokens.filter((t) => t.type === "inlineCode");
      expect(codes.length).toBeGreaterThan(0);
    });

    test("tokenizes links", () => {
      const text = "[link](https://example.com)";
      const tokens = tokenizer.tokenizeInline(text);
      const links = tokens.filter((t) => t.type === "link");
      expect(links.length).toBeGreaterThan(0);
    });

    test("tokenizes images", () => {
      const text = "![alt](image.jpg)";
      const tokens = tokenizer.tokenizeInline(text);
      const images = tokens.filter((t) => t.type === "image");
      expect(images.length).toBeGreaterThan(0);
    });

    test("tokenizes strong", () => {
      const text = "**bold**";
      const tokens = tokenizer.tokenizeInline(text);
      const strong = tokens.filter((t) => t.type === "strong");
      expect(strong.length).toBeGreaterThan(0);
    });

    test("tokenizes emphasis", () => {
      const text = "*italic*";
      const tokens = tokenizer.tokenizeInline(text);
      const em = tokens.filter((t) => t.type === "em");
      expect(em.length).toBeGreaterThan(0);
    });

    test("tokenizes strikethrough", () => {
      const text = "~~deleted~~";
      const tokens = tokenizer.tokenizeInline(text);
      const del = tokens.filter((t) => t.type === "del");
      expect(del.length).toBeGreaterThan(0);
    });

    test("tokenizes plain text", () => {
      const text = "plain text";
      const tokens = tokenizer.tokenizeInline(text);
      const texts = tokens.filter((t) => t.type === "text");
      expect(texts.length).toBeGreaterThan(0);
    });
  });

  describe("Complex Tokenization", () => {
    test("tokenizes mixed content", () => {
      const markdown = `# Title

Paragraph with *emphasis*.

\`\`\`js
code
\`\`\`

- list`;
      const tokens = tokenizer.tokenize(markdown);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens.some((t) => t.type === "heading")).toBe(true);
      expect(tokens.some((t) => t.type === "paragraph")).toBe(true);
      expect(tokens.some((t) => t.type === "codeBlock")).toBe(true);
    });

    test("preserves token raw content", () => {
      const markdown = "# Title";
      const tokens = tokenizer.tokenize(markdown);
      expect(tokens[0].raw).toBeDefined();
    });

    test("includes line numbers", () => {
      const markdown = "line1\nline2";
      const tokens = tokenizer.tokenize(markdown);
      tokens.forEach((token) => {
        expect(typeof token.line).toBe("number");
      });
    });
  });

  describe("Edge Cases", () => {
    test("handles empty strings", () => {
      const tokens = tokenizer.tokenize("");
      expect(tokens).toBeDefined();
    });

    test("handles whitespace only", () => {
      const tokens = tokenizer.tokenize("   \n   ");
      expect(tokens).toBeDefined();
    });

    test("handles single character", () => {
      const tokens = tokenizer.tokenize("a");
      expect(tokens.length).toBeGreaterThan(0);
    });

    test("handles nested formatting", () => {
      const text = "***bold and italic***";
      const tokens = tokenizer.tokenizeInline(text);
      expect(tokens.length).toBeGreaterThan(0);
    });

    test("handles escaped characters", () => {
      const text = "\\*not italic\\*";
      const tokens = tokenizer.tokenizeInline(text);
      expect(tokens).toBeDefined();
    });
  });
});
