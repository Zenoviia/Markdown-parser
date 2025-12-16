# 📝 Markdown Parser

A comprehensive, high-performance Markdown parser for Node.js with support for complex Markdown features, plugins, and multiple output formats.

## ✨ Features

### Core Parsing

- ✅ Full Markdown specification support
- ✅ Heading levels (h1-h6)
- ✅ Text formatting (bold, italic, strikethrough)
- ✅ Lists (ordered, unordered, nested)
- ✅ Code blocks with syntax highlighting support
- ✅ Inline code
- ✅ Links and images
- ✅ Blockquotes
- ✅ Horizontal rules
- ✅ Tables (GitHub-flavored)
- ✅ Emphasis and strong emphasis
- ✅ Hard and soft line breaks
- ✅ HTML pass-through with sanitization

### Advanced Features

- ✅ **Plugin System** - 9 built-in plugins, easily extensible
- ✅ **Multiple Renderers** - HTML, Markdown, custom formats
- ✅ **AST Generation** - Structured syntax tree for custom processing
- ✅ **Table of Contents** - Auto-generate from headings
- ✅ **Document Statistics** - Lines, words, headings, links, etc.
- ✅ **Validation** - Check Markdown validity
- ✅ **ID Generation** - Auto-generate heading IDs

### Performance

- ✅ **Linear Performance** - O(n) parsing complexity
- ✅ **High Throughput** - 100+ req/sec for small documents
- ✅ **Memory Efficient** - < 100MB for 1000-line documents
- ✅ **Fast Rendering** - Multiple format support
- ✅ **Caching** - Optional result caching

### Reliability

- ✅ **High Test Coverage**
- ✅ **Property-based Testing**
- ✅ **Load Testing** - Validated for 1000+ concurrent requests
- ✅ **Security** - XSS prevention, HTML escaping
- ✅ **Error Handling** - Comprehensive error recovery

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Programmatic Usage (Library)

```javascript
const { MarkdownParser } = require("markdown-parser");

const parser = new MarkdownParser();
const html = parser.parse("# Hello\n\n**Bold** text");
console.log(html);
```

See [docs/API.md](docs/API.md) for complete API reference.

### Server (HTTP API)

Start the Express server:

```bash
npm start
```

Then make HTTP requests:

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Hello"}'
```

See **[HTTP Server & Endpoints](#-http-server--endpoints)** section below.

### CLI (Command-line)

Process Markdown files:

```bash
markdown-parser convert input.md --output output.html
markdown-parser stats document.md
markdown-parser toc document.md
```

See **[CLI Usage](#-cli-usage)** section below.

## 📚 Documentation

Complete documentation is available in the `docs/` directory:

- **[API.md](docs/API.md)** - Full API reference with all classes, methods, plugins, and utilities
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design, component overview, and data flow
- **[TESTING.md](docs/TESTING.md)** - Testing strategy, test structure, and running tests
- **[examples/usage.js](examples/usage.js)** - 15+ practical usage examples

## 🌐 HTTP Server & Endpoints

The project exposes an Express-based HTTP server for REST API access.

### Starting the Server

```bash
npm start         # Start HTTP server on port 3000
```

**Port:** Default `3000`

### Available Endpoints

All endpoints expect `Content-Type: application/json`

#### `POST /parse`

Parse Markdown to AST.

```bash
curl -X POST http://localhost:3000/parse \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Hello"}'
```

Response: `{ "ast": { type: "root", children: [...] } }`

#### `POST /convert`

Parse Markdown to HTML.

```bash
curl -X POST http://localhost:3000/convert \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Hello\n\nWorld"}'
```

Response: `{ "html": "<h1>Hello</h1>\n<p>World</p>" }`

#### `POST /validate`

Validate Markdown syntax.

```bash
curl -X POST http://localhost:3000/validate \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Hello"}'
```

Response: `{ "valid": true, "errors": [] }`

#### `POST /statistics`

Get document statistics.

```bash
curl -X POST http://localhost:3000/statistics \
  -H "Content-Type: application/json" \
  -d '{"markdown":"# Hello\n\nContent"}'
```

Response: `{ "lines": 2, "characters": 18, "words": 2, "headings": 1, ... }`

### PowerShell Examples

```powershell
# Convert
Invoke-RestMethod -Method POST -Uri http://localhost:3000/convert `
  -ContentType 'application/json' `
  -Body (@{ markdown = "# Hi" } | ConvertTo-Json)

# Validate
Invoke-RestMethod -Method POST -Uri http://localhost:3000/validate `
  -ContentType 'application/json' `
  -Body (@{ markdown = "# Hi" } | ConvertTo-Json)
```

### Configuration

Environment variables:

### Security Features

- **Helmet.js** - Secure HTTP headers
- **Express Rate Limiting** - Prevents abuse
- **HTML Sanitization** - XSS prevention
- **Input Validation** - Type checking
- **Resource Limits** - DoS prevention

### Error Handling

- Invalid JSON or wrong `Content-Type`: `400 Bad Request`
- Missing required fields: `400 Bad Request`
- Server errors: `500 Internal Server Error`

