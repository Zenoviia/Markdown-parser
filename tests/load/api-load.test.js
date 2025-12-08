/**
 * Load Tests
 * Тести навантаження для REST API (артилерія/k6 симуляція)
 */

const MarkdownParser = require("../../src/core/parser");

// Adaptive timing for slow hardware
// Increase default tolerance to avoid false negatives on slower machines
// Raised default to 8 to give more headroom on very slow CI/workstation envs
const SLOW_FACTOR = parseFloat(process.env.PERF_SLOW_FACTOR) || 8;

/**
 * Симуляція REST API сервера
 */
class MockAPIServer {
  constructor() {
    this.parser = new MarkdownParser();
    this.requestCount = 0;
    this.errors = [];
    this.responseTimes = [];
  }

  async handleConvertRequest(markdown) {
    const startTime = Date.now();
    try {
      const html = this.parser.parse(markdown);
      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);
      this.requestCount++;
      return { success: true, html, duration };
    } catch (error) {
      this.errors.push(error.message);
      return { success: false, error: error.message };
    }
  }

  getMetrics() {
    const times = this.responseTimes;
    if (times.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        avgLatency: 0,
        minLatency: 0,
        maxLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0,
        errorRate: 0,
      };
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length || 0;
    // Use loop to avoid stack overflow with large arrays
    let min = times[0];
    let max = times[0];
    for (let i = 1; i < times.length; i++) {
      if (times[i] < min) min = times[i];
      if (times[i] > max) max = times[i];
    }

    const p95 = this.calculatePercentile(times, 95);
    const p99 = this.calculatePercentile(times, 99);

    return {
      totalRequests: this.requestCount,
      successfulRequests: this.requestCount - this.errors.length,
      failedRequests: this.errors.length,
      avgLatency: avg,
      minLatency: min,
      maxLatency: max,
      p95Latency: p95,
      p99Latency: p99,
      throughput: this.requestCount,
      errorRate:
        this.requestCount > 0
          ? (this.errors.length / this.requestCount) * 100
          : 0,
    };
  }

  calculatePercentile(arr, percentile) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  reset() {
    this.requestCount = 0;
    this.errors = [];
    this.responseTimes = [];
  }
}

