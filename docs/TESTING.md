# Testing & Quality Assurance

## Overview

This project implements comprehensive testing at multiple levels:

- **Unit Tests**: Test individual components and functions
- **Integration Tests**: Test interactions between components
- **E2E Tests**: Test complete API endpoints and workflows
- **Performance Tests**: Benchmark parsing speed and throughput
- **Randomized Tests**: Fuzz testing with random inputs
- **Load Tests**: Simulate concurrent requests and API stress

## Test Structure

```
tests/
├── unit/                    # Unit tests for core modules
│   ├── parser.test.js
│   ├── tokenizer.test.js
│   ├── astBuilder.test.js
│   ├── renderer.test.js
│   └── integration.test.js
├── e2e/                     # End-to-end API tests
│   └── api.test.js
├── performance/             # Performance benchmarks
│   └── benchmarks.test.js
├── randomized/              # Fuzz and property-based tests
│   └── fuzz.test.js
└── load/                    # Load and stress tests
    └── api-load.test.js
```

## Running Tests

### Unit Tests

```bash
npm run test:unit
```

Tests core parser, tokenizer, AST builder, and renderers.

### Integration Tests

```bash
npm run test:all
```

Tests complete workflows and component interactions.

### E2E Tests

```bash
npm run test:e2e
```

Tests REST API endpoints with various Markdown inputs.

**Server Management:** The E2E tests automatically manage the server lifecycle:

- `api.test.js` and `express-server.test.js` use **supertest** which starts and stops the server in-process for each test suite
- `playwright.skeleton.test.js` spawns the server as a child process in `beforeAll()` hook and kills it in `afterAll()`

**No manual server setup is required** - just run `npm run test:e2e`.

### Performance Tests

```bash
npm run test:performance
# or
npm run benchmark
```

Measures parsing speed and throughput. Expected results:

- **100 lines**: < 100ms
- **500 lines**: < 300ms
- **1000 lines**: < 500ms
- **Throughput**: 100+ req/sec for small docs

### Randomized Tests

```bash
npm run test:randomized
```

Runs fuzz tests with randomly generated Markdown to ensure robustness.

### Load Tests

```bash
npm run test:load
```

Simulates concurrent requests to measure API capacity. Expected:

- **500 concurrent**: ~200ms latency
- **1000 concurrent**: ~500ms p99 latency
- **Throughput**: 100+ req/sec

### Run All Tests

```bash
npm run test:all
npm run test:ci  # With coverage and reporting
```

## Test Coverage Goals

- **Unit Test Coverage**: > 80% code coverage
- **Integration Coverage**: Critical workflows covered
- **E2E Coverage**: All API endpoints tested
- **Performance**: Linear O(n) complexity verified
- **Reliability**: 100% pass rate maintained

## Quality Metrics

### Code Quality

- ESLint compliance required
- Prettier formatting enforced
- TypeScript-style JSDoc comments

### Performance Targets

#### Library Performance

- **Parsing Time**: ≤ 500ms for 1000 lines
- **Memory**: ≤ 100MB for 1000-line document
- **Complexity**: O(n) linear performance

#### API Performance

- **Average Latency**: < 100ms
- **P95 Latency**: < 200ms
- **P99 Latency**: < 500ms
- **Throughput**: ≥ 100 req/sec
- **Error Rate**: < 0.1%

#### Load Test Results

- **Concurrent Requests**: 1000+ handled
- **Sustained Load**: 5 seconds @ target throughput
- **Memory Stability**: < 50% increase over baseline
- **Recovery**: Recovers from spikes in < 1 second

## Test Categories

### 1. Unit Tests (tests/unit/)

#### Parser Tests

- Heading parsing (h1-h6)
- Paragraph parsing
- Emphasis (bold, italic)
- Links and images
- Code blocks and inline code
- Lists (ordered and unordered)
- Blockquotes and horizontal rules
- Tables and strikethrough

#### Tokenizer Tests

- Block-level tokenization
- Inline tokenization
- Token validation
- Edge cases (empty input, special chars)

#### AST Builder Tests

- AST generation from tokens
- Node structure validation
- Heading ID generation
- Table of contents generation

#### Renderer Tests

- HTML generation from AST
- HTML escaping and sanitization
- Markdown regeneration

### 2. Integration Tests (tests/unit/integration.test.js)

- Full pipeline: Markdown → HTML
- Plugin integration
- Multiple format support
- Document statistics
- Large document handling

### 3. E2E Tests (tests/e2e/api.test.js)

#### API Endpoint Tests

- POST /convert - Markdown to HTML conversion
- POST /validate - Markdown validation
- POST /statistics - Document statistics
- Error handling for malformed input
- Security tests (XSS prevention)

#### Real-world Examples

- GitHub README parsing
- API documentation
- Blog posts
- Technical specifications

#### Browser Compatibility

- Valid HTML5 generation
- Semantic HTML output
- Proper escaping

### 4. Performance Tests (tests/performance/benchmarks.test.js)

Performance benchmarks measure parsing speed and verify algorithmic complexity.

