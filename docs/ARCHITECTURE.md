# Architecture

## System Design

The Markdown Parser is built on a comprehensive architecture with a three-stage pipeline core, supplemented by utility, API, and server layers:

```
Markdown Input
     ↓
[Tokenizer] → Tokens (block/inline)
     ↓
[AST Builder] → Abstract Syntax Tree (AST)
     ↓
[Renderer] → Output (HTML/Markdown/Custom)
     ↓
[Plugins] → Transform throughout pipeline
     ↓
[Public API] & [HTTP Server] & [CLI] → Multiple consumption patterns
     ↓
Utils & Utilities → Support layer
```

**Key Layers:**

- **Core Pipeline**: Tokenizer → AST Builder → Renderer
- **Extensibility**: Plugin System at every stage
- **Consumption**: API (programmatic), HTTP Server (REST), CLI (command-line)
- **Infrastructure**: Utils module, Server setup, Configuration management

## Core Components

### 1. Tokenizer (`src/core/tokenizer.js`)

Converts Markdown text into tokens.

**Responsibilities:**

- Recognize block-level elements (headings, paragraphs, code blocks, lists, etc.)
- Recognize inline elements (emphasis, links, images, code, etc.)
- Maintain token hierarchy and relationships
- Handle edge cases (empty lines, indentation, special characters)

**Key Methods:**

```javascript
tokenize(markdown); // Main entry point
tokenizeBlocks(text); // Split into block tokens
tokenizeInline(text); // Split into inline tokens
isHeading(line); // Detect heading syntax
isList(line); // Detect list syntax
isCodeBlock(line); // Detect code block syntax
```

**Token Structure:**

```javascript
{
  type: 'heading' | 'paragraph' | 'code' | 'list' | ...,
  level?: number,              // For headings: 1-6
  raw: string,                 // Original text
  children?: Token[],          // Nested tokens
  content?: Token[],           // Inline tokens
  metadata?: {                 // Extra info
    language?: string,         // Code block language
    ordered?: boolean,         // For lists
    start?: number,            // List start number
  }
}
```

### 2. AST Builder (`src/core/astBuilder.js`)

Builds Abstract Syntax Tree from tokens.

**Responsibilities:**

- Convert tokens into tree structure
- Validate node relationships
- Generate heading IDs
- Extract metadata (links, images, headings)
- Generate table of contents

**Key Methods:**

```javascript
buildAST(tokens); // Main entry point
buildNode(token); // Recursively build nodes
validateStructure(ast); // Validate tree integrity
extractHeadings(ast); // Get all headings
extractLinks(ast); // Get all links
extractImages(ast); // Get all images
generateTableOfContents(ast); // Create ToC
```

**AST Node Structure:**

```javascript
{
  type: 'root' | 'heading' | 'paragraph' | 'code' | ...,

  // Common properties
  level?: number,
  children: ASTNode[],
  raw?: string,

  // For text nodes
  content?: string,

  // For inline elements
  url?: string,
  title?: string,

  // Generated properties
  id?: string,                // Generated heading ID
  attributes?: {              // HTML attributes
    class?: string,
    id?: string,
    [key]: string,
  }
}
```

### 3. Renderers

Convert AST to various formats.

#### HTML Renderer (`src/renderers/htmlRenderer.js`)

Generates semantic HTML5 output.

**Features:**

- Full HTML5 compliance
- XSS prevention via escaping
- Custom CSS generation
- Semantic markup (proper heading hierarchy)
- Accessibility support

**Key Methods:**

```javascript
render(ast); // Render AST to HTML
renderFullPage(ast); // Generate complete HTML page
renderNode(node); // Render single node
escape(text); // Sanitize for HTML
generateCSS(); // Generate default styles
```

#### Markdown Renderer (`src/renderers/markdownRenderer.js`)

Converts AST back to Markdown.

**Use Cases:**

- Round-trip conversion (Markdown → AST → Markdown)
- Document normalization
- Markdown regeneration with modifications

**Key Methods:**

```javascript
render(ast); // Render AST to Markdown
renderNode(node); // Render single node
normalizeMarkdown(markdown); // Normalize formatting
```

### 4. Parser (`src/core/parser.js`)

Main orchestrator combining all components with integrated advanced features.

**Responsibilities:**

- Coordinate tokenizer → AST builder → renderer pipeline
- Manage plugins and extensions
- Validate input/output and document formatting
- Calculate statistics and perform document analysis
- Handle caching, hooks, and line manipulation
- Provide text search, analysis, and comparison utilities

