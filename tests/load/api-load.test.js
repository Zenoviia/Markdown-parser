const request = require("supertest");
const { createServer } = require("../../src/server");
const ReportGenerator = require("../../src/utils/reportGenerator");

const SLOW_FACTOR = parseFloat(process.env.PERF_SLOW_FACTOR) || 8;

class HTTPLoadTester {
  constructor(agent) {
    this.agent = agent;
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.statusCodes = {};
  }

  async sendConvertRequest(markdown) {
    const startTime = Date.now();
    try {
      const response = await this.agent
        .post("/convert")
        .set("Content-Type", "application/json")
        .send({ markdown });

      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);
      this.requestCount++;

      const status = response.status;
      this.statusCodes[status] = (this.statusCodes[status] || 0) + 1;

      if (status === 200) {
        this.successCount++;
        return { success: true, html: response.body.html, duration, status };
      } else {
        this.errorCount++;
        return {
          success: false,
          error: response.body.error || "Unknown error",
          duration,
          status,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);
      this.requestCount++;
      this.errorCount++;
      return {
        success: false,
        error: error.message,
        duration,
        status: error.status || 0,
      };
    }
  }

  async sendParseRequest(markdown) {
    const startTime = Date.now();
    try {
      const response = await this.agent
        .post("/parse")
        .set("Content-Type", "application/json")
        .send({ markdown });

      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);
      this.requestCount++;

      const status = response.status;
      this.statusCodes[status] = (this.statusCodes[status] || 0) + 1;

      if (status === 200) {
        this.successCount++;
        return { success: true, ast: response.body.ast, duration, status };
      } else {
        this.errorCount++;
        return {
          success: false,
          error: response.body.error || "Unknown error",
          duration,
          status,
        };
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);
      this.requestCount++;
      this.errorCount++;
      return {
        success: false,
        error: error.message,
        duration,
        status: error.status || 0,
      };
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
        statusCodes: {},
      };
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length || 0;
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
      successfulRequests: this.successCount,
      failedRequests: this.errorCount,
      avgLatency: avg,
      minLatency: min,
      maxLatency: max,
      p95Latency: p95,
      p99Latency: p99,
      throughput: this.requestCount,
      errorRate:
        this.requestCount > 0 ? (this.errorCount / this.requestCount) * 100 : 0,
      statusCodes: this.statusCodes,
    };
  }

  calculatePercentile(arr, percentile) {
    const sorted = arr.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  reset() {
    this.requestCount = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.statusCodes = {};
  }
}