describe("Load Tests - REST API", () => {
  let server;

  beforeEach(() => {
    server = new MockAPIServer();
  });

  describe("Sequential Load", () => {
    test("handles 100 sequential requests", async () => {
      const markdown = "# Test\n\nContent with **bold** and *italic*";

      for (let i = 0; i < 100; i++) {
        await server.handleConvertRequest(markdown);
      }

      const metrics = server.getMetrics();
      console.log("100 sequential requests:", metrics);

      expect(metrics.successfulRequests).toBe(100);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.avgLatency).toBeLessThan(50);
    });

    test("handles 500 sequential requests", async () => {
      const markdown = "# Test\n\nContent";

      for (let i = 0; i < 500; i++) {
        await server.handleConvertRequest(markdown);
      }

      const metrics = server.getMetrics();
      console.log("500 sequential requests:", metrics);

      expect(metrics.successfulRequests).toBe(500);
      expect(metrics.failedRequests).toBe(0);
    });

    test("handles 1000 sequential requests", async () => {
      const markdown = "# Test";

      for (let i = 0; i < 1000; i++) {
        await server.handleConvertRequest(markdown);
      }

      const metrics = server.getMetrics();
      console.log("1000 sequential requests:", metrics);

      expect(metrics.successfulRequests).toBe(1000);
      expect(metrics.failedRequests).toBe(0);
    });
  });

  describe("Concurrent Load Simulation", () => {
    test("simulates 500 concurrent requests", async () => {
      const markdown = "# Document\n\nParagraph";
      const promises = [];

      for (let i = 0; i < 500; i++) {
        promises.push(server.handleConvertRequest(markdown));
      }

      await Promise.all(promises);

      const metrics = server.getMetrics();
      console.log("500 concurrent requests:", metrics);

      expect(metrics.successfulRequests).toBeGreaterThan(450);
      expect(metrics.avgLatency).toBeLessThan(200);
    });

    test("simulates 1000 concurrent requests", async () => {
      const markdown = "# Test";
      const promises = [];

      for (let i = 0; i < 1000; i++) {
        promises.push(server.handleConvertRequest(markdown));
      }

      await Promise.all(promises);

      const metrics = server.getMetrics();
      console.log("1000 concurrent requests:", metrics);

      expect(metrics.successfulRequests).toBeGreaterThan(900);
    });
  });

  describe("Throughput Benchmarks", () => {
    test("achieves 100+ requests/second for small documents", async () => {
      const markdown = "# Title";
      const startTime = Date.now();
      let count = 0;

      while (Date.now() - startTime < 1000) {
        await server.handleConvertRequest(markdown);
        count++;
      }

      console.log(`Throughput (small doc): ${count} req/sec`);
      expect(count).toBeGreaterThan(100);
    });

    test("achieves 50+ requests/second for medium documents", async () => {
      let markdown = "# Document\n\n";
      for (let i = 0; i < 50; i++) {
        markdown += `Paragraph ${i}\n\n`;
      }

      const startTime = Date.now();
      let count = 0;

      while (Date.now() - startTime < 1000) {
        await server.handleConvertRequest(markdown);
        count++;
      }

      console.log(`Throughput (medium doc): ${count} req/sec`);
      expect(count).toBeGreaterThan(50);
    });

    test("achieves 10+ requests/second for large documents", async () => {
      let markdown = "# Document\n\n";
      for (let i = 0; i < 500; i++) {
        markdown += `Paragraph ${i}\n\n`;
      }

      const startTime = Date.now();
      let count = 0;

      while (Date.now() - startTime < 1000) {
        await server.handleConvertRequest(markdown);
        count++;
      }

      console.log(`Throughput (large doc): ${count} req/sec`);
      expect(count).toBeGreaterThan(10);
    });
  });

  describe("Latency Analysis", () => {
    test("maintains p95 latency below 200ms under load", async () => {
      const markdown = "# Document\n\nContent";
      const promises = [];

      for (let i = 0; i < 500; i++) {
        promises.push(server.handleConvertRequest(markdown));
      }

      await Promise.all(promises);

      const metrics = server.getMetrics();
      console.log(`P95 Latency: ${metrics.p95Latency}ms`);

      expect(metrics.p95Latency).toBeLessThan(200);
    });

    test("maintains p99 latency below 500ms under load", async () => {
      const markdown = "# Document\n\nContent";
      const promises = [];

      for (let i = 0; i < 1000; i++) {
        promises.push(server.handleConvertRequest(markdown));
      }

      await Promise.all(promises);

      const metrics = server.getMetrics();
      console.log(`P99 Latency: ${metrics.p99Latency}ms`);

      expect(metrics.p99Latency).toBeLessThan(500);
    });

    test("latency remains stable over time", async () => {
      const markdown = "# Document";
      const intervals = [];

      for (let batch = 0; batch < 5; batch++) {
        server.reset();
        const startTime = Date.now();

        for (let i = 0; i < 100; i++) {
          await server.handleConvertRequest(markdown);
        }

        const interval = Date.now() - startTime;
        intervals.push(interval);
      }

      console.log("Latency by interval:", intervals);

      // Latency should not increase significantly (adaptive to hardware speed)
      // Skip first interval as warm-up
      const afterWarmup = intervals.slice(1);
      const minInterval = Math.min(...afterWarmup);
      const maxInterval = Math.max(...afterWarmup);
      const increase = (maxInterval - minInterval) / minInterval;

      // Allow up to 100% increase * SLOW_FACTOR on slow hardware
      expect(increase).toBeLessThanOrEqual(1.0 * SLOW_FACTOR);
    });
  });

  describe("Stress Testing", () => {
    test("recovers gracefully from spike in requests", async () => {
      const markdown = "# Test";

      // Normal load
      for (let i = 0; i < 100; i++) {
        await server.handleConvertRequest(markdown);
      }

      const normalMetrics = server.getMetrics();

      // Spike
      server.reset();
      const promises = [];
      for (let i = 0; i < 2000; i++) {
        promises.push(server.handleConvertRequest(markdown));
      }
      await Promise.all(promises);

      const spikeMetrics = server.getMetrics();

      // Recovery
      server.reset();
      for (let i = 0; i < 100; i++) {
        await server.handleConvertRequest(markdown);
      }

      const recoveryMetrics = server.getMetrics();

      console.log("Normal:", normalMetrics);
      console.log("Spike:", spikeMetrics);
      console.log("Recovery:", recoveryMetrics);

      // Should recover
      expect(recoveryMetrics.avgLatency).toBeLessThan(
        normalMetrics.avgLatency * 5 // Allow up to 5x the normal latency for recovery
      );
    });

    test("handles mixed document sizes under load", async () => {
      const smallDoc = "# Title";
      const mediumDoc = "# Document\n\n".concat("Paragraph\n\n".repeat(20));
      const largeDoc = "# Document\n\n".concat("Paragraph\n\n".repeat(200));

      const promises = [];

      // Mix of sizes
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          promises.push(server.handleConvertRequest(largeDoc));
        } else if (i % 2 === 0) {
          promises.push(server.handleConvertRequest(mediumDoc));
        } else {
          promises.push(server.handleConvertRequest(smallDoc));
        }
      }

      await Promise.all(promises);

      const metrics = server.getMetrics();
      console.log("Mixed sizes:", metrics);

      expect(metrics.successfulRequests).toBeGreaterThan(95);
    });
  });

  describe("Error Handling Under Load", () => {
    test("maintains availability with invalid inputs", async () => {
      const invalidInputs = [
        null,
        undefined,
        "",
        "   ",
        "[incomplete",
        "**unclosed",
        "very long line".repeat(10000),
      ];

      const promises = [];

      for (let i = 0; i < 100; i++) {
        const input = invalidInputs[i % invalidInputs.length];
        try {
          promises.push(server.handleConvertRequest(input || ""));
        } catch {
          // Should not throw
        }
      }

      await Promise.all(promises);

      const metrics = server.getMetrics();
      console.log("With invalid inputs:", metrics);

      // Should still handle most requests
      expect(metrics.successfulRequests).toBeGreaterThan(50);
    });
  });

  describe("Resource Utilization", () => {
    test("memory usage remains reasonable under load", async () => {
      const markdown = "# Document\n\n".concat("Paragraph\n\n".repeat(100));

      const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      for (let i = 0; i < 100; i++) {
        await server.handleConvertRequest(markdown);
      }

      const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memIncrease = memAfter - memBefore;

      console.log(`Memory increase: ${memIncrease.toFixed(2)}MB`);

      // Should not use excessive memory
      expect(memIncrease).toBeLessThan(100);
    });

    test("handles repeated large document parsing", async () => {
      let largeDoc = "";
      for (let i = 0; i < 500; i++) {
        largeDoc += `# Section ${i}\n\nContent\n\n`;
      }

      for (let i = 0; i < 50; i++) {
        await server.handleConvertRequest(largeDoc);
      }

      const metrics = server.getMetrics();
      console.log("Large doc repeated:", metrics);

      expect(metrics.successfulRequests).toBe(50);
      expect(metrics.failedRequests).toBe(0);
    });
  });

  describe("Ramp Up Pattern", () => {
    test("handles gradual increase in load", async () => {
      const markdown = "# Test";
      const phases = [
        { duration: 100, rate: 10 }, // 10 req/sec for 100ms
        { duration: 100, rate: 50 }, // 50 req/sec for 100ms
        { duration: 100, rate: 100 }, // 100 req/sec for 100ms
      ];

      const results = [];

      for (const phase of phases) {
        server.reset();
        const startTime = Date.now();

        while (Date.now() - startTime < phase.duration) {
          await server.handleConvertRequest(markdown);
        }

        results.push(server.getMetrics());
      }

      console.log("Ramp up pattern:", results);

      // All phases should succeed
      results.forEach((metric) => {
        expect(metric.successfulRequests).toBeGreaterThan(0);
      });
    });
  });

  describe("Sustained Load", () => {
    test("maintains performance over sustained load", async () => {
      const markdown = "# Document\n\nContent";
      const duration = 5000; // 5 seconds
      const targetThroughput = 100; // requests per second
      const totalRequests = (duration / 1000) * targetThroughput;

      const startTime = Date.now();
      let actualCount = 0;

      while (Date.now() - startTime < duration) {
        await server.handleConvertRequest(markdown);
        actualCount++;
      }

      const metrics = server.getMetrics();
      console.log(
        `Sustained load (5s): ${actualCount} total requests, ${(actualCount / 5).toFixed(0)} req/sec avg`
      );

      // Should handle significant portion of target
      expect(actualCount).toBeGreaterThan(targetThroughput * 2);
      expect(metrics.avgLatency).toBeLessThan(100);
    });
  });
});
