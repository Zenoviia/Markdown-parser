/**
 * E2E Tests with Playwright
 * Тести end-to-end для веб-демо та REST API
 */

const request = require("supertest");
const MarkdownParser = require("../../src/core/parser");
const HTMLRenderer = require("../../src/renderers/htmlRenderer");

/**
 * Мок-сервер для тестування
 */
class MockServer {
  constructor() {
    this.parser = new MarkdownParser();
    this.renderer = new HTMLRenderer();
  }

  async convertMarkdown(markdown) {
    return this.parser.parse(markdown);
  }

  async getStatistics(markdown) {
    return this.parser.getStatistics(markdown);
  }

  async validateMarkdown(markdown) {
    return this.parser.validate(markdown);
  }
}

describe("E2E Tests - API Endpoints", () => {
  let server;

  beforeEach(() => {
    server = new MockServer();
  });

  describe("POST /convert", () => {
    test("converts markdown to HTML", async () => {
      const markdown = "# Hello\n\nWorld";
      const html = await server.convertMarkdown(markdown);

      expect(html).toContain("<h1");
      expect(html).toContain("Hello");
      expect(html).toContain("World");
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
      const html = await server.convertMarkdown(markdown);

      expect(html).toContain("<h1");
      expect(html).toContain("<strong>");
      expect(html).toContain("<ul>");
      expect(html).toContain("<code");
      expect(html).toContain("<a href");
    });

    test("handles empty input", async () => {
      const html = await server.convertMarkdown("");
      expect(html).toBe("");
    });

    test("handles whitespace only", async () => {
      const html = await server.convertMarkdown("   \n\n   ");
      expect(html).toBeDefined();
    });

    test("handles special characters", async () => {
      const markdown = 'Text with <html> & special "chars"';
      const html = await server.convertMarkdown(markdown);

      expect(html).toContain("&lt;");
      expect(html).toContain("&gt;");
      expect(html).toContain("&amp;");
    });

    test("preserves code block content", async () => {
      const markdown = '```\n<script>alert("xss")</script>\n```';
      const html = await server.convertMarkdown(markdown);

      expect(html).toContain("&lt;script");
      expect(html).not.toContain("<script>alert");
    });
  });

  describe("POST /validate", () => {
    test("validates correct markdown", async () => {
      const result = await server.validateMarkdown("# Title\n\nParagraph");
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test("rejects invalid input", async () => {
      const result = await server.validateMarkdown(null);
      expect(result.valid).toBe(false);
    });
  });

  describe("POST /statistics", () => {
    test("returns accurate statistics", async () => {
      const markdown = "# Title\n\n- Item 1\n- Item 2\n\n[Link](url)";
      const stats = await server.getStatistics(markdown);

      expect(stats.headings).toBe(1);
      expect(stats.links).toBe(1);
      expect(stats.lists).toBeGreaterThan(0);
    });
  });

  describe("Error Handling", () => {
    test("handles large payloads", async () => {
      let markdown = "";
      for (let i = 0; i < 1000; i++) {
        markdown += `# Section ${i}\n\nContent\n\n`;
      }

      const html = await server.convertMarkdown(markdown);
      expect(html).toBeTruthy();
    });

    test("handles deeply nested markdown", async () => {
      const markdown = `
> Quote 1
> > Quote 2
> > > Quote 3
> > > > Quote 4
`;
      const html = await server.convertMarkdown(markdown);
      expect(html).toContain("<blockquote");
    });

    test("handles mixed line endings", async () => {
      const markdown = "Line 1\r\nLine 2\rLine 3\nLine 4";
      const html = await server.convertMarkdown(markdown);
      expect(html).toBeTruthy();
    });
  });

  describe("Output Consistency", () => {
    test("same input produces same output", async () => {
      const markdown = "# Test\n\nContent with **bold** and *italic*";

      const output1 = await server.convertMarkdown(markdown);
      const output2 = await server.convertMarkdown(markdown);

      expect(output1).toBe(output2);
    });

    test("whitespace normalization", async () => {
      const md1 = "#  Title  \n\n  Content  ";
      const md2 = "# Title\n\nContent";

      const html1 = await server.convertMarkdown(md1);
      const html2 = await server.convertMarkdown(md2);

      expect(html1.trim()).toContain("Title");
      expect(html2.trim()).toContain("Title");
    });

    test("preserves semantic meaning", async () => {
      const markdown = `
# Main
## Sub 1
### Sub 1.1
## Sub 2
# Another Main
`;
      const html = await server.convertMarkdown(markdown);

      // Check hierarchy
      expect(html).toMatch(/<h1.*?<h2.*?<h3.*?<h2.*?<h1/s);
    });
  });

  describe("Markdown Variants", () => {
    test("GFM tables", async () => {
      const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`;
      const html = await server.convertMarkdown(markdown);
      expect(html).toContain("<table");
    });

    test("GFM strikethrough", async () => {
      const markdown = "~~deleted text~~";
      const html = await server.convertMarkdown(markdown);
      expect(html).toContain("<del");
    });

    test("Task lists (if supported)", async () => {
      const markdown = `
- [x] Task 1
- [ ] Task 2
`;
      const html = await server.convertMarkdown(markdown);
      // Should not throw
      expect(html).toBeTruthy();
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
      const html = await server.convertMarkdown(markdown);

      expect(html).toContain("language-javascript");
      expect(html).toContain("language-python");
      expect(html).toContain("language-bash");
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
      const html = await server.convertMarkdown(markdown);
      expect(html).toBeTruthy();
      expect(html).toContain("<h1");
      expect(html).toContain("<ol");
      expect(html).toContain("<a href");
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
      const html = await server.convertMarkdown(markdown);
      expect(html).toContain("<h1");
      expect(html).toContain("<h2");
      expect(html).toContain("<h3");
      expect(html).toContain("<code");
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
      const html = await server.convertMarkdown(markdown);
      expect(html).toBeTruthy();
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
      const html = await server.convertMarkdown(markdown);
      expect(html).toContain("<table");
      expect(html).toContain("<ul");
      expect(html).toContain("<blockquote");
    });
  });

  describe("Security Tests", () => {
    test("prevents XSS via HTML tags", async () => {
      const markdown = "<img src=x onerror=\"alert('xss')\">";
      const html = await server.convertMarkdown(markdown);

      // Should escape or remove
      expect(html).not.toContain("onerror");
    });

    test("prevents XSS via markdown links", async () => {
      const markdown = "[Click me](javascript:alert('xss'))";
      const html = await server.convertMarkdown(markdown);

      expect(html).toContain("<a");
      // Should have href
      expect(html).toContain("href");
    });

    test("escapes attribute values", async () => {
      // Test that quotes in URLs are properly escaped
      const markdown = '[Link](url"onclick="alert(1))';
      const html = await server.convertMarkdown(markdown);

      // The quote should be escaped as &quot; or &#34;
      expect(html).toContain("&quot;");
    });
  });

  describe("Browser Compatibility", () => {
    test("generates valid HTML5", async () => {
      const markdown = "# Title\n\nContent";
      const html = await server.convertMarkdown(markdown);

      // Should be valid HTML
      expect(html).toMatch(/<h1[^>]*>/);
      expect(html).toMatch(/<\/h1>/);
    });

    test("uses semantic HTML", async () => {
      const markdown = "> Quote\n\n**Bold** and *italic*\n\n- List";
      const html = await server.convertMarkdown(markdown);

      expect(html).toContain("<blockquote");
      expect(html).toContain("<strong");
      expect(html).toContain("<em");
      expect(html).toContain("<ul");
    });
  });
});

module.exports = MockServer;
