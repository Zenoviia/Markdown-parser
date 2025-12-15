const MarkdownParser = require("../../src/core/parser");

describe("Parser Profiling - Bottleneck Analysis", () => {
  let parser;

  beforeEach(() => {
    parser = new MarkdownParser();
  });

  function generateMarkdown(lines) {
    let markdown = "";
    for (let i = 0; i < lines; i++) {
      markdown += `# Section ${i}\n\nParagraph ${i}\n\n`;
    }
    return markdown;
  }

  function profileComponent(fn, label, iterations = 1) {
    const times = [];

    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      fn();
      const end = process.hrtime.bigint();
      times.push(Number(end - start) / 1000000);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(
      `  ${label.padEnd(40)} | Avg: ${avg.toFixed(3)}ms | Min: ${min.toFixed(
        3
      )}ms | Max: ${max.toFixed(3)}ms`
    );

    return { avg, min, max };
  }

  test("Profile component execution times for 100k lines", () => {
    const markdown = generateMarkdown(100000);
    console.log("\n" + "=".repeat(100));
    console.log("PROFILING: Component Breakdown for 100k lines");
    console.log("=".repeat(100));
    console.log(
      "Component                                   | Avg Time    | Min Time    | Max Time"
    );
    console.log("-".repeat(100));

    const normResult = profileComponent(
      () => {
        parser.normalizeLineEndings(markdown);
      },
      "1. Normalize Line Endings (REGEX)",
      3
    );

    const tokenResult = profileComponent(
      () => {
        parser.tokenizer.tokenize(markdown);
      },
      "2. Tokenization (MAIN BOTTLENECK?)",
      1
    );

    const normalized = parser.normalizeLineEndings(markdown);
    const tokens = parser.tokenizer.tokenize(normalized);

    const astResult = profileComponent(
      () => {
        parser.astBuilder.build(tokens);
      },
      "3. AST Building",
      1
    );

    const fullResult = profileComponent(
      () => {
        parser.parse(markdown);
      },
      "4. Full Parse (including rendering)",
      1
    );

    console.log("-".repeat(100));
    console.log("\nSummary:");
    console.log(`  Normalization: ${normResult.avg.toFixed(3)}ms`);
    console.log(
      `  Tokenization:  ${tokenResult.avg.toFixed(3)}ms (${(
        (tokenResult.avg / fullResult.avg) *
        100
      ).toFixed(1)}% of total)`
    );
    console.log(
      `  AST Building:  ${astResult.avg.toFixed(3)}ms (${(
        (astResult.avg / fullResult.avg) *
        100
      ).toFixed(1)}% of total)`
    );
    console.log(`  Full Parse:    ${fullResult.avg.toFixed(3)}ms`);
    console.log(
      `  Rendering:     ${(
        fullResult.avg -
        tokenResult.avg -
        astResult.avg
      ).toFixed(3)}ms`
    );
    console.log("\n" + "=".repeat(100) + "\n");

    expect(tokenResult.avg).toBeGreaterThan(0);
    expect(astResult.avg).toBeGreaterThan(0);
  });

  test("Profile tokenization phases for 100k lines", () => {
    const markdown = generateMarkdown(100000);
    const normalized = parser.normalizeLineEndings(markdown);

    console.log("\n" + "=".repeat(100));
    console.log("PROFILING: Tokenization Deep Dive (100k lines)");
    console.log("=".repeat(100));
    console.log(
      "Tokenization Phase                          | Avg Time    | Percentage"
    );
    console.log("-".repeat(100));

    const start1 = process.hrtime.bigint();
    const tokens = parser.tokenizer.tokenize(normalized);
    const end1 = process.hrtime.bigint();
    const totalTokenTime = Number(end1 - start1) / 1000000;

    console.log(`  Total tokens generated: ${tokens.length}`);
    console.log(`  Total tokenization time: ${totalTokenTime.toFixed(3)}ms`);
    console.log(
      `  Time per token: ${(totalTokenTime / tokens.length).toFixed(6)}ms`
    );

    const lines = normalized.split("\n").length;
    console.log(`  Total lines: ${lines}`);
    console.log(`  Time per line: ${(totalTokenTime / lines).toFixed(6)}ms`);

    console.log("\n" + "=".repeat(100) + "\n");

    expect(totalTokenTime).toBeGreaterThan(0);
  });

  test("Profile AST building phases for 100k lines", () => {
    const markdown = generateMarkdown(100000);
    const normalized = parser.normalizeLineEndings(markdown);
    const tokens = parser.tokenizer.tokenize(normalized);

    console.log("\n" + "=".repeat(100));
    console.log("PROFILING: AST Building Deep Dive (100k lines)");
    console.log("=".repeat(100));
    console.log(
      "AST Building Phase                          | Avg Time    | Percentage"
    );
    console.log("-".repeat(100));

    const start = process.hrtime.bigint();
    const ast = parser.astBuilder.build(tokens);
    const end = process.hrtime.bigint();
    const totalASTTime = Number(end - start) / 1000000;

    const nodeCount = parser.countNodes(ast);
    console.log(`  Total nodes in AST: ${nodeCount}`);
    console.log(`  Total AST building time: ${totalASTTime.toFixed(3)}ms`);
    console.log(`  Time per node: ${(totalASTTime / nodeCount).toFixed(6)}ms`);
    console.log(`  Token count: ${tokens.length}`);
    console.log(
      `  Time per token: ${(totalASTTime / tokens.length).toFixed(6)}ms`
    );

    console.log("\n" + "=".repeat(100) + "\n");

    expect(totalASTTime).toBeGreaterThan(0);
  });

  test("Profile rendering phase for 100k lines", () => {
    const markdown = generateMarkdown(100000);
    const ast = parser.parseToAST(markdown);

    console.log("\n" + "=".repeat(100));
    console.log("PROFILING: Rendering Deep Dive (100k lines)");
    console.log("=".repeat(100));
    console.log(
      "Rendering Phase                             | Avg Time    | Percentage"
    );
    console.log("-".repeat(100));

    const start = process.hrtime.bigint();
    const html = parser.renderer.render(ast);
    const end = process.hrtime.bigint();
    const renderTime = Number(end - start) / 1000000;

    const nodeCount = parser.countNodes(ast);
    console.log(`  Total nodes rendered: ${nodeCount}`);
    console.log(`  Total rendering time: ${renderTime.toFixed(3)}ms`);
    console.log(`  Time per node: ${(renderTime / nodeCount).toFixed(6)}ms`);
    console.log(`  HTML output size: ${html.length} bytes`);
    console.log(`  Time per byte: ${(renderTime / html.length).toFixed(9)}ms`);

    console.log("\n" + "=".repeat(100) + "\n");

    expect(renderTime).toBeGreaterThan(0);
  });

  test("Complexity analysis: tokenization scales linearly", () => {
    console.log("\n" + "=".repeat(100));
    console.log(
      "COMPLEXITY ANALYSIS: Tokenization Scaling (10k to 100k lines)"
    );
    console.log("=".repeat(100));
    console.log(
      "Input Size     | Token Count | Exec Time (ms) | Time/Line (μs) | Time/Token (μs)"
    );
    console.log("-".repeat(100));

    const sizes = [10000, 25000, 50000, 100000];
    const results = [];

    for (const size of sizes) {
      const markdown = generateMarkdown(size);
      const normalized = parser.normalizeLineEndings(markdown);

      const start = process.hrtime.bigint();
      const tokens = parser.tokenizer.tokenize(normalized);
      const end = process.hrtime.bigint();
      const tokenTime = Number(end - start) / 1000000;

      const timePerLine = (tokenTime / size) * 1000;
      const timePerToken = (tokenTime / tokens.length) * 1000;

      results.push({
        size,
        tokens: tokens.length,
        time: tokenTime,
        timePerLine,
        timePerToken,
      });

      console.log(
        `${String(size).padEnd(14)} | ${String(tokens.length).padEnd(
          11
        )} | ${String(tokenTime.toFixed(2)).padEnd(14)} | ${String(
          timePerLine.toFixed(3)
        ).padEnd(14)} | ${timePerToken.toFixed(3)}`
      );
    }

    console.log("-".repeat(100));

    const timePerLines = results.map((r) => r.timePerLine);
    const minTime = Math.min(...timePerLines);
    const maxTime = Math.max(...timePerLines);
    const ratio = maxTime / minTime;

    console.log(`\nLinearity Check (Time per Line):`);
    console.log(`  Min: ${minTime.toFixed(3)} μs`);
    console.log(`  Max: ${maxTime.toFixed(3)} μs`);
    console.log(
      `  Ratio: ${ratio.toFixed(2)}x (threshold: 1.5x for true O(n))`
    );

    if (ratio < 1.5) {
      console.log(`  ✓ TOKENIZATION IS O(n) LINEAR`);
    } else {
      console.log(`  ⚠ TOKENIZATION SHOWS NON-LINEAR BEHAVIOR (investigate)`);
    }

    console.log("\n" + "=".repeat(100) + "\n");
  });

  test("Memory profiling during parsing of 100k lines", () => {
    const markdown = generateMarkdown(100000);

    console.log("\n" + "=".repeat(100));
    console.log("MEMORY PROFILING: 100k lines parsing");
    console.log("=".repeat(100));

    const memBefore = process.memoryUsage();
    console.log(`Memory before parsing:`);
    console.log(
      `  Heap Used: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(
      `  Heap Total: ${(memBefore.heapTotal / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(
      `  External: ${(memBefore.external / 1024 / 1024).toFixed(2)}MB`
    );

    const result = parser.parse(markdown);

    const memAfter = process.memoryUsage();
    console.log(`\nMemory after parsing:`);
    console.log(
      `  Heap Used: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(
      `  Heap Total: ${(memAfter.heapTotal / 1024 / 1024).toFixed(2)}MB`
    );
    console.log(
      `  External: ${(memAfter.external / 1024 / 1024).toFixed(2)}MB`
    );

    const heapIncrease = (memAfter.heapUsed - memBefore.heapUsed) / 1024 / 1024;
    console.log(`\nHeap memory increase: ${heapIncrease.toFixed(2)}MB`);
    console.log(`Output HTML size: ${(result.length / 1024).toFixed(2)}KB`);

    console.log("\n" + "=".repeat(100) + "\n");
  });
});
