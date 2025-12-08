# Architecture

## System Design

The Markdown Parser is built on a three-stage pipeline architecture:

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
```

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

Main orchestrator combining all components.

**Responsibilities:**

- Coordinate tokenizer → AST builder → renderer pipeline
- Manage plugins
- Validate input/output
- Calculate statistics
- Handle errors

**Key Methods:**

```javascript
parse(markdown); // Markdown → HTML
parseToAST(markdown); // Markdown → AST
renderAST(ast, format); // AST → format
validate(markdown); // Check validity
getStatistics(markdown); // Calculate metrics
use(plugin); // Register plugin
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

### Error Recovery

- Parser continues on non-critical errors
- Logs warnings for recoverable issues
- Throws exceptions for critical failures
- Plugins can suppress or modify errors

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
index.js (entry point)
├── api/index.js (public API)
│   ├── core/parser.js
│   ├── renderers/htmlRenderer.js
│   ├── renderers/markdownRenderer.js
│   └── plugins/pluginSystem.js
├── cli/index.js
│   └── core/parser.js
└── core/
    ├── parser.js
    │   ├── tokenizer.js
    │   ├── astBuilder.js
    │   ├── plugins/pluginSystem.js
    │   └── renderers/
    ├── tokenizer.js
    ├── astBuilder.js
    └── renderers/
        ├── htmlRenderer.js
        └── markdownRenderer.js
```

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

1. **Input Validation** - Validate all Markdown input
2. **HTML Escaping** - Prevent XSS via proper escaping
3. **Resource Limits** - Enforce document size limits
4. **Plugin Isolation** - Run plugins in controlled environment
5. **Error Messages** - Don't leak internal details

## Maintenance & Evolution

- Code organized by functionality
- Clear separation of concerns
- Comprehensive documentation
- Extensive test coverage
- Plugin system for safe extensions
- Backward compatibility maintained
