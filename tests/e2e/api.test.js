const request = require("supertest");
const { createServer } = require("../../src/server");

describe("E2E Tests - API Endpoints", () => {
  let server;
  let listener;

  beforeAll((done) => {
    server = createServer();
    listener = server.listen(0, () => done());
  });

  afterAll((done) => {
    if (listener && listener.close) listener.close(done);
    else done();
  });

  describe("POST /convert", () => {
    test("converts markdown to HTML", async () => {
      const markdown = "# Hello\n\nWorld";
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
      expect(res.body.html).toMatch(/<h1[^>]*>/);
      expect(res.body.html).toMatch(/Hello/);
      expect(res.body.html).toMatch(/World/);
    });

    test("handles complex markdown", async () => {
      const markdown = `
# Title

**Bold** and *italic*

- Item 1
- Item 2

\`\`\`js
code
\`\`\`

[Link](url)
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<h1[^>]*>/);
      expect(res.body.html).toMatch(/<strong[^>]*>/);
      expect(res.body.html).toMatch(/<ul[^>]*>/);
      expect(res.body.html).toMatch(/<code[^>]*>/);
      expect(res.body.html).toMatch(/<a[^>]*href[^>]*>/);
    });

    test("handles empty input", async () => {
      const res = await request(server)
        .post("/convert")
        .send({ markdown: "" })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toBe("");
    });

    test("handles whitespace only", async () => {
      const res = await request(server)
        .post("/convert")
        .send({ markdown: "   \n\n   " })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    test("handles special characters", async () => {
      const markdown = 'Text with <html> & special "chars"';
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/&lt;/);
      expect(res.body.html).toMatch(/&gt;/);
      expect(res.body.html).toMatch(/&amp;/);
    });

    test("preserves code block content", async () => {
      const markdown = '```\n<script>alert("xss")</script>\n```';
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/&lt;script/);
      expect(res.body.html).not.toMatch(/<script>alert/);
    });
  });

  describe("POST /validate", () => {
    test("validates correct markdown", async () => {
      const res = await request(server)
        .post("/validate")
        .send({ markdown: "# Title\n\nParagraph" })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("valid");
      expect(res.body.valid).toBe(true);
    });

    test("rejects invalid input", async () => {
      const res = await request(server)
        .post("/validate")
        .send({ markdown: null })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("valid");
      expect(res.body.valid).toBe(false);
    });
  });

  describe("POST /statistics", () => {
    test("returns accurate statistics", async () => {
      const markdown = "# Title\n\n- Item 1\n- Item 2\n\n[Link](url)";
      const res = await request(server)
        .post("/statistics")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("headings");
      expect(res.body.headings).toBe(1);
      expect(res.body).toHaveProperty("links");
      expect(res.body.links).toBe(1);
    });
  });

  describe("Error Handling", () => {
    test("handles large payloads", async () => {
      let markdown = "";
      for (let i = 0; i < 1000; i++) {
        markdown += `# Section ${i}\n\nContent\n\n`;
      }

      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toBeTruthy();
    });

    test("handles deeply nested markdown", async () => {
      const markdown = `
> Quote 1
> > Quote 2
> > > Quote 3
> > > > Quote 4
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<blockquote[^>]*>/);
    });

    test("handles mixed line endings", async () => {
      const markdown = "Line 1\r\nLine 2\rLine 3\nLine 4";
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toBeTruthy();
    });
  });

  describe("Output Consistency", () => {
    test("same input produces same output", async () => {
      const markdown = "# Test\n\nContent with **bold** and *italic*";

      const res1 = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      const res2 = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res1.body.html).toBe(res2.body.html);
    });

    test("whitespace normalization", async () => {
      const md1 = "#  Title  \n\n  Content  ";
      const md2 = "# Title\n\nContent";

      const res1 = await request(server)
        .post("/convert")
        .send({ markdown: md1 })
        .set("Content-Type", "application/json");

      const res2 = await request(server)
        .post("/convert")
        .send({ markdown: md2 })
        .set("Content-Type", "application/json");

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.html).toMatch(/Title/);
      expect(res2.body.html).toMatch(/Title/);
    });

    test("preserves semantic meaning", async () => {
      const markdown = `
# Main
## Sub 1
### Sub 1.1
## Sub 2
# Another Main
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<h1.*?<h2.*?<h3.*?<h2.*?<h1/s);
    });
  });

  describe("Markdown Variants", () => {
    test("GFM tables", async () => {
      const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<table[^>]*>/);
    });

    test("GFM strikethrough", async () => {
      const markdown = "~~deleted text~~";
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<del[^>]*>/);
    });

    test("Task lists (if supported)", async () => {
      const markdown = `
- [x] Task 1
- [ ] Task 2
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toBeTruthy();
    });

    test("Multiple code blocks with different languages", async () => {
      const markdown = `
\`\`\`javascript
const x = 1;
\`\`\`

\`\`\`python
x = 1
\`\`\`

\`\`\`bash
echo $x
\`\`\`
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/language-javascript/);
      expect(res.body.html).toMatch(/language-python/);
      expect(res.body.html).toMatch(/language-bash/);
    });
  });

  describe("Real-world Examples", () => {
    test("GitHub README", async () => {
      const markdown = `
# My Project

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](link)

This is my project.

## Installation

\`\`\`bash
npm install my-project
\`\`\`

## Usage

See [documentation](docs/) for details.

## Contributing

1. Fork
2. Create branch
3. Commit
4. Push
5. Create PR

## License

MIT
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toBeTruthy();
      expect(res.body.html).toMatch(/<h1[^>]*>/);
      expect(res.body.html).toMatch(/<ol[^>]*>/);
      expect(res.body.html).toMatch(/<a[^>]*href[^>]*>/);
    });

    test("API documentation", async () => {
      const markdown = `
# API Documentation

## Endpoints

### GET /users

Returns list of users.

**Query Parameters:**
- \`page\` (number): Page number
- \`limit\` (number): Items per page

**Response:**
\`\`\`json
{
  "users": [],
  "total": 0
}
\`\`\`

### POST /users

Creates a new user.

**Request Body:**
\`\`\`json
{
  "name": "string",
  "email": "string"
}
\`\`\`
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<h1[^>]*>/);
      expect(res.body.html).toMatch(/<h2[^>]*>/);
      expect(res.body.html).toMatch(/<h3[^>]*>/);
      expect(res.body.html).toMatch(/<code[^>]*>/);
    });

    test("Blog post", async () => {
      const markdown = `
# Understanding Markdown Parsers

Published: 2024-01-01

## Introduction

Markdown is great!

## Technical Details

### Parser Architecture

The parser consists of:
- Tokenizer
- AST Builder
- Renderer

### Example

Here's example code:

\`\`\`python
def parse(text):
    return text.upper()
\`\`\`

## Conclusion

Use Markdown!

---

*Written by Author*
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toBeTruthy();
    });

    test("Technical specification", async () => {
      const markdown = `
# Technical Specification

## Overview

| Version | Date | Status |
|---------|------|--------|
| 1.0 | 2024-01-01 | Released |
| 1.1 | 2024-01-15 | Beta |

## Requirements

- Requirement 1
- Requirement 2
- Requirement 3

> Note: Must comply with standards

## Implementation

See code:

\`\`\`
implementation details
\`\`\`
`;
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<table[^>]*>/);
      expect(res.body.html).toMatch(/<ul[^>]*>/);
      expect(res.body.html).toMatch(/<blockquote[^>]*>/);
    });
  });

  describe("Security Tests", () => {
    test("prevents XSS via HTML tags", async () => {
      const markdown = "<img src=x onerror=\"alert('xss')\">";
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).not.toMatch(/onerror/);
    });

    test("prevents XSS via markdown links", async () => {
      const markdown = "[Click me](javascript:alert('xss'))";
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<a[^>]*>/);
      expect(res.body.html).toMatch(/href/);
    });

    test("escapes attribute values", async () => {
      const markdown = '[Link](url"onclick="alert(1))';
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/&quot;|&#34;/);
    });
  });

  describe("Browser Compatibility", () => {
    test("generates valid HTML5", async () => {
      const markdown = "# Title\n\nContent";
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<h1[^>]*>/);
      expect(res.body.html).toMatch(/<\/h1>/);
    });

    test("uses semantic HTML", async () => {
      const markdown = "> Quote\n\n**Bold** and *italic*\n\n- List";
      const res = await request(server)
        .post("/convert")
        .send({ markdown })
        .set("Content-Type", "application/json");

      expect(res.status).toBe(200);
      expect(res.body.html).toMatch(/<blockquote[^>]*>/);
      expect(res.body.html).toMatch(/<strong[^>]*>/);
      expect(res.body.html).toMatch(/<em[^>]*>/);
      expect(res.body.html).toMatch(/<ul[^>]*>/);
    });
  });
});

module.exports = { createServer };
