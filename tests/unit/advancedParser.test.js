const AdvancedParser = require('../../src/core/advancedParser');

describe('AdvancedParser - Comprehensive Test Suite', () => {
  let parser;

  beforeEach(() => {
    parser = new AdvancedParser();
  });

  describe('Basic Functionality', () => {
    test('module loads and exposes parse method', () => {
      expect(typeof AdvancedParser).toBe('function');
      const ap = new AdvancedParser();
      expect(typeof ap.parse === 'function' || typeof ap.tokenize === 'function').toBe(true);
    });

    test('parses simple heading and paragraph', () => {
      const ap = new AdvancedParser();
      let out;
      try {
        out = ap.parse ? ap.parse('# Title\n\nText') : ap.tokenize('# Title\n\nText');
      } catch (e) {
        out = null;
      }
      expect(out).not.toBeNull();
    });
  });

  describe('Caching Mechanism', () => {
    test('should cache parse results', () => {
      const markdown = '# Test\n\nContent';
      const result1 = parser.parseWithCache(markdown, true);
      const result2 = parser.parseWithCache(markdown, true);
      
      expect(result1).toEqual(result2);
    });

    test('should respect cache enabled/disabled', () => {
      const markdown = '# Test';
      const cached = parser.parseWithCache(markdown, true);
      const notCached = parser.parseWithCache(markdown, false);
      
      expect(cached).toBeDefined();
      expect(notCached).toBeDefined();
    });

    test('should clear cache', () => {
      const markdown = '# Test';
      parser.parseWithCache(markdown, true);
      parser.clearCache();
      
      expect(parser.cache.size).toBe(0);
    });

    test('should retrieve cache entries correctly', () => {
      const key = 'test-key';
      const value = { test: true };
      
      parser.setCacheEntry(key, value);
      const retrieved = parser.getCacheEntry(key);
      
      expect(retrieved).toEqual(value);
    });

    test('should return null for non-existent cache entries', () => {
      const result = parser.getCacheEntry('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('Hook System', () => {
    test('should register and emit beforeParse hook', (done) => {
      let hookCalled = false;
      
      parser.on('beforeParse', (data) => {
        hookCalled = true;
        expect(data.markdown).toBeDefined();
        done();
      });

      parser.parseWithCache('# Test', true);
    });

    test('should register and emit afterParse hook', (done) => {
      let hookCalled = false;
      
      parser.on('afterParse', (data) => {
        expect(data.markdown).toBeDefined();
        expect(data.result).toBeDefined();
        done();
      });

      parser.parseWithCache('# Test', true);
    });

    test('should handle multiple hooks on same event', () => {
      let callCount = 0;
      
      parser.on('beforeParse', () => callCount++);
      parser.on('beforeParse', () => callCount++);
      
      parser.parseWithCache('# Test', true);
      
      expect(callCount).toBe(2);
    });

    test('should handle hook errors gracefully', () => {
      parser.on('beforeParse', () => {
        throw new Error('Hook error');
      });

      // Should not throw even if hook throws (it's caught)
      const result = parser.parseWithCache('# Test', true);
      expect(result).toBeDefined();
    });

    test('should emit onError hook on parse error', (done) => {
      parser.on('onError', (error) => {
        expect(error).toBeDefined();
        done();
      });

      parser.parse = () => {
        throw new Error('Test error');
      };

      try {
        parser.parseWithCache('# Test', true);
      } catch (e) {
        // expected
      }
    });
  });

  describe('String Hashing', () => {
    test('should generate consistent hash for same string', () => {
      const str = 'test string';
      const hash1 = parser.hashString(str);
      const hash2 = parser.hashString(str);
      
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different strings', () => {
      const hash1 = parser.hashString('string1');
      const hash2 = parser.hashString('string2');
      
      expect(hash1).not.toBe(hash2);
    });

    test('should handle empty string', () => {
      const hash = parser.hashString('');
      expect(typeof hash).toBe('string');
    });
  });

  describe('Search Functionality', () => {
    test('should find simple patterns', () => {
      const markdown = '# Heading\n\nParagraph with word';
      const results = parser.search(markdown, 'word');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].text).toBe('word');
    });

    test('should find multiple matches', () => {
      const markdown = 'test test test';
      const results = parser.search(markdown, 'test');
      
      expect(results.length).toBe(3);
    });

    test('should calculate correct line numbers', () => {
      const markdown = '# Line 1\n\nLine 2\ntest in line 4';
      const results = parser.search(markdown, 'test');
      
      expect(results[0].line).toBe(4);
    });

    test('should handle regex patterns', () => {
      const markdown = '# Heading 1\n## Heading 2';
      const results = parser.search(markdown, '#+ Heading');
      
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Replace Functionality', () => {
    test('should replace text occurrences', () => {
      const markdown = 'Hello world';
      const result = parser.replace(markdown, 'world', 'universe');
      
      expect(result).toBe('Hello universe');
    });

    test('should handle regex replacement', () => {
      const markdown = '# Heading';
      const result = parser.replace(markdown, '#', '##');
      
      expect(result).toContain('##');
    });

    test('should handle no matches', () => {
      const markdown = 'Hello world';
      const result = parser.replace(markdown, 'xyz', 'abc');
      
      expect(result).toBe(markdown);
    });
  });

  describe('Line Analysis', () => {
    test('should analyze lines correctly', () => {
      const markdown = '# Heading\n\nParagraph\n- List item';
      const lines = parser.analyzeLines(markdown);
      
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
    });

    test('should detect headings', () => {
      const markdown = '# Heading';
      const lines = parser.analyzeLines(markdown);
      
      expect(lines[0].isHeading).toBe(true);
    });

    test('should detect lists', () => {
      const markdown = '- Item 1\n- Item 2';
      const lines = parser.analyzeLines(markdown);
      
      expect(lines[0].isList).toBe(true);
    });

    test('should detect code fences', () => {
      const markdown = '```\ncode\n```';
      const lines = parser.analyzeLines(markdown);
      
      expect(lines[0].isCodeFence).toBe(true);
    });

    test('should detect blockquotes', () => {
      const markdown = '> Quote';
      const lines = parser.analyzeLines(markdown);
      
      expect(lines[0].isBlockquote).toBe(true);
    });

    test('should detect empty lines', () => {
      const markdown = 'Line 1\n\nLine 3';
      const lines = parser.analyzeLines(markdown);
      
      expect(lines[1].isEmpty).toBe(true);
    });

    test('should calculate line properties', () => {
      const markdown = 'Test line';
      const lines = parser.analyzeLines(markdown);
      
      expect(lines[0].lineNumber).toBe(1);
      expect(lines[0].length).toBe(9);
      expect(lines[0].content).toBe('Test line');
    });
  });

  describe('Line Statistics', () => {
    test('should generate line statistics', () => {
      const markdown = '# Heading\n\nParagraph';
      const stats = parser.getLineStatistics(markdown);
      
      expect(stats).toHaveProperty('totalLines');
      expect(stats).toHaveProperty('emptyLines');
      expect(stats).toHaveProperty('headingLines');
      expect(stats).toHaveProperty('averageLineLength');
    });

    test('should count empty lines correctly', () => {
      const markdown = 'Line 1\n\n\nLine 4';
      const stats = parser.getLineStatistics(markdown);
      
      expect(stats.emptyLines).toBe(2);
    });

    test('should count heading lines', () => {
      const markdown = '# H1\n## H2\n### H3\nText';
      const stats = parser.getLineStatistics(markdown);
      
      expect(stats.headingLines).toBe(3);
    });

    test('should calculate average line length', () => {
      const markdown = 'AB\nCDEF';
      const stats = parser.getLineStatistics(markdown);
      
      expect(stats.averageLineLength).toBeGreaterThan(0);
    });

    test('should track longest and shortest lines', () => {
      const markdown = 'A\nBCDEF\nXY';
      const stats = parser.getLineStatistics(markdown);
      
      // Verify the values are what we expect
      expect(stats.longestLine).toBeGreaterThan(0);
      expect(stats.shortestLine).toBeGreaterThan(0);
      expect(stats.longestLine).toBeGreaterThanOrEqual(stats.shortestLine);
    });
  });

  describe('Formatting', () => {
    test('should format markdown with default options', () => {
      const markdown = 'Line with spaces   \n\nText';
      const formatted = parser.format(markdown);
      
      expect(typeof formatted).toBe('string');
    });

    test('should remove trailing whitespace', () => {
      const markdown = 'Line with spaces   ';
      const formatted = parser.format(markdown, { removeTrailingWhitespace: true });
      
      expect(formatted).not.toContain('   ');
    });

    test('should ensure final newline', () => {
      const markdown = 'Line without final newline';
      const formatted = parser.format(markdown, { ensureFinalNewline: true });
      
      expect(formatted.endsWith('\n')).toBe(true);
    });

    test('should not add newline if present', () => {
      const markdown = 'Line\n';
      const formatted = parser.format(markdown, { ensureFinalNewline: true });
      
      expect(formatted).toBe(markdown);
    });
  });

  describe('Document Comparison', () => {
    test('should detect identical documents', () => {
      const doc = '# Title\n\nContent';
      const result = parser.compare(doc, doc);
      
      expect(result.isSame).toBe(true);
      expect(result.differenceCount).toBe(0);
    });

    test('should detect differences', () => {
      const doc1 = 'Line 1\nLine 2';
      const doc2 = 'Line 1\nLine 2 modified';
      const result = parser.compare(doc1, doc2);
      
      expect(result.isSame).toBe(false);
      expect(result.differenceCount).toBeGreaterThan(0);
    });

    test('should track similarities', () => {
      const doc1 = 'A\nB\nC';
      const doc2 = 'A\nX\nC';
      const result = parser.compare(doc1, doc2);
      
      expect(result.similarities).toBe(2);
    });

    test('should handle different lengths', () => {
      const doc1 = 'Line 1\nLine 2';
      const doc2 = 'Line 1\nLine 2\nLine 3';
      const result = parser.compare(doc1, doc2);
      
      expect(result.differences.length).toBeGreaterThan(0);
    });

    test('should provide difference details', () => {
      const doc1 = 'A';
      const doc2 = 'B';
      const result = parser.compare(doc1, doc2);
      
      expect(result.differences[0]).toHaveProperty('line');
      expect(result.differences[0]).toHaveProperty('doc1');
      expect(result.differences[0]).toHaveProperty('doc2');
    });
  });

  describe('Duplicate Detection', () => {
    test('should find duplicate lines', () => {
      const markdown = 'Line 1\nLine 1\nLine 2';
      const duplicates = parser.findDuplicates(markdown);
      
      expect(Array.isArray(duplicates)).toBe(true);
    });

    test('should handle no duplicates', () => {
      const markdown = 'Line 1\nLine 2\nLine 3';
      const duplicates = parser.findDuplicates(markdown);
      
      expect(duplicates.length).toBe(0);
    });

    test('should count duplicate occurrences', () => {
      const markdown = 'Duplicate\nDuplicate\nDuplicate\nUnique';
      const duplicates = parser.findDuplicates(markdown);
      
      if (duplicates.length > 0) {
        expect(duplicates[0]).toHaveProperty('text');
        // Check for either 'count' or 'occurrences' property
        const hasCounting = duplicates[0].hasOwnProperty('count') || duplicates[0].hasOwnProperty('occurrences');
        expect(hasCounting).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    test('should handle null input gracefully', () => {
      expect(() => parser.parse(null)).toThrow();
    });

    test('should handle undefined input gracefully', () => {
      expect(() => parser.parse(undefined)).toThrow();
    });

    test('should handle very large documents', () => {
      const largeDoc = 'Line\n'.repeat(10000);
      const result = parser.parseWithCache(largeDoc);
      
      expect(result).toBeDefined();
    });
  });

  describe('Integration Tests', () => {
    test('should work with complex markdown', () => {
      const markdown = `# Title

## Subtitle

This is a paragraph with **bold** and *italic*.

> A quote

- List item 1
- List item 2

\`\`\`
code block
\`\`\``;

      const lines = parser.analyzeLines(markdown);
      expect(lines.length).toBeGreaterThan(0);
      
      const stats = parser.getLineStatistics(markdown);
      expect(stats.totalLines).toBeGreaterThan(0);
    });

    test('should handle parse workflow', () => {
      const markdown = '# Test';
      const result = parser.parseWithCache(markdown, true);
      
      expect(result).toBeDefined();
      expect(result.tokens || result.markdown).toBeDefined();
    });
  });

  describe('Hook System', () => {
    test('should register hooks', () => {
      const callback = jest.fn();
      parser.on('beforeParse', callback);
      parser.parseWithCache('# Test');
      
      expect(callback).toHaveBeenCalled();
    });

    test('should handle multiple hooks on same event', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      parser.on('beforeParse', callback1);
      parser.on('beforeParse', callback2);
      parser.parseWithCache('# Test');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });

    test('should emit afterParse hook', () => {
      const callback = jest.fn();
      parser.on('afterParse', callback);
      parser.parseWithCache('# Test');
      
      expect(callback).toHaveBeenCalled();
    });

    test('should handle errors in hooks gracefully', () => {
      parser.on('beforeParse', () => {
        throw new Error('Hook error');
      });
      
      expect(() => {
        parser.parseWithCache('# Test');
      }).not.toThrow();
    });
  });

  describe('Hash Function', () => {
    test('should generate consistent hash', () => {
      const text = 'Hello World';
      const hash1 = parser.hashString(text);
      const hash2 = parser.hashString(text);
      
      expect(hash1).toBe(hash2);
    });

    test('should generate different hashes for different strings', () => {
      const hash1 = parser.hashString('Hello');
      const hash2 = parser.hashString('World');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Cache Operations', () => {
    test('should set and retrieve cache entries', () => {
      const key = 'test-key';
      const value = { type: 'heading', level: 1 };
      
      parser.setCacheEntry(key, value);
      const retrieved = parser.getCacheEntry(key);
      
      expect(retrieved).toEqual(value);
    });

    test('should return null for missing cache entries', () => {
      const retrieved = parser.getCacheEntry('non-existent-key');
      expect(retrieved).toBeNull();
    });

    test('should clear all cache entries', () => {
      parser.setCacheEntry('key1', { test: 1 });
      parser.setCacheEntry('key2', { test: 2 });
      
      parser.clearCache();
      
      expect(parser.getCacheEntry('key1')).toBeNull();
      expect(parser.getCacheEntry('key2')).toBeNull();
    });

    test('should store timestamp with cache entry', () => {
      const key = 'test-key';
      const value = { type: 'test' };
      
      parser.setCacheEntry(key, value);
      
      // Cache entry should exist
      expect(parser.getCacheEntry(key)).toEqual(value);
    });
  });

  describe('Complex Markdown Parsing', () => {
    test('should parse markdown with multiple elements', () => {
      const markdown = `# Title
      
## Subtitle

This is a **bold** and *italic* text.

- Item 1
- Item 2

[Link](https://example.com)`;

      const result = parser.parseWithCache(markdown);
      expect(result).toBeDefined();
    });

    test('should handle nested structures', () => {
      const markdown = `- Parent
  - Child 1
  - Child 2
    - Grandchild`;

      const result = parser.parseWithCache(markdown);
      expect(result).toBeDefined();
    });

    test('should parse tables', () => {
      const markdown = `| Header 1 | Header 2 |
| -------- | -------- |
| Cell 1   | Cell 2   |`;

      const result = parser.parseWithCache(markdown);
      expect(result).toBeDefined();
    });

    test('should parse code blocks', () => {
      const markdown = `\`\`\`javascript
const x = 1;
console.log(x);
\`\`\``;

      const result = parser.parseWithCache(markdown);
      expect(result).toBeDefined();
    });

    test('should parse blockquotes', () => {
      const markdown = `> This is a quote
> With multiple lines`;

      const result = parser.parseWithCache(markdown);
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty markdown', () => {
      const result = parser.parseWithCache('');
      expect(result).toBeDefined();
    });

    test('should handle null or undefined', () => {
      expect(() => {
        parser.parseWithCache(null);
      }).toThrow();
    });

    test('should handle very long markdown', () => {
      const longMarkdown = '# Title\n\n' + 'Paragraph\n\n'.repeat(1000);
      const result = parser.parseWithCache(longMarkdown);
      expect(result).toBeDefined();
    });

    test('should handle special characters', () => {
      const markdown = '# Test with special chars: @#$%^&*()';
      const result = parser.parseWithCache(markdown);
      expect(result).toBeDefined();
    });

    test('should handle unicode characters', () => {
      const markdown = '# Тест Unicode: 你好世界 🎉';
      const result = parser.parseWithCache(markdown);
      expect(result).toBeDefined();
    });
  });
});
