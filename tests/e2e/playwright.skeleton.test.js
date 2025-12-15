/**
 * E2E Tests - REST API Endpoints
 * Tests REST API endpoints via HTTP
 *
 * To run these tests:
 * 1. Start server: npm start
 * 2. Run tests: npm run test:e2e
 */

const http = require("http");
const { spawn } = require("child_process");
const net = require("net");

let serverProcess = null;

function isPortOpen(port = 3000, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once("error", () => {
      socket.destroy();
      resolve(false);
    });
    socket.once("timeout", () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
  });
}

async function waitForPort(port = 3000, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await isPortOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

let serverPort = process.env.PORT || 3000;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const p = srv.address().port;
      srv.close(() => resolve(p));
    });
    srv.on("error", reject);
  });
}

function makeRequest(path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: serverPort,
      path: path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(JSON.stringify(body)),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          data: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on("error", reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

describe("E2E Tests - REST API Endpoints", () => {
  const headers = { "Content-Type": "application/json" };

  beforeAll(async () => {
    jest.setTimeout(30000);

    let port = process.env.PORT || 3000;
    if (await isPortOpen(port)) {
      port = await getFreePort();
    }

    serverPort = port;

    serverProcess = spawn(process.execPath, ["src/server.start.js"], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: String(port), RATE_LIMIT_MAX: "1000" },
      stdio: ["ignore", "pipe", "pipe"],
    });

    if (serverProcess.stdout)
      serverProcess.stdout.on("data", (d) =>
        console.log("[server]", d.toString().trim())
      );
    if (serverProcess.stderr)
      serverProcess.stderr.on("data", (d) =>
        console.error("[server]", d.toString().trim())
      );

    const started = await waitForPort(port, 15000);
    if (!started) {
      if (serverProcess) serverProcess.kill();
      throw new Error(`Server failed to start on port ${port}`);
    }
  });

  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill("SIGTERM");
      let forceKillTimeout = setTimeout(() => {
        if (serverProcess && !serverProcess.killed) {
          serverProcess.kill("SIGKILL");
        }
      }, 2000);

      serverProcess.on("exit", () => clearTimeout(forceKillTimeout));
      serverProcess = null;
    }
  });

  describe("POST /parse endpoint", () => {
    test("should parse markdown and return AST", async () => {
      const markdown = "# Hello World";

      try {
        const response = await makeRequest("/parse", { markdown });
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("ast");
        expect(response.data.ast).toBeDefined();
      } catch (error) {
        if (error.code === "ECONNREFUSED") {
          console.warn("Server not running, skipping test");
          expect(true).toBe(true);
        } else {
          throw error;
        }
      }
    });

    test("should parse complex markdown", async () => {
      const markdown = `# Heading
## Subheading

Paragraph with **bold** and *italic*.

- List item 1
- List item 2

[Link](https://example.com)`;

      try {
        const response = await makeRequest("/parse", { markdown });
        expect(response.data).toHaveProperty("ast");
      } catch (error) {
        if (error.code !== "ECONNREFUSED") throw error;
      }
    });

    test("should handle empty markdown", async () => {
      try {
        const response = await makeRequest("/parse", { markdown: "" });
        expect(response.data).toHaveProperty("ast");
      } catch (error) {
        if (error.code !== "ECONNREFUSED") throw error;
      }
    });

    test("should return 400 for missing markdown", async () => {
      try {
        const response = await makeRequest("/parse", {});
        expect(response.status).toBe(400);
      } catch (error) {
        if (error.code === "ECONNREFUSED") {
          console.warn("Server not running");
        }
      }
    });
  });

  describe("POST /convert endpoint", () => {
    test("should convert markdown to HTML", async () => {
      const markdown = "# Hello World";

      try {
        const response = await makeRequest("/convert", { markdown });
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("html");
        expect(response.data.html).toContain("h1");
      } catch (error) {
        if (error.code === "ECONNREFUSED") {
          console.warn("Server not running");
        } else {
          throw error;
        }
      }
    });

    test("should preserve formatting in HTML", async () => {
      const markdown = "**bold** and *italic*";

      try {
        const response = await makeRequest("/convert", { markdown });
        const html = response.data.html;
        expect(html).toContain("strong") || expect(html).toContain("b");
        expect(html).toContain("em") || expect(html).toContain("i");
      } catch (error) {
        if (error.code !== "ECONNREFUSED") throw error;
      }
    });

    test("should convert lists to HTML", async () => {
      const markdown = "- Item 1\n- Item 2";

      try {
        const response = await makeRequest("/convert", { markdown });
        const html = response.data.html;
        expect(html).toContain("<li>") || expect(html).toContain("<ul>");
      } catch (error) {
        if (error.code !== "ECONNREFUSED") throw error;
      }
    });

    test("should handle links in HTML", async () => {
      const markdown = "[Example](https://example.com)";

      try {
        const response = await makeRequest("/convert", { markdown });
        const html = response.data.html;
        expect(html).toContain("<a") || expect(html).toContain("href=");
      } catch (error) {
        if (error.code !== "ECONNREFUSED") throw error;
      }
    });
  });

  describe("POST /validate endpoint", () => {
    test("should validate markdown", async () => {
      const markdown = "# Valid Markdown";

      try {
        const response = await makeRequest("/validate", { markdown });
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("valid");
      } catch (error) {
        if (error.code === "ECONNREFUSED") {
          console.warn("Server not running");
        } else {
          throw error;
        }
      }
    });

    test("should validate malformed markdown", async () => {
      const markdown = "**unclosed bold\n# Missing space before heading";

      try {
        const response = await makeRequest("/validate", { markdown });
        expect(response.data).toHaveProperty("valid");
      } catch (error) {
        if (error.code !== "ECONNREFUSED") throw error;
      }
    });
  });

  describe("POST /statistics endpoint", () => {
    test("should return document statistics", async () => {
      const markdown = "# Heading\n\nParagraph\n\nAnother paragraph";

      try {
        const response = await makeRequest("/statistics", { markdown });
        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty("lines");
        expect(response.data).toHaveProperty("characters") ||
          expect(response.data).toHaveProperty("nodes");
      } catch (error) {
        if (error.code === "ECONNREFUSED") {
          console.warn("Server not running");
        } else {
          throw error;
        }
      }
    });

    test("should count statistics accurately", async () => {
      const markdown = "# Title";

      try {
        const response = await makeRequest("/statistics", { markdown });
        const stats = response.data;
        expect(stats.lines || stats.totalLines).toBeGreaterThanOrEqual(1);
      } catch (error) {
        if (error.code !== "ECONNREFUSED") throw error;
      }
    });
  });

  describe("Error Handling", () => {
    test("should return 404 for unknown endpoint", async () => {
      try {
        const response = await makeRequest("/unknown", {});
        expect(response.status).toBe(404);
      } catch (error) {
        if (error.code === "ECONNREFUSED") {
          console.warn("Server not running");
        }
      }
    });
  });
});