**Key Methods:**

**Core Parsing:**

```javascript
parse(markdown); // Markdown → HTML
parseToAST(markdown); // Markdown → AST
parseWithRenderer(markdown, renderer); // Custom renderer
validate(markdown); // Check validity
```

**Advanced Features (formerly in AdvancedParser):**

```javascript
// Caching
parseWithCache(markdown, useCache); // With caching
setCacheEntry(key, value);
getCacheEntry(key);
clearCache();

// Hook System
on(event, callback); // Register hooks (beforeParse, afterParse, onError)
emit(event, data);

// Text Search & Analysis
search(markdown, pattern); // Find pattern matches
replace(markdown, searchValue, replaceValue);
analyzeLines(markdown); // Get line metadata
getLineStatistics(markdown); // Line-level stats

// Document Formatting
format(markdown, options); // Format document
compare(doc1, doc2); // Compare documents
findDuplicates(markdown); // Find duplicate lines

// Line Manipulation
sortLines(markdown, compareFn); // Sort lines
filterLines(markdown, filterFn); // Filter lines
mapLines(markdown, mapFn); // Transform lines

// Format Validation
validateFormatting(markdown); // Check syntax issues
getMostCommonWords(markdown, limit); // Word frequency
getVocabulary(markdown); // Get unique words
```

**Statistics:**

```javascript
{
  lines: number,
  headings: number,
  paragraphs: number,
  codeBlocks: number,
  links: number,
  images: number,
  tables: number,
  lists: number,
  characters: number,
  words: number,
  estimatedReadTime: number, // in seconds
}
```

**Design Decision: Unified Parser**

Previously, functionality was split between `MarkdownParser` (core parsing) and `AdvancedParser` (validation, analysis, formatting). This caused:

- Maintenance burden (two parallel implementations)
- Inconsistent behavior (bug in one parser affected only one code path)
- Confusion about which parser to use

**Solution:** All AdvancedParser functionality has been merged into MarkdownParser. The class now provides:

- Single point of maintenance
- Consistent behavior across all parsing paths
- Unified API for all Markdown processing tasks
- No breaking changes (all methods are additive)

Related tests moved from `tests/unit/advancedParser.test.js` to `tests/unit/parser.advanced.test.js`.

### 5. Plugin System (`src/plugins/pluginSystem.js`)

Extensible plugin architecture for custom processing.

**Plugin Lifecycle:**

```
1. Register plugin with parser
2. Before tokenization → beforeTokenize()
3. During tokenization → during tokenization
4. After tokenization → afterTokenize()
5. Before AST building → beforeBuild()
6. During AST building → during building
7. After AST building → afterBuild()
8. Before rendering → beforeRender()
9. During rendering → during rendering
10. After rendering → afterRender()
```

**Built-in Plugins:**

1. **LinkProcessor** - Validate and process links
2. **ImageProcessor** - Process image references
3. **HeadingIdGenerator** - Generate heading IDs
4. **CodeHighlighter** - Prepare for syntax highlighting
5. **AnchorLinkGenerator** - Create anchor links
6. **EmojiProcessor** - Handle emoji rendering
7. **StructureValidator** - Validate document structure
8. **MetadataExtractor** - Extract document metadata
9. **CustomRuleProcessor** - Apply custom parsing rules

**Plugin Interface:**

```javascript
class BasePlugin {
  constructor(options) {}
  beforeTokenize(markdown) {
    return markdown;
  }
  afterTokenize(tokens) {
    return tokens;
  }
  beforeBuild(tokens) {
    return tokens;
  }
  afterBuild(ast) {
    return ast;
  }
  beforeRender(ast, format) {
    return ast;
  }
  afterRender(output, format) {
    return output;
  }
}
```

### 6. Public API (`src/api/index.js`)

High-level convenience methods.

```javascript
// Factory functions
createParser(options);
createMarkdownParser();
createHTMLRenderer();
createMarkdownRenderer();

// Convenience methods
parseMarkdown(markdown);
parseMarkdownToHTML(markdown);
parseMarkdownToAST(markdown);
validateMarkdown(markdown);
getMarkdownStatistics(markdown);
generateTableOfContents(markdown);
renderASTToHTML(ast);
renderASTToMarkdown(ast);
```

### 7. CLI (`src/cli/index.js`)

Command-line interface for file operations.

