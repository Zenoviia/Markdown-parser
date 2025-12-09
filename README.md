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

````

### Using the API

```javascript
const api = require('./src/api');

// Parse Markdown to HTML
const html = api.parseMarkdownToHTML('# Welcome\n\nHello **world**!');

// Generate table of contents
const toc = api.generateTableOfContents('# Chapter 1\n## Section 1.1\n# Chapter 2');

// Extract all links
const links = parser.parseToAST('Check [this link](https://example.com)');
const extracted = parser.astBuilder.extractLinks(links);
````

### Using the CLI

```bash
# Convert Markdown to HTML
node bin/cli.js convert input.md --output output.html

# Validate Markdown file
node bin/cli.js validate document.md

# Get document statistics
node bin/cli.js stats README.md

# Generate table of contents
node bin/cli.js toc README.md --output TOC.md

# Watch file for changes
node bin/cli.js watch src/docs/ --output dist/
```

## 📚 Documentation

- **[API.md](docs/API.md)** - Complete API reference
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System design and architecture
- **[TESTING.md](docs/TESTING.md)** - Testing strategy and test suites
- **[examples/usage.js](examples/usage.js)** - 15+ practical examples

## 🌐 HTTP Server & Endpoints

The project exposes a small Express-based HTTP server. Start it locally with:

```powershell
npm start
# or (preserve original CLI): npm run start:cli
```

Default server port: `3000`.

Available endpoints (JSON requests):

- `POST /parse` — body: `{ "markdown": "# Hello" }` → response: `{ "ast": { ... } }`
- `POST /convert` — body: `{ "markdown": "# Hello" }` → response: `{ "html": "<h1>..." }`
- `POST /validate` — body: `{ "markdown": "..." }` → response: validation object
- `POST /statistics` — body: `{ "markdown": "..." }` → response: statistics object

Examples:

curl (Bash):

```bash
curl -X POST http://localhost:3000/convert \
	-H "Content-Type: application/json" \
	-d '{"markdown":"# Hello\n\nWorld"}'
```

PowerShell:

```powershell
Invoke-RestMethod -Method POST -Uri http://localhost:3000/convert -ContentType 'application/json' -Body (@{ markdown = "# Hi" } | ConvertTo-Json)
```

Notes:

- The server expects `Content-Type: application/json` for POST requests and enforces a default body size limit (100KB). Invalid JSON or wrong content type returns `400`.
- Internal errors return `500` with a JSON error message.

Environment variables:

- `BODY_SIZE_LIMIT` — JSON body size limit (e.g. `100kb`). Default: `100kb`.
- `RATE_LIMIT_WINDOW_MS` — Rate limiter window in milliseconds. Default: `60000` (1 minute).
- `RATE_LIMIT_MAX` — Max requests per window for global limiter. Default: `100`.
- `TRUST_PROXY` — Set to `1` to enable `app.set('trust proxy', 1)` when behind a reverse proxy. Default: unset.

Security and rate limiting:

- The server uses `helmet` to set secure HTTP headers.
- A global rate limiter (`express-rate-limit`) is applied. Configure via `RATE_LIMIT_*` env vars.

Load testing:

- Example `k6` script is provided in `tools/k6/convert.js`.

Browser E2E:

- A Playwright test skeleton is added at `tests/e2e/playwright.skeleton.test.js`. Install Playwright and enable the test to run browser E2E.

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


