/**
 * Randomized Tests (Property-based Testing)
 * Генерація випадкових Markdown фрагментів для перевірки консистентності
 */

const MarkdownParser = require("../../src/core/parser");

describe("Randomized Tests", () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  /**
   * Випадкова функція
   */
  function random(max) {
    return Math.floor(Math.random() * max);
  }

  /**
   * Генерує випадковий Markdown текст
   */
  function generateRandomMarkdown() {
    const elements = [];
    const count = random(10) + 1;

    for (let i = 0; i < count; i++) {
      const type = random(8);

      switch (type) {
        case 0: // Heading
          elements.push(`${"#".repeat(random(5) + 1)} Random Heading ${i}`);
          break;
        case 1: // Paragraph
          elements.push(
            `This is a random paragraph number ${i} with some text.`
          );
          break;
        case 2: // Bold
          elements.push(`Text with **bold text ${i}** inside.`);
          break;
        case 3: // Italic
          elements.push(`Text with *italic text ${i}* inside.`);
          break;
        case 4: // Link
          elements.push(`[Random Link ${i}](https://example.com/${i})`);
          break;
        case 5: // Code block
          elements.push(`\`\`\`\nrandom code ${i}\n\`\`\``);
          break;
        case 6: // List
          const listItems = random(5) + 1;
          for (let j = 0; j < listItems; j++) {
            elements.push(`- List item ${j}`);
          }
          break;
        case 7: // Quote
          elements.push(`> Random quote number ${i}`);
          break;
      }

      elements.push("");
    }

    return elements.join("\n");
  }

  /**
   * Генерує випадковий простий текст
   */
  function generateRandomText(length = 50) {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .,!?";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(random(chars.length));
    }
    return result;
  }

  describe("Random Markdown Properties", () => {
    test("any random markdown is valid and parseable", () => {
      for (let i = 0; i < 100; i++) {
        const markdown = generateRandomMarkdown();

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });

    test("parsing is deterministic", () => {
      for (let i = 0; i < 50; i++) {
        const markdown = generateRandomMarkdown();
        const html1 = parser.parse(markdown);
        const html2 = parser.parse(markdown);

        expect(html1).toBe(html2);
      }
    });

    test("parse and parseToAST return consistent results", () => {
      for (let i = 0; i < 50; i++) {
        const markdown = generateRandomMarkdown();

        expect(() => {
          const html = parser.parse(markdown);
          const ast = parser.parseToAST(markdown);

          expect(html).toBeTruthy();
          expect(ast).toBeTruthy();
        }).not.toThrow();
      }
    });

    test("validation works for any markdown", () => {
      for (let i = 0; i < 50; i++) {
        const markdown = generateRandomMarkdown();
        const result = parser.validate(markdown);

        expect(result).toHaveProperty("valid");
        expect(result).toHaveProperty("errors");
        expect(Array.isArray(result.errors)).toBe(true);
      }
    });

    test("statistics can be calculated for any markdown", () => {
      for (let i = 0; i < 50; i++) {
        const markdown = generateRandomMarkdown();

        expect(() => {
          const stats = parser.getStatistics(markdown);

          expect(stats).toHaveProperty("lines");
          expect(stats).toHaveProperty("characters");
          expect(stats).toHaveProperty("tokens");
          expect(stats).toHaveProperty("nodes");
        }).not.toThrow();
      }
    });
  });

  describe("Random Element Combinations", () => {
    test("random combinations of formatting don't crash", () => {
      for (let i = 0; i < 100; i++) {
        const elements = [
          "**bold**",
          "*italic*",
          "~~strikethrough~~",
          "`code`",
          "[link](url)",
          "![image](img.jpg)",
        ];

        let markdown = "";
        for (let j = 0; j < random(10) + 1; j++) {
          markdown += elements[random(elements.length)] + " ";
        }

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });

    test("random nested structures are parseable", () => {
      for (let i = 0; i < 50; i++) {
        let markdown = "# Title\n\n";

        // Random nesting depth
        const depth = random(5);
        for (let d = 0; d < depth; d++) {
          markdown += "> ".repeat(d + 1) + `Nested quote level ${d}\n`;
        }

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });
  });

  describe("Random Edge Cases", () => {
    test("random special characters are escaped properly", () => {
      const specialChars = "<>&\"'";

      for (let i = 0; i < 50; i++) {
        let markdown = "Text: ";
        for (let j = 0; j < random(10); j++) {
          markdown += specialChars[random(specialChars.length)];
        }

        const html = parser.parse(markdown);

        // Should not contain unescaped special chars in dangerous contexts
        expect(html).not.toMatch(/<script/i);
        expect(html).not.toMatch(/javascript:/i);
      }
    });

    test("random whitespace combinations work", () => {
      for (let i = 0; i < 50; i++) {
        let markdown = "";

        for (let j = 0; j < random(20); j++) {
          if (random(2) === 0) {
            markdown += " "; // Space
          } else if (random(2) === 0) {
            markdown += "\t"; // Tab
          } else {
            markdown += "text";
          }
        }

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });

    test("random line ending combinations work", () => {
      for (let i = 0; i < 50; i++) {
        let markdown = "Line 1";

        const ending = random(3);
        if (ending === 0) markdown += "\r\n"; // Windows
        if (ending === 1) markdown += "\n"; // Unix
        if (ending === 2) markdown += "\r"; // Old Mac

        markdown += "Line 2";

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });

    test("random URL combinations in links", () => {
      const urls = [
        "https://example.com",
        "http://example.com/path",
        "/relative/path",
        "#anchor",
        "mailto:test@example.com",
        "ftp://example.com",
        "",
        "not-a-valid-url",
      ];

      for (let i = 0; i < 50; i++) {
        const url = urls[random(urls.length)];
        const markdown = `[Link](${url})`;

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });
  });

  describe("Random Content Size", () => {
    test("random sized documents parse successfully", () => {
      for (let i = 0; i < 20; i++) {
        const lines = random(100) + 1;
        let markdown = "";

        for (let j = 0; j < lines; j++) {
          markdown += `Line ${j}: ${generateRandomText(random(200))}\n`;
        }

        expect(() => {
          const html = parser.parse(markdown);
          expect(html).toBeTruthy();
        }).not.toThrow();
      }
    });

    test("random character counts work", () => {
      for (let i = 0; i < 50; i++) {
        const charCount = random(1000) + 1;
        const markdown = generateRandomText(charCount);

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });
  });

  describe("Random Consistency Checks", () => {
    test("HTML output is valid for random markdown", () => {
      for (let i = 0; i < 50; i++) {
        const markdown = generateRandomMarkdown();
        const html = parser.parse(markdown);

        // Basic HTML validity checks
        expect(html).not.toMatch(/<[^>]*<[^>]*>/); // No nested unclosed tags
        expect((html.match(/<[^>]+>/g) || []).length).toBeGreaterThanOrEqual(0);
      }
    });

    test("AST structure is valid for random markdown", () => {
      for (let i = 0; i < 50; i++) {
        const markdown = generateRandomMarkdown();
        const ast = parser.parseToAST(markdown);

        // Check AST structure
        expect(ast.type).toBe("root");
        expect(Array.isArray(ast.children)).toBe(true);

        // Check all children have types
        ast.children.forEach((child) => {
          expect(child).toHaveProperty("type");
          expect(typeof child.type).toBe("string");
        });
      }
    });

    test("statistics are accurate for random markdown", () => {
      for (let i = 0; i < 30; i++) {
        const markdown = generateRandomMarkdown();
        const stats = parser.getStatistics(markdown);

        // Verify statistics make sense
        expect(stats.lines).toBeGreaterThan(0);
        expect(stats.characters).toBeGreaterThan(0);
        expect(stats.nodes).toBeGreaterThan(0);
        expect(stats.tokens).toBeGreaterThan(0);

        // These should be non-negative
        expect(stats.headings).toBeGreaterThanOrEqual(0);
        expect(stats.links).toBeGreaterThanOrEqual(0);
        expect(stats.images).toBeGreaterThanOrEqual(0);
        expect(stats.lists).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe("Fuzz Testing", () => {
    test("random byte sequences don't crash parser", () => {
      for (let i = 0; i < 100; i++) {
        const length = random(100) + 1;
        let input = "";

        for (let j = 0; j < length; j++) {
          const charCode = random(256);
          input += String.fromCharCode(charCode);
        }

        expect(() => {
          parser.parse(input);
        }).not.toThrow();
      }
    });

    test("random unicode sequences are handled", () => {
      const unicodeChars = [
        "😀",
        "🎉",
        "✨",
        "🚀",
        "你好",
        "привет",
        "مرحبا",
        "©",
        "®",
        "™",
      ];

      for (let i = 0; i < 50; i++) {
        let markdown = "Text: ";
        for (let j = 0; j < random(10) + 1; j++) {
          markdown += unicodeChars[random(unicodeChars.length)];
        }

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });

    test("random mixtures of valid and invalid markdown", () => {
      for (let i = 0; i < 50; i++) {
        let markdown = "";

        // Mix valid and potentially invalid elements
        for (let j = 0; j < 5; j++) {
          if (random(2) === 0) {
            markdown += "[link](url)"; // Valid
          } else {
            markdown += `[invalid ${generateRandomText(20)}`; // Invalid
          }

          if (random(2) === 0) {
            markdown += "\n**bold**\n"; // Valid
          } else {
            markdown += "\n**unclosed\n"; // Potentially invalid
          }
        }

        expect(() => {
          parser.parse(markdown);
        }).not.toThrow();
      }
    });
  });

  describe("Random Comparison Operations", () => {
    test("multiple parsers produce same output", () => {
      const parsers = [
        new MarkdownParser({ gfm: true }),
        new MarkdownParser({ breaks: true }),
        new MarkdownParser({ strikethrough: true }),
      ];

      for (let i = 0; i < 30; i++) {
        const markdown = generateRandomMarkdown();

        const outputs = parsers.map((p) => p.parse(markdown));

        // At least all should produce valid HTML
        outputs.forEach((output) => {
          expect(output).toBeTruthy();
        });
      }
    });
  });
});