**Commands:**

1. **convert** - Convert between formats
2. **validate** - Check Markdown validity
3. **stats** - Show document statistics
4. **toc** - Generate table of contents
5. **watch** - Watch files for changes

**Example:**

```bash
markdown-parser convert input.md --output output.html
markdown-parser validate document.md
markdown-parser stats blog.md
markdown-parser toc README.md --output TOC.md
markdown-parser watch src/ --output dist/
```

### 8. HTTP Server (`src/server.js`)

Express-based HTTP server providing REST API endpoints for Markdown processing.

**Responsibilities:**

- Provide REST API endpoints for programmatic access
- Implement security headers (Helmet.js)
- Enforce rate limiting and body size limits
- Handle JSON request/response validation
- CORS support for browser-based clients

**Key Endpoints:**

```javascript
POST /parse
  Request:  { "markdown": "# Title" }
  Response: { "ast": { type: "root", children: [...] } }

POST /convert
  Request:  { "markdown": "# Title" }
  Response: { "html": "<h1>Title</h1>" }

POST /validate
  Request:  { "markdown": "# Title" }
  Response: { "valid": true, "issues": [] }

POST /stats
  Request:  { "markdown": "# Title\n\nContent" }
  Response: { "lines": 2, "headings": 1, ... }

GET /health
  Response: { "status": "ok" }
```

**Security Features:**

- **Helmet.js** - Sets HTTP security headers
- **Rate Limiting** - Configurable via `RATE_LIMIT_MAX` and `RATE_LIMIT_WINDOW_MS`
- **Body Size Limiting** - Configurable via `BODY_SIZE_LIMIT` (default: 100kb)
- **Content-Type Validation** - POST requests must have `application/json`
- **Trust Proxy** - Configurable via `TRUST_PROXY` for reverse proxies
- **Input Validation** - All requests validated before processing

**Configuration (Environment Variables):**

```bash
PORT=3000                          # Server port (default: 3000)
BODY_SIZE_LIMIT=100kb              # Max request size (default: 100kb)
RATE_LIMIT_MAX=100                 # Max requests per window (default: 100)
RATE_LIMIT_WINDOW_MS=60000         # Rate limit window in ms (default: 60s)
TRUST_PROXY=1                      # Trust proxy headers (0 or 1)
```

**Factory Function:**

```javascript
const { createServer } = require("./server");
const app = createServer();
const server = app.listen(3000);
```

### 9. Server Starter (`src/server.start.js`)

Standalone script to launch the HTTP server.

**Responsibilities:**

- Bootstrap Express server on configured port
- Handle graceful shutdown (SIGINT)
- Provide server lifecycle management

**Usage:**

```bash
node src/server.start.js
# Server listening on http://localhost:3000

# With custom port:
PORT=5000 node src/server.start.js
# Server listening on http://localhost:5000
```

**Graceful Shutdown:**

- Listens for SIGINT (Ctrl+C)
- Closes server cleanly
- Exits process with code 0

### 10. Utils Module (`src/utils.js`)

Utility functions for text processing, validation, and data manipulation.

**Responsibilities:**

- HTML/Markdown escaping and unescaping
- URL and email validation
- String normalization and transformation
- Array and object manipulation
- Regular expression utilities

**Key Methods:**

```javascript
// HTML utilities
Utils.escapeHtml(text); // Escape HTML special chars
Utils.unescapeHtml(text); // Unescape HTML entities
Utils.escapeRegex(str); // Escape regex special chars

// Validation
Utils.isUrl(str); // Check if valid URL
Utils.isEmail(str); // Check if valid email
Utils.containsHtmlTags(str); // Detect HTML tags

// String utilities
Utils.capitalize(str); // Capitalize first letter
Utils.slugify(str); // Convert to URL slug
Utils.normalizeWhitespace(str); // Normalize spaces
Utils.dedent(str); // Remove common leading whitespace

// Array utilities
Utils.chunk(arr, size); // Split array into chunks
Utils.unique(arr); // Get unique elements
Utils.flatten(arr); // Flatten nested arrays
Utils.groupBy(arr, fn); // Group array elements

// Object utilities
Utils.clone(obj); // Deep clone object
Utils.merge(...objects); // Merge objects
Utils.pick(obj, keys); // Pick specific keys
```

**Implementation Example:**