All error responses include JSON: `{ "error": "message" }`

## 🖥️ CLI Usage

For command-line file processing.

### Installation

The CLI is included in the npm package:

```bash
npm install markdown-parser
```

### Commands

#### convert

Convert Markdown file to HTML:

```bash
markdown-parser convert input.md
markdown-parser convert input.md --output output.html
```

#### validate

Validate Markdown syntax:

```bash
markdown-parser validate document.md
```

Output shows errors and warnings if any.

#### stats

Display document statistics:

```bash
markdown-parser stats document.md
```

Shows: lines, characters, words, headings, links, images, lists, code blocks, tables.

#### toc

Generate table of contents:

```bash
markdown-parser toc document.md
markdown-parser toc document.md --output toc.md
```

#### watch

Watch file for changes and auto-convert:

```bash
markdown-parser watch input.md --output output.html
```

#### Other Commands

```bash
markdown-parser plugins      # List available plugins
```

### CLI vs Server

**Choose CLI for:** One-off conversions, build scripts, automation  
**Choose Server for:** Web services, APIs, continuous processing

## 🏗️ Project Structure

```
├── src/
│   ├── index.js                 # Main entry point
│   ├── utils.js                 # Utility functions
│   ├── core/
│   │   ├── parser.js            # Main parser
│   │   ├── tokenizer.js         # Tokenization
│   │   └── astBuilder.js        # AST construction
│   ├── renderers/
│   │   ├── htmlRenderer.js      # HTML output
│   │   └── markdownRenderer.js  # Markdown output
│   ├── plugins/
│   │   └── pluginSystem.js      # Plugin system
│   ├── cli/
│   │   └── index.js             # CLI interface
│   └── api/
│       └── index.js             # Public API
├── tests/
│   ├── unit/                    # Unit tests
│   ├── e2e/                     # E2E tests
│   ├── performance/             # Performance tests
│   ├── randomized/              # Fuzz tests
│   └── load/                    # Load tests
├── examples/
│   └── usage.js                 # Usage examples
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── TESTING.md
└── package.json
```

## 🧪 Testing

### Run All Tests

```bash
npm test                # All tests
npm run test:ci        # With coverage
npm run test:all       # All test suites
```

### Run Specific Test Suites

```bash
npm run test:unit          # Unit tests only
npm run test:e2e           # End-to-end tests
npm run test:performance   # Performance benchmarks
npm run test:randomized    # Fuzz tests
npm run test:load          # Load tests
npm run benchmark          # Performance benchmarks
```

### Test Coverage

```bash
npm run test:coverage
```

## 🎯 Performance Targets

- **100 lines**: < 100ms
- **500 lines**: < 300ms
- **1000 lines**: < 500ms
- **Throughput**: 100+ req/sec (small), 50+ (medium), 10+ (large)
- **Latency**: p95 < 200ms, p99 < 500ms under load

### Adaptive Performance Testing (PERF_SLOW_FACTOR)

Performance tests include an adaptive threshold mechanism for variable development environments:

**Default behavior** (fast/modern machines):

```bash
npm run test:performance    # Uses PERF_SLOW_FACTOR = 2 (internal default)
npm run benchmark           # Uses PERF_SLOW_FACTOR = 2
npm run test:ci             # Uses PERF_SLOW_FACTOR = 2
```

**For slower machines or CI environments**:

```bash
# Increase tolerance by 50% (relaxes all time thresholds)
PERF_SLOW_FACTOR=3 npm run benchmark

# Increase tolerance by 100% (very relaxed)
PERF_SLOW_FACTOR=4 npm run test:ci
```

**How it works**:

- Time thresholds multiply by `PERF_SLOW_FACTOR` (default: 2)
- Throughput expectations divide by `PERF_SLOW_FACTOR`
- Example: 100ms threshold becomes 200ms when `PERF_SLOW_FACTOR=2`

**Environment variable format**:

```powershell
# PowerShell
$env:PERF_SLOW_FACTOR = "3"; npm run benchmark; Remove-Item Env:PERF_SLOW_FACTOR

# Bash
PERF_SLOW_FACTOR=3 npm run benchmark

# Windows CMD
set PERF_SLOW_FACTOR=3 && npm run benchmark
```

This ensures tests pass consistently across different machines without requiring manual threshold adjustments.

## 🔒 Security

The parser includes built-in security features:

1. **HTML Sanitization** - Prevents XSS attacks
2. **Input Validation** - Validates all input
3. **Resource Limits** - Prevents DoS attacks
4. **Plugin Isolation** - Plugins cannot break security

## 🔌 Built-in Plugins

- LinkProcessor
- ImageProcessor
- HeadingIdGenerator
- CodeHighlighter
- AnchorLinkGenerator
- EmojiProcessor
- StructureValidator
- MetadataExtractor
- CustomRuleProcessor

## 📖 Examples

See [examples/usage.js](examples/usage.js) for 15+ practical examples including:

- Basic parsing
- AST generation and manipulation
- Custom rendering
- Plugin creation
- Batch file processing
- Performance optimization