**Benchmark Methodology**

The benchmarks use execution time measurements to analyze algorithmic complexity. Due to system noise (JIT warmup, garbage collection, OS scheduling), reliable results require:

1. **Sufficient Input Size**: Use inputs large enough so that execution time >> system noise
   - Too small (< 100 lines): Results dominated by noise, measurements unreliable
2. **Proper Analysis**: Analyze results carefully:
   - Calculate "Time per Line" metric: `execution_time / input_size`
   - Linear complexity (O(n)) is confirmed if "Time per Line" remains constant as input size increases
3. **Data Presentation**: Below is the verified O(n) complexity data:

| Input Size (lines) | Avg Time (ms) | Std Dev (ms) | Time per Line (μs) |
| ------------------ | ------------- | ------------ | ------------------ |
| 100,000            | 2,429.75      | 387.86       | 24.30              |
| 500,000            | 13,433.33     | 2,773.42     | 26.87              |
| 1,000,000          | 22,278.71     | 2,221.39     | 22.28              |

**Analysis Results:**

- **Estimated Complexity Order**: O(n^0.98) - nearly perfect linear scaling

#### Parsing Performance

```bash
npm run test:performance
# or
npm run benchmark
```

#### Memory Profiling

- Stable memory usage
- Leak detection
- Large document handling

#### Throughput Analysis

- Requests per second
- Small/medium/large documents
- Sustained load performance

#### Component Benchmarks

- Tokenization speed
- AST generation speed
- Rendering speed
- Statistics calculation

### 5. Randomized Tests (tests/randomized/fuzz.test.js)

#### Property-based Testing

- Any Markdown is parseable
- Parsing deterministic (same input = same output)
- Valid AST structure for any input
- Statistics calculable for any input

#### Fuzz Testing

- Random byte sequences
- Unicode handling
- Mixed valid/invalid Markdown
- Special character escaping

#### Edge Cases

- Empty/whitespace-only input
- Very long single lines
- Deeply nested structures
- Mixed content types

### 6. Load Tests (tests/load/api-load.test.js)

Load tests simulate realistic usage patterns to measure system performance under stress.

#### Concurrent Load

- 500, 1000 concurrent requests
- Throughput measurement
- P95/P99 latency

#### Stress Testing

- Request spikes
- Mixed document sizes
- Error scenarios
- Resource exhaustion

#### Sustained Load

- 5+ seconds at target throughput
- Memory stability
- Performance degradation limits

## Continuous Integration

The project uses GitHub Actions for CI/CD:

```yaml
- Unit tests on every commit
- Integration tests on PR
- Performance benchmarks weekly
- Coverage reports to Codecov
- Load tests on merge to main
```

## Test Reports

After running tests, reports are generated:

```bash
# Coverage report
npm run test:coverage
# View HTML report in: coverage/index.html

# Performance report
npm run benchmark
# View console output with metrics

# Load test report
npm run test:load
# View metrics and latency distributions
```

## Debugging Tests

### Run Single Test File

```bash
jest tests/unit/parser.test.js
```

### Run Single Test

```bash
jest tests/unit/parser.test.js -t "parses headings"
```

### Debug Mode

```bash
node --inspect-brk node_modules/.bin/jest tests/unit/parser.test.js
```

### Watch Mode

```bash
jest --watch tests/unit/
```

## Performance Profiling

```bash
# Node.js profiling
node --prof examples/usage.js
node --prof-process isolate-*.log > profile.txt

# Memory profiling
node --expose-gc examples/usage.js
```

## Best Practices

1. **Write Tests First**: Follow TDD principles
2. **Test Edge Cases**: Empty input, special characters, extreme sizes
3. **Isolate Tests**: No dependencies between tests
4. **Mock External Services**: Simulate API/database calls
5. **Clean Up**: Reset state in beforeEach/afterEach
6. **Meaningful Names**: Test names should describe what is tested
7. **One Assertion**: Each test should verify one behavior
8. **Performance Baselines**: Establish and maintain performance standards

## Common Issues & Solutions

### Test Timeout

```bash
jest --testTimeout=60000  # Increase timeout to 60s
```

### Memory Issues

```bash
node --max-old-space-size=4096 node_modules/.bin/jest
```

### Flaky Tests

- Check for timing dependencies
- Use proper async/await patterns
- Avoid Math.random() in tests (use seeded RNG)

### Performance Regression

- Compare benchmark results over time
- Investigate algorithmic changes
- Profile with Node.js profiler

## Adding New Tests

1. Create test file in appropriate directory
2. Import necessary modules
3. Use descriptive `describe` and `test` blocks
4. Add assertions and error handling
5. Document expected behavior
6. Run tests: `npm test`
7. Check coverage: `npm run test:coverage`

## References

- [Jest Documentation](https://jestjs.io/)
- [Jest Matchers](https://jestjs.io/docs/expect)
- [Node.js Performance Hooks](https://nodejs.org/api/perf_hooks.html)
- [Web Performance APIs](https://developer.mozilla.org/en-US/docs/Web/API/Performance)