```javascript
const Utils = require("./utils");

// HTML escaping
const escaped = Utils.escapeHtml('<script>alert("XSS")</script>');
// Result: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;

// Validation
if (Utils.isUrl("https://example.com")) {
  console.log("Valid URL");
}

// String transformation
const slug = Utils.slugify("Hello World!");
// Result: 'hello-world'
```

## Data Flow

### Parsing Flow

```
Input Markdown
    ↓
Tokenizer.tokenize()
    ├→ tokenizeBlocks()
    └→ tokenizeInline()
    ↓
Tokens Array
    ↓
PluginManager.afterTokenize()
    ↓
ASTBuilder.buildAST()
    ↓
AST Tree
    ↓
PluginManager.afterBuild()
    ↓
HTMLRenderer.render() / MarkdownRenderer.render()
    ↓
Output (HTML/Markdown/etc)
```

### Plugin Injection Points

```
Input → [beforeTokenize] → Tokenizer → [afterTokenize]
→ [beforeBuild] → ASTBuilder → [afterBuild]
→ [beforeRender] → Renderer → [afterRender] → Output
```

## Error Handling

### Error Types

1. **SyntaxError** - Invalid Markdown syntax
2. **ValidationError** - Document structure issues
3. **RenderError** - Output generation failures
4. **PluginError** - Plugin execution issues
5. **InputError** - Invalid input parameters
6. **ResourceError** - Resource limits exceeded

### Error Recovery

- Parser continues on non-critical errors
- Logs warnings for recoverable issues
- Throws exceptions for critical failures
- Plugins can suppress or modify errors
- HTTP server returns appropriate HTTP status codes

**Library Usage:**

```javascript
try {
  const html = parser.parse(markdown);
} catch (error) {
  if (error.type === "ValidationError") {
    console.warn("Document has issues:", error.details);
  } else if (error.type === "SyntaxError") {
    console.error("Cannot parse:", error.message);
  }
}
```

**HTTP Server Responses:**

```javascript
// 400 Bad Request
{
  "error": "markdown required"
}

// 400 Content-Type error
{
  "error": "Content-Type must be application/json"
}

// 429 Too Many Requests (rate limit)
{
  "error": "Too many requests, slow down"
}

// 500 Server Error
{
  "error": "failed to parse markdown"
}
```

## Performance Optimization

### Tokenization

- Single-pass block tokenization (O(n))
- Regex caching for pattern matching
- Early exit for common patterns

### AST Building

- Lazy node creation (only when needed)
- In-place tree manipulation
- Minimal copying of data

### Rendering

- Stream-based HTML generation
- Batch attribute processing
- CSS generation once, reused for all renders

### Plugin System

- Lazy plugin loading
- Plugin caching
- Minimal plugin communication

## Concurrency & Scalability

### Thread Safety

- Immutable parser configuration
- No global state modification
- Thread-safe token/AST structures

### Memory Management

- Token reuse during parsing
- AST node pooling for large documents
- Garbage collection friendly design

### Scaling Strategies

1. **Horizontal**: Multiple parser instances
2. **Vertical**: Optimize algorithms (currently O(n))
3. **Caching**: Cache parsed ASTs for repeated documents
4. **Streaming**: Process large documents in chunks

## Extension Points

### Custom Renderers

```javascript
class CustomRenderer {
  render(ast) {}
  renderNode(node) {}
}
parser.setRenderer("custom", new CustomRenderer());
```

### Custom Plugins

```javascript
class CustomPlugin extends BasePlugin {
  afterTokenize(tokens) {
    // Modify tokens
    return tokens;
  }
}
parser.use(new CustomPlugin());
```

### Custom Tokenizers

```javascript
class CustomTokenizer {
  tokenize(markdown) {}
}
parser.setTokenizer(new CustomTokenizer());
```

## Design Patterns Used

1. **Pipeline Pattern** - Tokenizer → AST → Renderer
2. **Plugin Pattern** - Extensible plugin system
3. **Factory Pattern** - Object creation (API)
4. **Strategy Pattern** - Multiple renderers
5. **Visitor Pattern** - AST traversal and transformation
6. **Builder Pattern** - AST construction
7. **Decorator Pattern** - Plugin wrapping
8. **Observer Pattern** - Plugin hooks

## Dependency Graph