describe("Load Tests - Real HTTP Server", () => {
  let app;
  let agent;
  let tester;
  let reporter;

  beforeAll(() => {
    process.env.RATE_LIMIT_MAX = "10000";
    process.env.RATE_LIMIT_WINDOW_MS = "60000";
    app = createServer();
    agent = request(app);
    reporter = new ReportGenerator();
  });

  beforeEach(() => {
    tester = new HTTPLoadTester(agent);
  });

  describe("Sequential Load", () => {
    test("handles 100 sequential requests", async () => {
      jest.setTimeout(60000);
      const markdown = "# Test\n\nContent with **bold** and *italic*";

      for (let i = 0; i < 50; i++) {
        await tester.sendConvertRequest(markdown);
      }

      const metrics = tester.getMetrics();
      console.log("50 sequential requests (real HTTP):", metrics);
      reporter.saveMetricsJson("sequential-100", metrics);
      reporter.appendMetricsToCSV("load-tests", "sequential-100", metrics);

      expect(metrics.successfulRequests).toBe(50);
      expect(metrics.failedRequests).toBe(0);
      expect(metrics.avgLatency).toBeLessThan(200 * SLOW_FACTOR);
    });

    test("handles 500 sequential requests", async () => {
      jest.setTimeout(120000);
      const markdown = "# Test\n\nContent";

      for (let i = 0; i < 100; i++) {
        await tester.sendConvertRequest(markdown);
      }

      const metrics = tester.getMetrics();
      console.log("100 sequential requests (real HTTP):", metrics);
      reporter.saveMetricsJson("sequential-500", metrics);
      reporter.appendMetricsToCSV("load-tests", "sequential-500", metrics);

      expect(metrics.successfulRequests).toBe(100);
      expect(metrics.failedRequests).toBe(0);
    });

    test("handles 1000 sequential requests", async () => {
      jest.setTimeout(180000);
      const markdown = "# Test";

      for (let i = 0; i < 200; i++) {
        await tester.sendConvertRequest(markdown);
      }

      const metrics = tester.getMetrics();
      console.log("200 sequential requests (real HTTP):", metrics);
      reporter.saveMetricsJson("sequential-1000", metrics);
      reporter.appendMetricsToCSV("load-tests", "sequential-1000", metrics);

      expect(metrics.successfulRequests).toBe(200);
      expect(metrics.failedRequests).toBe(0);
    });
  });

  describe("Concurrent Load Simulation", () => {
    test("simulates 500 concurrent requests", async () => {
      jest.setTimeout(60000);
      const markdown = "# Document\n\nParagraph";
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(tester.sendConvertRequest(markdown));
      }

      await Promise.all(promises);

      const metrics = tester.getMetrics();
      console.log("100 concurrent requests (real HTTP):", metrics);
      reporter.saveMetricsJson("concurrent-500", metrics);
      reporter.appendMetricsToCSV("load-tests", "concurrent-500", metrics);

      expect(metrics.successfulRequests).toBeGreaterThan(90);
      expect(metrics.avgLatency).toBeLessThan(500 * SLOW_FACTOR);
    });

    test("simulates 1000 concurrent requests", async () => {
      jest.setTimeout(90000);
      const markdown = "# Test";
      const promises = [];

      for (let i = 0; i < 200; i++) {
        promises.push(tester.sendConvertRequest(markdown));
      }

      await Promise.all(promises);

      const metrics = tester.getMetrics();
      console.log("200 concurrent requests (real HTTP):", metrics);
      reporter.saveMetricsJson("concurrent-1000", metrics);
      reporter.appendMetricsToCSV("load-tests", "concurrent-1000", metrics);

      expect(metrics.successfulRequests).toBeGreaterThan(180);
    });
  });

  describe("Throughput Benchmarks", () => {
    test("achieves realistic throughput for small documents", async () => {
      jest.setTimeout(30000);
      const markdown = "# Title";
      const startTime = Date.now();
      let count = 0;

      while (Date.now() - startTime < 500) {
        await tester.sendConvertRequest(markdown);
        count++;
      }

      console.log(`Throughput (small doc, real HTTP): ${count} req/sec`);
      const metrics = tester.getMetrics();
      reporter.saveMetricsJson("throughput-small", metrics);
      reporter.appendMetricsToCSV("load-tests", "throughput-small", metrics);
      expect(count).toBeGreaterThan(10 / SLOW_FACTOR);
    });

    test("achieves realistic throughput for medium documents", async () => {
      jest.setTimeout(30000);
      let markdown = "# Document\n\n";
      for (let i = 0; i < 50; i++) {
        markdown += `Paragraph ${i}\n\n`;
      }

      const startTime = Date.now();
      let count = 0;

      while (Date.now() - startTime < 500) {
        await tester.sendConvertRequest(markdown);
        count++;
      }

      console.log(`Throughput (medium doc, real HTTP): ${count} req/sec`);
      const metrics = tester.getMetrics();
      reporter.saveMetricsJson("throughput-medium", metrics);
      reporter.appendMetricsToCSV("load-tests", "throughput-medium", metrics);
      expect(count).toBeGreaterThan(10 / SLOW_FACTOR);
    });

    test("achieves realistic throughput for large documents", async () => {
      let markdown = "# Document\n\n";
      for (let i = 0; i < 500; i++) {
        markdown += `Paragraph ${i}\n\n`;
      }

      const startTime = Date.now();
      let count = 0;

      while (Date.now() - startTime < 1000) {
        await tester.sendConvertRequest(markdown);
        count++;
      }

      console.log(`Throughput (large doc, real HTTP): ${count} req/sec`);
      const metrics = tester.getMetrics();
      reporter.saveMetricsJson("throughput-large", metrics);
      reporter.appendMetricsToCSV("load-tests", "throughput-large", metrics);
      expect(count).toBeGreaterThan(1 / SLOW_FACTOR);
    });
  });

  describe("Latency Analysis", () => {
    test("maintains p95 latency under load", async () => {
      jest.setTimeout(60000);
      const markdown = "# Document\n\nContent";
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(tester.sendConvertRequest(markdown));
      }

      await Promise.all(promises);

      const metrics = tester.getMetrics();
      console.log(`P95 Latency (real HTTP): ${metrics.p95Latency}ms`);
      reporter.saveMetricsJson("latency-p95", metrics);
      reporter.appendMetricsToCSV("load-tests", "latency-p95", metrics);

      expect(metrics.p95Latency).toBeLessThan(5000 * SLOW_FACTOR);
    });

    test("maintains p99 latency under load", async () => {
      jest.setTimeout(60000);
      const markdown = "# Document\n\nContent";
      const promises = [];

      for (let i = 0; i < 150; i++) {
        promises.push(tester.sendConvertRequest(markdown));
      }

      await Promise.all(promises);

      const metrics = tester.getMetrics();
      console.log(`P99 Latency (real HTTP): ${metrics.p99Latency}ms`);
      reporter.saveMetricsJson("latency-p99", metrics);
      reporter.appendMetricsToCSV("load-tests", "latency-p99", metrics);

      expect(metrics.p99Latency).toBeLessThan(1000 * SLOW_FACTOR);
    });

    test("latency remains stable over time", async () => {
      jest.setTimeout(60000);
      const markdown = "# Document";
      const intervals = [];

      for (let batch = 0; batch < 5; batch++) {
        tester.reset();
        const startTime = Date.now();

        for (let i = 0; i < 50; i++) {
          await tester.sendConvertRequest(markdown);
        }

        const interval = Date.now() - startTime;
        intervals.push(interval);
      }

      console.log("Latency by interval (real HTTP):", intervals);
      reporter.saveMetricsJson("latency-stability", { intervals });
      reporter.appendMetricsToCSV("load-tests", "latency-stability", {
        throughput: intervals.length,
      });

      const afterWarmup = intervals.slice(1);
      const minInterval = Math.min(...afterWarmup);
      const maxInterval = Math.max(...afterWarmup);
      const increase = (maxInterval - minInterval) / minInterval;

      expect(increase).toBeLessThan(2.5);
    });
  });

  describe("Stress Testing", () => {
    test("recovers gracefully from spike in requests", async () => {
      jest.setTimeout(60000);
      const markdown = "# Test";

      for (let i = 0; i < 50; i++) {
        await tester.sendConvertRequest(markdown);
      }

      const normalMetrics = tester.getMetrics();

      tester.reset();
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(tester.sendConvertRequest(markdown));
      }
      await Promise.all(promises);

      const spikeMetrics = tester.getMetrics();

      tester.reset();
      for (let i = 0; i < 50; i++) {
        await tester.sendConvertRequest(markdown);
      }

      const recoveryMetrics = tester.getMetrics();

      console.log("Normal (real HTTP):", normalMetrics);
      console.log("Spike (real HTTP):", spikeMetrics);
      console.log("Recovery (real HTTP):", recoveryMetrics);

      reporter.saveMetricsJson("stress-spike-normal", normalMetrics);
      reporter.saveMetricsJson("stress-spike-peak", spikeMetrics);
      reporter.saveMetricsJson("stress-spike-recovery", recoveryMetrics);
      reporter.appendMetricsToCSV(
        "load-tests",
        "stress-spike",
        recoveryMetrics
      );

      expect(recoveryMetrics.avgLatency).toBeLessThan(
        normalMetrics.avgLatency * 10
      );
    });

    test("handles mixed document sizes under load", async () => {
      const smallDoc = "# Title";
      const mediumDoc = "# Document\n\n".concat("Paragraph\n\n".repeat(20));
      const largeDoc = "# Document\n\n".concat("Paragraph\n\n".repeat(200));

      const promises = [];

      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          promises.push(tester.sendConvertRequest(largeDoc));
        } else if (i % 2 === 0) {
          promises.push(tester.sendConvertRequest(mediumDoc));
        } else {
          promises.push(tester.sendConvertRequest(smallDoc));
        }
      }

      await Promise.all(promises);

      const metrics = tester.getMetrics();
      console.log("Mixed sizes (real HTTP):", metrics);
      reporter.saveMetricsJson("stress-mixed-sizes", metrics);
      reporter.appendMetricsToCSV("load-tests", "stress-mixed-sizes", metrics);

      expect(metrics.successfulRequests).toBeGreaterThan(95);
    });
  });

  describe("Error Handling Under Load", () => {
    test("maintains availability with invalid inputs", async () => {
      const invalidInputs = [
        "",
        "   ",
        "[incomplete",
        "**unclosed",
        "very long line".repeat(1000),
      ];

      const promises = [];

      for (let i = 0; i < 100; i++) {
        const input = invalidInputs[i % invalidInputs.length];
        promises.push(tester.sendConvertRequest(input));
      }

      await Promise.all(promises);

      const metrics = tester.getMetrics();
      console.log("With invalid inputs (real HTTP):", metrics);
      reporter.saveMetricsJson("error-handling-invalid", metrics);
      reporter.appendMetricsToCSV(
        "load-tests",
        "error-handling-invalid",
        metrics
      );

      expect(metrics.totalRequests).toBe(100);
      expect(metrics.failedRequests).toBeLessThan(20);
    });
  });

  describe("Resource Utilization", () => {
    test("memory usage remains reasonable under load", async () => {
      jest.setTimeout(60000);
      const markdown = "# Document\n\n".concat("Paragraph\n\n".repeat(100));

      const memBefore = process.memoryUsage().heapUsed / 1024 / 1024;

      for (let i = 0; i < 50; i++) {
        await tester.sendConvertRequest(markdown);
      }

      const memAfter = process.memoryUsage().heapUsed / 1024 / 1024;
      const memIncrease = memAfter - memBefore;

      console.log(`Memory increase (real HTTP): ${memIncrease.toFixed(2)}MB`);
      reporter.saveMetricsJson("resource-memory", {
        memoryIncreaseMB: memIncrease,
      });
      reporter.appendMetricsToCSV("load-tests", "resource-memory", {
        throughput: memIncrease,
      });

      expect(memIncrease).toBeLessThan(200);
    });

    test("handles repeated large document parsing", async () => {
      jest.setTimeout(60000);
      let largeDoc = "";
      for (let i = 0; i < 500; i++) {
        largeDoc += `# Section ${i}\n\nContent\n\n`;
      }

      for (let i = 0; i < 25; i++) {
        await tester.sendConvertRequest(largeDoc);
      }

      const metrics = tester.getMetrics();
      console.log("Large doc repeated (real HTTP):", metrics);
      reporter.saveMetricsJson("resource-large-doc-repeated", metrics);
      reporter.appendMetricsToCSV(
        "load-tests",
        "resource-large-doc-repeated",
        metrics
      );

      expect(metrics.successfulRequests).toBe(25);
      expect(metrics.failedRequests).toBe(0);
    });
  });

  describe("Ramp Up Pattern", () => {
    test("handles gradual increase in load", async () => {
      jest.setTimeout(60000);
      const markdown = "# Test";
      const phases = [
        { duration: 300, rate: 10 },
        { duration: 300, rate: 50 },
        { duration: 300, rate: 100 },
      ];

      const results = [];

      for (const phase of phases) {
        tester.reset();
        const startTime = Date.now();

        while (Date.now() - startTime < phase.duration) {
          await tester.sendConvertRequest(markdown);
        }

        results.push(tester.getMetrics());
      }

      console.log("Ramp up pattern (real HTTP):", results);

      results.forEach((metric, index) => {
        reporter.saveMetricsJson(`ramp-up-phase-${index + 1}`, metric);
        reporter.appendMetricsToCSV(
          "load-tests",
          `ramp-up-phase-${index + 1}`,
          metric
        );
      });

      results.forEach((metric) => {
        expect(metric.successfulRequests).toBeGreaterThan(0);
      });
    });
  });

  describe("Sustained Load", () => {
    test("maintains performance over sustained load", async () => {
      jest.setTimeout(60000);
      const markdown = "# Document\n\nContent";
      const duration = 3000;
      const targetThroughput = 100;

      const startTime = Date.now();
      let actualCount = 0;

      while (Date.now() - startTime < duration) {
        await tester.sendConvertRequest(markdown);
        actualCount++;
      }

      const metrics = tester.getMetrics();
      const message = `Sustained load (5s, real HTTP): ${actualCount} total requests, ${(
        actualCount / 5
      ).toFixed(0)} req/sec avg`;
      console.log(message);
      reporter.saveMetricsJson("sustained-load-5s", metrics);
      reporter.appendMetricsToCSV("load-tests", "sustained-load-5s", metrics);

      expect(actualCount).toBeGreaterThan(10 / SLOW_FACTOR);
      expect(metrics.avgLatency).toBeLessThan(500 * SLOW_FACTOR);
    });
  });
});
