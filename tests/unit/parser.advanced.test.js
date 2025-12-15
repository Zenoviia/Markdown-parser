const MarkdownParser = require("../../src/core/parser");

describe("MarkdownParser - Advanced Features", () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  describe("Caching Mechanism", () => {
    test("should cache parse results", () => {
      const markdown = "# Test\n\nContent";
      const result1 = parser.parseWithCache(markdown, true);
      const result2 = parser.parseWithCache(markdown, true);

      expect(result1).toEqual(result2);
    });

    test("should respect cache enabled/disabled", () => {
      const markdown = "# Test";
      const cached = parser.parseWithCache(markdown, true);
      const notCached = parser.parseWithCache(markdown, false);

      expect(cached).toBeDefined();
      expect(notCached).toBeDefined();
    });

    test("should clear cache", () => {
      const markdown = "# Test";
      parser.parseWithCache(markdown, true);
      parser.clearCache();

      expect(parser.cache.size).toBe(0);
    });

    test("should retrieve cache entries correctly", () => {
      const key = "test-key";
      const value = { test: true };

      parser.setCacheEntry(key, value);
      const retrieved = parser.getCacheEntry(key);

      expect(retrieved).toEqual(value);
    });

    test("should return null for non-existent cache entries", () => {
      const result = parser.getCacheEntry("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("Hook System", () => {
    test("should register and emit beforeParse hook", (done) => {
      parser.on("beforeParse", (data) => {
        expect(data.markdown).toBeDefined();
        done();
      });

      parser.parseWithCache("# Test", true);
    });

    test("should register and emit afterParse hook", (done) => {
      parser.on("afterParse", (data) => {
        expect(data.markdown).toBeDefined();
        expect(data.result).toBeDefined();
        done();
      });

      parser.parseWithCache("# Test", true);
    });

    test("should handle multiple hooks on same event", (done) => {
      let callCount = 0;

      parser.on("beforeParse", () => callCount++);
      parser.on("beforeParse", () => callCount++);

      parser.parseWithCache("# Test", true);

      setTimeout(() => {
        expect(callCount).toBe(2);
        done();
      }, 100);
    });

    test("should handle hook errors gracefully", () => {
      parser.on("beforeParse", () => {
        throw new Error("Hook error");
      });

      expect(() => parser.parseWithCache("# Test")).not.toThrow();
    });
  });

  describe("Text Search and Replace", () => {
    test("should search for pattern in markdown", () => {
      const markdown = "Hello world\nHello universe";
      const results = parser.search(markdown, "Hello");

      expect(results.length).toBe(2);
      expect(results[0].text).toBe("Hello");
      expect(results[0].index).toBe(0);
    });

    test("should search with regex pattern", () => {
      const markdown = "Test123\nTest456";
      const results = parser.search(markdown, "Test\\d+");

      expect(results.length).toBe(2);
    });

    test("should calculate correct line numbers in search", () => {
      const markdown = "line1\nline2\nline3";
      const results = parser.search(markdown, "line2");

      expect(results[0].line).toBe(2);
    });

    test("should replace text in markdown", () => {
      const markdown = "Hello world";
      const result = parser.replace(markdown, "Hello", "Hi");

      expect(result).toBe("Hi world");
    });

    test("should replace with regex", () => {
      const markdown = "test123 and test456";
      const result = parser.replace(markdown, /test\d+/g, "TEST");

      expect(result).toContain("TEST");
    });
  });

  describe("Line Analysis", () => {
    test("should analyze lines with metadata", () => {
      const markdown = "# Heading\n\nParagraph\n- List item";
      const lines = parser.analyzeLines(markdown);

      expect(lines.length).toBe(4);
      expect(lines[0].isHeading).toBe(true);
      expect(lines[1].isEmpty).toBe(true);
      expect(lines[3].isList).toBe(true);
    });

    test("should detect code fences", () => {
      const markdown = "```javascript\ncode\n```";
      const lines = parser.analyzeLines(markdown);

      expect(lines[0].isCodeFence).toBe(true);
      expect(lines[2].isCodeFence).toBe(true);
    });

    test("should detect blockquotes", () => {
      const markdown = "> Quote line";
      const lines = parser.analyzeLines(markdown);

      expect(lines[0].isBlockquote).toBe(true);
    });

    test("should detect horizontal rules", () => {
      const markdown = "---";
      const lines = parser.analyzeLines(markdown);

      expect(lines[0].isHorizontalRule).toBe(true);
    });

    test("should provide line statistics", () => {
      const markdown = "Line 1\nLine 2\n\nLine 3";
      const stats = parser.getLineStatistics(markdown);

      expect(stats.totalLines).toBe(4);
      expect(stats.emptyLines).toBe(1);
      expect(stats.averageLineLength).toBeGreaterThan(0);
    });
  });

  describe("Document Formatting", () => {
    test("should remove trailing whitespace", () => {
      const markdown = "Line 1  \nLine 2\t";
      const formatted = parser.format(markdown, {
        removeTrailingWhitespace: true,
      });

      expect(formatted).not.toContain("  \n");
    });

    test("should ensure final newline", () => {
      const markdown = "Content";
      const formatted = parser.format(markdown, { ensureFinalNewline: true });

      expect(formatted.endsWith("\n")).toBe(true);
    });

    test("should format with custom options", () => {
      const markdown = "Line 1  ";
      const formatted = parser.format(markdown, {
        removeTrailingWhitespace: true,
        ensureFinalNewline: false,
      });

      expect(formatted).not.toContain("  ");
    });
  });

  describe("Document Comparison", () => {
    test("should identify identical documents as same", () => {
      const doc = "Line 1\nLine 2";
      const result = parser.compare(doc, doc);

      expect(result.isSame).toBe(true);
      expect(result.differenceCount).toBe(0);
    });

    test("should identify differences between documents", () => {
      const doc1 = "Line 1\nLine 2";
      const doc2 = "Line 1\nLine 2 Modified";
      const result = parser.compare(doc1, doc2);

      expect(result.isSame).toBe(false);
      expect(result.differenceCount).toBeGreaterThan(0);
    });

    test("should provide detailed difference information", () => {
      const doc1 = "Line 1";
      const doc2 = "Line 1\nLine 2";
      const result = parser.compare(doc1, doc2);

      expect(result.differences.length).toBeGreaterThan(0);
      expect(result.differences[0].line).toBeDefined();
    });
  });

  describe("Duplicate Detection", () => {
    test("should find duplicate lines", () => {
      const markdown = "Line 1\nLine 2\nLine 1";
      const duplicates = parser.findDuplicates(markdown);

      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates.some((d) => d.text === "Line 1")).toBe(true);
    });

    test("should list all occurrences of duplicates", () => {
      const markdown = "Test\nOther\nTest\nMore\nTest";
      const duplicates = parser.findDuplicates(markdown);
      const testDuplicate = duplicates.find((d) => d.text === "Test");

      expect(testDuplicate.occurrences.length).toBe(3);
    });

    test("should ignore empty lines", () => {
      const markdown = "\nLine\n\nLine";
      const duplicates = parser.findDuplicates(markdown);

      const emptyDuplicate = duplicates.find((d) => d.text === "");
      expect(emptyDuplicate).toBeUndefined();
    });
  });

  describe("Line Manipulation", () => {
    test("should sort lines", () => {
      const markdown = "Zebra\nApple\nBanana";
      const sorted = parser.sortLines(markdown);

      expect(sorted).toBe("Apple\nBanana\nZebra");
    });

    test("should filter lines", () => {
      const markdown = "include this\nexclude that\ninclude this too";
      const filtered = parser.filterLines(markdown, (line) =>
        line.includes("include")
      );

      expect(filtered.split("\n").length).toBe(2);
    });

    test("should map lines", () => {
      const markdown = "line1\nline2";
      const mapped = parser.mapLines(markdown, (line) => line.toUpperCase());

      expect(mapped).toBe("LINE1\nLINE2");
    });
  });

  describe("Format Validation", () => {
    test("should detect unmatched brackets", () => {
      const markdown = "[unclosed bracket";
      const issues = parser.validateFormatting(markdown);

      expect(issues.some((i) => i.type === "unmatched_bracket")).toBe(true);
    });

    test("should detect unbalanced parentheses", () => {
      const markdown = "text ( with ) unbalanced (";
      const issues = parser.validateFormatting(markdown);

      expect(
        issues.some((i) => i.type === "unmatched_parenthesis_balance")
      ).toBe(true);
    });

    test("should detect unmatched backticks", () => {
      const markdown = "code `with odd backticks";
      const issues = parser.validateFormatting(markdown);

      expect(issues.some((i) => i.type === "unmatched_backticks")).toBe(true);
    });

    test("should ignore formatting checks inside code blocks", () => {
      const markdown = "```\n[ unmatched [\n```";
      const issues = parser.validateFormatting(markdown);

      expect(issues.length).toBe(0);
    });

    test("should detect unclosed code block", () => {
      const markdown = "```\ncode without closing fence";
      const issues = parser.validateFormatting(markdown);

      expect(issues.some((i) => i.type === "unclosed_code_block")).toBe(true);
    });

    test("should detect malformed links", () => {
      const markdown = "]( no opening bracket";
      const issues = parser.validateFormatting(markdown);

      expect(issues.some((i) => i.type === "malformed_link")).toBe(true);
    });
  });

  describe("Word Analysis", () => {
    test("should find most common words", () => {
      const markdown = "test test test word word other";
      const words = parser.getMostCommonWords(markdown, 5);

      expect(words[0].word).toBe("test");
      expect(words[0].count).toBe(3);
    });

    test("should ignore short words", () => {
      const markdown = "a b c longer word";
      const words = parser.getMostCommonWords(markdown, 10);

      expect(words.every((w) => w.word.length > 2)).toBe(true);
    });

    test("should respect limit parameter", () => {
      const markdown = "word1 word2 word3 word4 word5";
      const words = parser.getMostCommonWords(markdown, 2);

      expect(words.length).toBeLessThanOrEqual(2);
    });

    test("should return vocabulary", () => {
      const markdown = "apple banana apple cherry";
      const vocab = parser.getVocabulary(markdown);

      expect(vocab.includes("apple")).toBe(true);
      expect(vocab.includes("banana")).toBe(true);
      expect(vocab).toEqual([...vocab].sort());
    });
  });
});
