const Tokenizer = require("../../src/core/tokenizer");
const Parser = require("../../src/core/parser");

describe("Text Duplication Bug Fix", () => {
  let tokenizer;
  let parser;

  beforeEach(() => {
    tokenizer = new Tokenizer();
    parser = new Parser();
  });

  describe("Unclosed fenced code blocks", () => {
    test("should not duplicate unclosed code block content", () => {
      const markdown = `\`\`\`js
const x = 1;
console.log(x);`;

      const html = parser.parse(markdown);
      const contentCount = (html.match(/const x = 1;/g) || []).length;

      expect(contentCount).toBe(1);
      expect(html).toContain('<code class="language-js">');
    });
  });

  describe("Inline closing fence", () => {
    test("should handle inline closing fence (fence not on new line)", () => {
      const markdown = `\`\`\`
code line 1
code line 2\`\`\`
After code`;

      const tokens = tokenizer.tokenize(markdown);
      const codeBlock = tokens.find((t) => t.type === "codeBlock");

      expect(codeBlock).toBeDefined();
      expect(codeBlock.code).toBe("code line 1\ncode line 2");
      expect(codeBlock.code).not.toContain("After code");
    });

    test("should extract code before closing fence with trailing content", () => {
      const markdown = `\`\`\`
code\`\`\` text after`;

      const tokens = tokenizer.tokenize(markdown);
      const codeBlock = tokens.find((t) => t.type === "codeBlock");

      expect(codeBlock).toBeDefined();
      expect(codeBlock.code).toBe("code");
      expect(codeBlock.code).not.toContain("text after");

      const html = parser.parse(markdown);
      expect(html).not.toContain("<code>code``` text after");
      expect((html.match(/text after/g) || []).length).toBe(0);
    });
  });

  describe("Properly closed fenced code", () => {
    test("should not duplicate properly closed code blocks", () => {
      const markdown = `\`\`\`python
def hello():
    print("world")
\`\`\`
After code`;

      const html = parser.parse(markdown);
      const contentCount = (html.match(/def hello/g) || []).length;

      expect(contentCount).toBe(1);
      expect(html).toContain('class="language-python"');
    });
  });

  describe("Edge cases", () => {
    test("should handle tildes as fence characters", () => {
      const markdown = `~~~
code content
~~~`;

      const tokens = tokenizer.tokenize(markdown);
      const codeBlock = tokens.find((t) => t.type === "codeBlock");

      expect(codeBlock).toBeDefined();
      expect(codeBlock.code).toBe("code content");
    });

    test("should handle multiple fenced code blocks", () => {
      const markdown = `\`\`\`
code1
\`\`\`

\`\`\`
code2
\`\`\``;

      const tokens = tokenizer.tokenize(markdown);
      const codeBlocks = tokens.filter((t) => t.type === "codeBlock");

      expect(codeBlocks.length).toBe(2);
      expect(codeBlocks[0].code).toBe("code1");
      expect(codeBlocks[1].code).toBe("code2");

      const html = parser.parse(markdown);
      expect((html.match(/code1/g) || []).length).toBe(1);
      expect((html.match(/code2/g) || []).length).toBe(1);
    });

    test("should not duplicate content with fence on same line as closing", () => {
      const markdown = `\`\`\`
line 1
line 2\`\`\`
paragraph`;

      const tokens = tokenizer.tokenize(markdown);

      expect(tokens.length).toBe(2);
      expect(tokens[0].type).toBe("codeBlock");
      expect(tokens[1].type).toBe("paragraph");

      const html = parser.parse(markdown);
      expect((html.match(/line 1/g) || []).length).toBe(1);
      expect((html.match(/line 2/g) || []).length).toBe(1);
      expect((html.match(/paragraph/g) || []).length).toBe(1);
    });
  });
});
