const fs = require("fs");
const path = require("path");

class ReportGenerator {
  constructor(reportDir = "reports", saveJSON = true) {
    this.reportDir = reportDir;

    this.saveJSON = saveJSON && process.env.DISABLE_JSON_REPORTS !== "true";
    this.ensureReportDirectory();
  }

  ensureReportDirectory() {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Save metrics to JSON file (enabled by default, can be disabled with DISABLE_JSON_REPORTS=true)
   * @param {string} testName - Name of the test
   * @param {Object} metrics - Metrics object to save
   * @param {string} timestamp - Timestamp for the test run
   * @returns {string|null} Path to saved file, or null if JSON saving disabled
   */
  saveMetricsJson(testName, metrics, timestamp = new Date().toISOString()) {
    if (!this.saveJSON) {
      return null;
    }

    const filename = `${testName}_${Date.now()}.json`;
    const filepath = path.join(this.reportDir, filename);

    const report = {
      testName,
      timestamp,
      metrics,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cpus: require("os").cpus().length,
        totalMemory: require("os").totalmem(),
        freeMemory: require("os").freemem(),
      },
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    return filepath;
  }

  /**
   * Save multiple test results as JSON array
   * @param {string} suiteName - Name of the test suite
   * @param {Array} results - Array of test results
   * @returns {string} Path to saved file
   */
  saveTestSuiteJson(suiteName, results) {
    const timestamp = new Date().toISOString();
    const filename = `${suiteName}_suite_${Date.now()}.json`;
    const filepath = path.join(this.reportDir, filename);

    const report = {
      suiteName,
      timestamp,
      testCount: results.length,
      results,
      summary: {
        totalTests: results.length,
        passedTests: results.filter((r) => r.passed).length,
        failedTests: results.filter((r) => !r.passed).length,
        averageMetrics: this.calculateAverageMetrics(results),
      },
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    return filepath;
  }

  /**
   * Convert metrics to CSV format
   * @param {string} testName - Name of the test
   * @param {Object} metrics - Metrics object
   * @returns {string} CSV formatted string
   */
  metricsToCSV(testName, metrics) {
    const headers = [
      "Test Name",
      "Timestamp",
      "Total Requests",
      "Successful Requests",
      "Failed Requests",
      "Error Rate (%)",
      "Average Latency (ms)",
      "Min Latency (ms)",
      "Max Latency (ms)",
      "P95 Latency (ms)",
      "P99 Latency (ms)",
      "Throughput (req/sec)",
    ];

    const values = [
      testName,
      new Date().toISOString(),
      metrics.totalRequests || 0,
      metrics.successfulRequests || 0,
      metrics.failedRequests || 0,
      (metrics.errorRate || 0).toFixed(2),
      (metrics.avgLatency || 0).toFixed(2),
      (metrics.minLatency || 0).toFixed(2),
      (metrics.maxLatency || 0).toFixed(2),
      (metrics.p95Latency || 0).toFixed(2),
      (metrics.p99Latency || 0).toFixed(2),
      (metrics.throughput || 0).toFixed(2),
    ];

    return headers.join(",") + "\n" + values.join(",");
  }

  /**
   * Save metrics as CSV file
   * @param {string} testName - Name of the test
   * @param {Object} metrics - Metrics object
   * @returns {string} Path to saved file
   */
  saveMetricsCSV(testName, metrics) {
    const filename = `${testName}_${Date.now()}.csv`;
    const filepath = path.join(this.reportDir, filename);
    const csv = this.metricsToCSV(testName, metrics);

    const fileExists = fs.existsSync(filepath);
    if (fileExists) {
      fs.appendFileSync(filepath, "\n" + csv.split("\n")[1]);
    } else {
      fs.writeFileSync(filepath, csv);
    }

    return filepath;
  }

  /**
   * Append metrics to aggregated CSV file
   * @param {string} filename - CSV filename (without extension)
   * @param {string} testName - Name of the test
   * @param {Object} metrics - Metrics object
   * @returns {string} Path to saved file
   */
  appendMetricsToCSV(filename, testName, metrics) {
    const filepath = path.join(this.reportDir, `${filename}.csv`);
    const csv = this.metricsToCSV(testName, metrics);
    const lines = csv.split("\n");

    if (!fs.existsSync(filepath)) {
      fs.writeFileSync(filepath, lines.join("\n"));
    } else {
      fs.appendFileSync(filepath, "\n" + lines[1]);
    }

    return filepath;
  }

  /**
   * Calculate average metrics from multiple test results
   * @param {Array} results - Array of test results with metrics
   * @returns {Object} Average metrics
   */
  calculateAverageMetrics(results) {
    if (results.length === 0) return {};

    const sum = {
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

    results.forEach((result) => {
      const metrics = result.metrics || {};
      sum.totalRequests += metrics.totalRequests || 0;
      sum.successfulRequests += metrics.successfulRequests || 0;
      sum.failedRequests += metrics.failedRequests || 0;
      sum.avgLatency += metrics.avgLatency || 0;
      sum.minLatency += metrics.minLatency || 0;
      sum.maxLatency += metrics.maxLatency || 0;
      sum.p95Latency += metrics.p95Latency || 0;
      sum.p99Latency += metrics.p99Latency || 0;
      sum.throughput += metrics.throughput || 0;
      sum.errorRate += metrics.errorRate || 0;
    });

    const avg = {};
    const count = results.length;

    Object.keys(sum).forEach((key) => {
      avg[key] = sum[key] / count;
    });

    return avg;
  }

  /**
   * Read JSON report file
   * @param {string} filename - Filename to read
   * @returns {Object} Parsed JSON report
   */
  readJsonReport(filename) {
    const filepath = path.join(this.reportDir, filename);
    const content = fs.readFileSync(filepath, "utf8");
    return JSON.parse(content);
  }

  /**
   * Clean up old report files (keeps only CSV and recent files)
   * @param {number} keepDays - Keep JSON files from last N days (default: 7)
   * @returns {Object} Summary of cleanup {removed: number, kept: number}
   */
  cleanupOldReports(keepDays = 7) {
    if (!fs.existsSync(this.reportDir)) {
      return { removed: 0, kept: 0 };
    }

    const files = fs.readdirSync(this.reportDir);
    const cutoffTime = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    let removed = 0;
    let kept = 0;

    files.forEach((file) => {
      const filepath = path.join(this.reportDir, file);
      const stat = fs.statSync(filepath);

      if (file.endsWith(".csv")) {
        kept++;
        return;
      }

      if (file.endsWith(".html")) {
        kept++;
        return;
      }

      if (file === "README.md") {
        kept++;
        return;
      }

      if (stat.mtimeMs < cutoffTime) {
        fs.unlinkSync(filepath);
        removed++;
      } else {
        kept++;
      }
    });

    return { removed, kept };
  }

  /**
   * Delete all JSON report files (keep CSV and documentation)
   * @returns {number} Number of files deleted
   */
  deleteAllJsonReports() {
    if (!fs.existsSync(this.reportDir)) {
      return 0;
    }

    const files = fs.readdirSync(this.reportDir);
    let deleted = 0;

    files.forEach((file) => {
      if (file.endsWith(".json")) {
        const filepath = path.join(this.reportDir, file);
        fs.unlinkSync(filepath);
        deleted++;
      }
    });

    return deleted;
  }

  /**
   * Archive old report files to a subdirectory
   * @param {string} archiveDir - Archive directory name (default: 'archive')
   * @param {number} keepDays - Keep JSON files from last N days
   * @returns {Object} Summary of archival {archived: number, kept: number}
   */
  archiveOldReports(archiveDir = "archive", keepDays = 7) {
    if (!fs.existsSync(this.reportDir)) {
      return { archived: 0, kept: 0 };
    }

    const archivePath = path.join(this.reportDir, archiveDir);
    if (!fs.existsSync(archivePath)) {
      fs.mkdirSync(archivePath, { recursive: true });
    }

    const files = fs.readdirSync(this.reportDir);
    const cutoffTime = Date.now() - keepDays * 24 * 60 * 60 * 1000;
    let archived = 0;
    let kept = 0;

    files.forEach((file) => {
      if (file === archiveDir) return;

      const filepath = path.join(this.reportDir, file);
      const stat = fs.statSync(filepath);

      if (file.endsWith(".json") && stat.mtimeMs < cutoffTime) {
        const archiveFilePath = path.join(archivePath, file);
        fs.renameSync(filepath, archiveFilePath);
        archived++;
      } else {
        kept++;
      }
    });

    return { archived, kept };
  }

  /**
   * Get report statistics
   * @returns {Object} Statistics about reports
   */
  getReportStats() {
    if (!fs.existsSync(this.reportDir)) {
      return {
        totalFiles: 0,
        csvFiles: 0,
        jsonFiles: 0,
        htmlFiles: 0,
        totalSizeKB: 0,
      };
    }

    const files = fs.readdirSync(this.reportDir);
    let csvFiles = 0;
    let jsonFiles = 0;
    let htmlFiles = 0;
    let totalSize = 0;

    files.forEach((file) => {
      const filepath = path.join(this.reportDir, file);
      const stat = fs.statSync(filepath);
      totalSize += stat.size;

      if (file.endsWith(".csv")) csvFiles++;
      else if (file.endsWith(".json")) jsonFiles++;
      else if (file.endsWith(".html")) htmlFiles++;
    });

    return {
      totalFiles: files.length,
      csvFiles,
      jsonFiles,
      htmlFiles,
      totalSizeKB: (totalSize / 1024).toFixed(2),
    };
  }

  /**
   * Generate HTML report from JSON results
   * @param {string} jsonFilename - JSON report filename
   * @returns {string} HTML report content
   */
  generateHtmlReport(jsonFilename) {
    const report = this.readJsonReport(jsonFilename);
    const metrics = report.metrics;
    const env = report.environment;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Load Test Report - ${report.testName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 10px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      overflow: hidden;
    }
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
    }
    header h1 {
      margin-bottom: 10px;
      font-size: 2em;
    }
    .timestamp {
      opacity: 0.9;
      font-size: 0.9em;
    }
    .content {
      padding: 30px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .metric-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .metric-card.success { border-left-color: #10b981; }
    .metric-card.warning { border-left-color: #f59e0b; }
    .metric-card.error { border-left-color: #ef4444; }
    .metric-label {
      font-size: 0.85em;
      color: #6b7280;
      margin-bottom: 8px;
      font-weight: 500;
    }
    .metric-value {
      font-size: 1.8em;
      font-weight: bold;
      color: #1f2937;
    }
    .metric-unit {
      font-size: 0.8em;
      color: #9ca3af;
      margin-left: 5px;
    }
    .section {
      margin-top: 30px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
    }
    .section h2 {
      font-size: 1.3em;
      margin-bottom: 15px;
      color: #1f2937;
    }
    .table-wrapper {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      background: #f3f4f6;
      padding: 12px;
      text-align: left;
      font-weight: 600;
      color: #374151;
      border-bottom: 2px solid #d1d5db;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e5e7eb;
    }
    tr:hover {
      background: #f9fafb;
    }
    footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>📊 Load Test Report</h1>
      <div class="timestamp">Test: ${report.testName}</div>
      <div class="timestamp">Generated: ${new Date(
        report.timestamp
      ).toLocaleString()}</div>
    </header>
    
    <div class="content">
      <div class="metrics-grid">
        <div class="metric-card success">
          <div class="metric-label">Successful Requests</div>
          <div class="metric-value">${
            metrics.successfulRequests || 0
          }<span class="metric-unit">req</span></div>
        </div>
        <div class="metric-card error">
          <div class="metric-label">Failed Requests</div>
          <div class="metric-value">${
            metrics.failedRequests || 0
          }<span class="metric-unit">req</span></div>
        </div>
        <div class="metric-card warning">
          <div class="metric-label">Error Rate</div>
          <div class="metric-value">${(metrics.errorRate || 0).toFixed(
            2
          )}<span class="metric-unit">%</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Average Latency</div>
          <div class="metric-value">${(metrics.avgLatency || 0).toFixed(
            2
          )}<span class="metric-unit">ms</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">P95 Latency</div>
          <div class="metric-value">${(metrics.p95Latency || 0).toFixed(
            2
          )}<span class="metric-unit">ms</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">P99 Latency</div>
          <div class="metric-value">${(metrics.p99Latency || 0).toFixed(
            2
          )}<span class="metric-unit">ms</span></div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Throughput</div>
          <div class="metric-value">${(metrics.throughput || 0).toFixed(
            0
          )}<span class="metric-unit">req/s</span></div>
        </div>
      </div>

      <div class="section">
        <h2>Detailed Metrics</h2>
        <div class="table-wrapper">
          <table>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
            <tr>
              <td>Total Requests</td>
              <td>${metrics.totalRequests || 0}</td>
            </tr>
            <tr>
              <td>Successful Requests</td>
              <td>${metrics.successfulRequests || 0}</td>
            </tr>
            <tr>
              <td>Failed Requests</td>
              <td>${metrics.failedRequests || 0}</td>
            </tr>
            <tr>
              <td>Min Latency</td>
              <td>${(metrics.minLatency || 0).toFixed(2)} ms</td>
            </tr>
            <tr>
              <td>Max Latency</td>
              <td>${(metrics.maxLatency || 0).toFixed(2)} ms</td>
            </tr>
            <tr>
              <td>Average Latency</td>
              <td>${(metrics.avgLatency || 0).toFixed(2)} ms</td>
            </tr>
            <tr>
              <td>P95 Latency</td>
              <td>${(metrics.p95Latency || 0).toFixed(2)} ms</td>
            </tr>
            <tr>
              <td>P99 Latency</td>
              <td>${(metrics.p99Latency || 0).toFixed(2)} ms</td>
            </tr>
            <tr>
              <td>Throughput</td>
              <td>${(metrics.throughput || 0).toFixed(2)} req/sec</td>
            </tr>
            <tr>
              <td>Error Rate</td>
              <td>${(metrics.errorRate || 0).toFixed(2)} %</td>
            </tr>
          </table>
        </div>
      </div>

      <div class="section">
        <h2>Environment Information</h2>
        <div class="table-wrapper">
          <table>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
            <tr>
              <td>Node.js Version</td>
              <td>${env.nodeVersion}</td>
            </tr>
            <tr>
              <td>Platform</td>
              <td>${env.platform}</td>
            </tr>
            <tr>
              <td>Architecture</td>
              <td>${env.arch}</td>
            </tr>
            <tr>
              <td>CPU Cores</td>
              <td>${env.cpus}</td>
            </tr>
            <tr>
              <td>Total Memory</td>
              <td>${(env.totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB</td>
            </tr>
            <tr>
              <td>Free Memory at Test Time</td>
              <td>${(env.freeMemory / 1024 / 1024).toFixed(2)} MB</td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <footer>
      Generated by Markdown Parser Load Test Suite
    </footer>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Save HTML report
   * @param {string} jsonFilename - JSON report filename
   * @returns {string} Path to saved HTML file
   */
  saveHtmlReport(jsonFilename) {
    const baseName = jsonFilename.replace(/\.json$/, "");
    const htmlFilepath = path.join(this.reportDir, `${baseName}.html`);
    const html = this.generateHtmlReport(jsonFilename);
    fs.writeFileSync(htmlFilepath, html);
    return htmlFilepath;
  }
}

module.exports = ReportGenerator;