```
index.js (main entry point - library usage)
├── api/index.js (public API)
│   ├── core/parser.js
│   ├── renderers/htmlRenderer.js
│   ├── renderers/markdownRenderer.js
│   ├── plugins/pluginSystem.js
│   ├── core/tokenizer.js
│   └── core/astBuilder.js
├── cli/index.js (command-line interface)
│   ├── core/parser.js
│   ├── renderers/htmlRenderer.js
│   ├── renderers/markdownRenderer.js
│   └── plugins/pluginSystem.js
├── server.js (HTTP REST API server)
│   ├── api/index.js
│   ├── express (external)
│   ├── helmet (external)
│   └── express-rate-limit (external)
├── server.start.js (server bootstrap)
│   └── server.js
├── utils.js (utility functions)
│   └── (no internal dependencies)
└── core/
    ├── parser.js (main orchestrator)
    │   ├── tokenizer.js
    │   ├── astBuilder.js
    │   ├── plugins/pluginSystem.js
    │   ├── renderers/htmlRenderer.js
    │   ├── renderers/markdownRenderer.js
    │   └── utils.js
    ├── tokenizer.js
    │   └── utils.js
    ├── astBuilder.js
    │   └── utils.js
    └── renderers/
        ├── htmlRenderer.js
        │   └── utils.js
        └── markdownRenderer.js
            └── utils.js

plugins/pluginSystem.js
└── (extensible - plugins loaded dynamically)
```

**Dependency Layers:**

1. **Foundation**: `utils.js` (no dependencies)
2. **Core Pipeline**: `tokenizer.js`, `astBuilder.js`, renderers
3. **Orchestration**: `parser.js` (coordinates all components)
4. **Plugins**: `pluginSystem.js` (extends core)
5. **Interfaces**: `api/index.js`, `cli/index.js`
6. **Infrastructure**: `server.js`, `server.start.js`
7. **Entry Point**: `index.js` (exports all public APIs)

## Configuration

### Parser Options

```javascript
const parser = new MarkdownParser({
  // Tokenization
  blockRegex: /^#+ /, // Custom heading pattern

  // AST Building
  generateHeadingIds: true, // Auto-generate IDs
  idPrefix: "heading-", // ID prefix

  // Rendering
  sanitize: true, // XSS prevention
  lineBreaks: true, // Preserve line breaks
  softBreak: "<br>\n", // Soft break handling

  // Plugins
  plugins: [], // Initial plugins

  // Performance
  cache: false, // Cache results
  maxDocumentSize: 10485760, // 10MB limit
});
```

## Testing Architecture

See [TESTING.md](./TESTING.md) for comprehensive testing strategy including:

- Unit tests for components
- Integration tests for workflows
- E2E tests for API endpoints
- Performance benchmarks
- Randomized/fuzz tests
- Load and stress tests

## Security Considerations

### Core Security

1. **Input Validation** - Validate all Markdown input
2. **HTML Escaping** - Prevent XSS via proper escaping (Utils.escapeHtml)
3. **Resource Limits** - Enforce document size limits (maxDocumentSize)
4. **Plugin Isolation** - Run plugins in controlled environment
5. **Error Messages** - Don't leak internal details

### HTTP Server Security

1. **Helmet.js** - Automatically sets security HTTP headers:

   - Content-Security-Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security
   - X-XSS-Protection

2. **Rate Limiting** - Prevent DoS attacks:

   - Configurable requests per window
   - Returns 429 Too Many Requests
   - Applies globally and per-endpoint

3. **Body Size Limiting** - Prevent memory exhaustion:

   - Default: 100KB per request
   - Configurable via BODY_SIZE_LIMIT
   - Rejects oversized payloads

4. **Content-Type Validation** - Prevent header injection:

   - POST requests must specify `application/json`
   - Returns 400 Bad Request for mismatched content

5. **CORS Control** - Manage cross-origin requests:

   - Allows specified origins
   - Configurable allowed methods and headers
   - Handles OPTIONS preflight requests

6. **Proxy Trust** - Handle reverse proxies safely:
   - Only trust proxy headers when TRUST_PROXY=1
   - Prevents IP spoofing in rate limiting

**Security Best Practices:**

```bash
# Set strong rate limits in production
RATE_LIMIT_MAX=50
RATE_LIMIT_WINDOW_MS=60000

# Limit document size
BODY_SIZE_LIMIT=10kb

# Enable proxy trust only if behind reverse proxy
TRUST_PROXY=1
```

## Maintenance & Evolution

- Code organized by functionality
- Clear separation of concerns
- Comprehensive documentation
- Extensive test coverage
- Plugin system for safe extensions
- Backward compatibility maintained
