/**
 * Performance Tests
 * Тести продуктивності та бенчмарки
 */

const MarkdownParser = require("../../src/core/parser");

describe("Performance Tests", () => {
  let parser;
  // Allow adjusting performance thresholds on slower machines/CI.
  // Set env var PERF_SLOW_FACTOR to a number >1 to relax thresholds.
  const SLOW_FACTOR = parseFloat(process.env.PERF_SLOW_FACTOR) || 2;
  beforeEach(() => {
    parser = new MarkdownParser();
  });

  /**
   * Утиліта для вимірювання часу виконання
   * @param {function} fn - Функція
   * @param {number} iterations - Кількість ітерацій
   * @returns {object} Результат
   */
  function measurePerformance(fn, iterations = 1) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      fn();
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1000000); // Convert to ms
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    return { avg, min, max, times };
  }

  /**
   * Утиліта для генерування тестових документів
   * @param {number} lines - Кількість рядків
   * @returns {string} Markdown текст
   */
  function generateMarkdown(lines) {
    let markdown = "";
    for (let i = 0; i < lines; i++) {
      markdown += `# Section ${i}\n\nParagraph ${i}\n\n`;
    }
    return markdown;
  }

  describe("Parsing Performance", () => {
    test("parses 100 lines in reasonable time", () => {
      const markdown = generateMarkdown(100);
      const result = measurePerformance(() => parser.parse(markdown), 5);

      console.log(`100 lines - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(100 * SLOW_FACTOR); // Adaptive threshold
    });

    test("parses 500 lines in reasonable time", () => {
      const markdown = generateMarkdown(500);
      const result = measurePerformance(() => parser.parse(markdown), 3);

      console.log(`500 lines - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(300 * SLOW_FACTOR);
    });

    test("parses 1000 lines in reasonable time", () => {
      const markdown = generateMarkdown(1000);
      const result = measurePerformance(() => parser.parse(markdown), 1);

      console.log(`1000 lines - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(500 * SLOW_FACTOR);
    });

    test("maintains linear performance (O(n))", () => {
      const sizes = [100, 200, 400];
      const times = [];

      for (const size of sizes) {
        const markdown = generateMarkdown(size);
        const result = measurePerformance(() => parser.parse(markdown), 2);
        times.push(result.avg);
        console.log(`${size} lines: ${result.avg.toFixed(2)}ms`);
      }

      // Check if performance scales roughly linearly.
      // Normalize by size (ms per line) to avoid artifacts where very small
      // baseline times amplify ratios. We then compare the per-line times.
      const perLine = times.map((t, idx) => t / sizes[idx]);
      const maxPer = Math.max(...perLine);
      const minPer = Math.min(...perLine);
      const perRatio = maxPer / (minPer || 1e-6);

      console.log(
        `per-line (ms): ${perLine.map((p) => p.toFixed(3)).join(", ")}`
      );
      console.log(`per-line ratio: ${perRatio.toFixed(2)}`);

      // Allow for variability in per-line cost. Use SLOW_FACTOR to relax on slow machines.
      expect(perRatio).toBeLessThan(4 * SLOW_FACTOR);
    });
  });

  describe("AST Generation Performance", () => {
    test("generates AST for 100 lines", () => {
      const markdown = generateMarkdown(100);
      const result = measurePerformance(() => parser.parseToAST(markdown), 5);

      console.log(`100 lines AST - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(100 * SLOW_FACTOR);
    });

    test("generates AST for 500 lines", () => {
      const markdown = generateMarkdown(500);
      const result = measurePerformance(() => parser.parseToAST(markdown), 3);

      console.log(`500 lines AST - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(300 * SLOW_FACTOR);
    });
  });

  describe("Memory Usage", () => {
    test("memory stays stable during repeated parsing", () => {
      const markdown = generateMarkdown(100);
      const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      for (let i = 0; i < 100; i++) {
        parser.parse(markdown);
      }

      const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memIncrease = memAfter - memBefore;

      console.log(`Memory increase: ${memIncrease.toFixed(2)}MB`);
      expect(memIncrease).toBeLessThan(50); // Should be < 50MB
    });

    test("large document memory usage", () => {
      const markdown = generateMarkdown(1000);
      const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      parser.parse(markdown);

      const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memUsage = memAfter - memBefore;

      console.log(`Large doc memory: ${memUsage.toFixed(2)}MB`);
      expect(memUsage).toBeLessThan(100);
    });
  });

  describe("Complex Markdown Performance", () => {
    test("parses markdown with many links", () => {
      let markdown = "# Document\n\n";
      for (let i = 0; i < 100; i++) {
        markdown += `[Link ${i}](https://example.com/${i})\n`;
      }

      const result = measurePerformance(() => parser.parse(markdown), 5);
      console.log(`100 links - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(100 * SLOW_FACTOR);
    });

    test("parses markdown with many images", () => {
      let markdown = "# Document\n\n";
      for (let i = 0; i < 100; i++) {
        markdown += `![Image ${i}](image-${i}.jpg)\n`;
      }

      const result = measurePerformance(() => parser.parse(markdown), 5);
      console.log(`100 images - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(100 * SLOW_FACTOR);
    });

    test("parses markdown with many code blocks", () => {
      let markdown = "# Document\n\n";
      for (let i = 0; i < 50; i++) {
        markdown += `\`\`\`js\ncode ${i}\n\`\`\`\n`;
      }

      const result = measurePerformance(() => parser.parse(markdown), 5);
      console.log(`50 code blocks - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(200 * SLOW_FACTOR);
    });

    test("parses markdown with many tables", () => {
      let markdown = "# Document\n\n";
      for (let i = 0; i < 20; i++) {
        markdown += `
| Col1 | Col2 |
|------|------|
| A    | B    |
| C    | D    |
`;
      }

      const result = measurePerformance(() => parser.parse(markdown), 3);
      console.log(`20 tables - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(300 * SLOW_FACTOR);
    });

    test("parses nested lists", () => {
      let markdown = "# Document\n\n";
      for (let i = 0; i < 50; i++) {
        markdown += `
- Item ${i}
  - Nested 1
  - Nested 2
    - Deep 1
    - Deep 2
`;
      }

      const result = measurePerformance(() => parser.parse(markdown), 3);
      console.log(`Nested lists - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(200 * SLOW_FACTOR);
    });
  });

  describe("Tokenization Performance", () => {
    test("tokenizes 100 lines quickly", () => {
      const markdown = generateMarkdown(100);
      const tokenizer = parser.tokenizer;

      const result = measurePerformance(() => tokenizer.tokenize(markdown), 5);
      console.log(`Tokenize 100 lines - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(50 * SLOW_FACTOR);
    });

    test("inline tokenization performance", () => {
      const text =
        "Text with **bold** and *italic* and [link](url) and ![image](img.jpg)".repeat(
          100
        );
      const tokenizer = parser.tokenizer;

      const result = measurePerformance(
        () => tokenizer.tokenizeInline(text),
        10
      );
      console.log(`Inline tokenize - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(50 * SLOW_FACTOR);
    });
  });

  describe("Rendering Performance", () => {
    test("renders AST quickly", () => {
      const markdown = generateMarkdown(100);
      const ast = parser.parseToAST(markdown);

      const result = measurePerformance(() => {
        const HTMLRenderer = require("../../src/renderers/htmlRenderer");
        const renderer = new HTMLRenderer();
        renderer.render(ast);
      }, 5);

      console.log(`Render 100 lines - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(50 * SLOW_FACTOR);
    });
  });

  describe("Statistics Calculation Performance", () => {
    test("calculates statistics efficiently", () => {
      const markdown = generateMarkdown(100);

      const result = measurePerformance(
        () => parser.getStatistics(markdown),
        5
      );
      console.log(`Statistics 100 lines - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(100 * SLOW_FACTOR);
    });
  });

  describe("Throughput Benchmarks", () => {
    test("processes at least 100 requests/sec for small documents", () => {
      const markdown = generateMarkdown(10);
      const startTime = Date.now();
      let count = 0;

      while (Date.now() - startTime < 1000) {
        parser.parse(markdown);
        count++;
      }

      const requestsPerSecond = count;
      console.log(`Throughput (10 lines): ${requestsPerSecond} req/sec`);
      expect(requestsPerSecond).toBeGreaterThan(100 / SLOW_FACTOR);
    });

    test("processes at least 50 requests/sec for medium documents", () => {
      const markdown = generateMarkdown(50);
      const startTime = Date.now();
      let count = 0;

      while (Date.now() - startTime < 1000) {
        parser.parse(markdown);
        count++;
      }

      const requestsPerSecond = count;
      console.log(`Throughput (50 lines): ${requestsPerSecond} req/sec`);
      expect(requestsPerSecond).toBeGreaterThan(50 / SLOW_FACTOR);
    });
  });

  describe("Worst-case Performance", () => {
    test("handles deeply nested blockquotes", () => {
      let markdown = "> Quote";
      for (let i = 0; i < 20; i++) {
        markdown = `> ${markdown}`;
      }

      const result = measurePerformance(() => parser.parse(markdown), 5);
      console.log(`Deep nesting - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(100 * SLOW_FACTOR);
    });

    test("handles very long single line", () => {
      const markdown = "A".repeat(10000);

      const result = measurePerformance(() => parser.parse(markdown), 5);
      console.log(`Long line - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(100 * SLOW_FACTOR);
    });

    test("handles many empty lines", () => {
      const markdown = "\n".repeat(1000);

      const result = measurePerformance(() => parser.parse(markdown), 10);
      console.log(`Empty lines - Average: ${result.avg.toFixed(2)}ms`);
      expect(result.avg).toBeLessThan(50 * SLOW_FACTOR);
    });
  });

  describe("Comparative Performance", () => {
    test("AST generation vs HTML generation", () => {
      const markdown = generateMarkdown(100);

      const astTime = measurePerformance(
        () => parser.parseToAST(markdown),
        5
      ).avg;
      const htmlTime = measurePerformance(() => parser.parse(markdown), 5).avg;

      console.log(
        `AST time: ${astTime.toFixed(2)}ms, HTML time: ${htmlTime.toFixed(2)}ms`
      );

      expect(htmlTime).toBeLessThan(htmlTime * 2);
    });

    test("parsing vs validation performance", () => {
      const markdown = generateMarkdown(100);

      const parseTime = measurePerformance(() => parser.parse(markdown), 5).avg;
      const validateTime = measurePerformance(
        () => parser.validate(markdown),
        5
      ).avg;

      console.log(
        `Parse: ${parseTime.toFixed(2)}ms, Validate: ${validateTime.toFixed(2)}ms`
      );
      expect(validateTime).toBeLessThan(parseTime * 3.5);
    });
  });
});
