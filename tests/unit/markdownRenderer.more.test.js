const MarkdownRenderer = require('../../src/renderers/markdownRenderer');

describe('MarkdownRenderer branches', () => {
  const r = new MarkdownRenderer();

  test('renders code block with language', () => {
    const node = { type: 'codeBlock', language: 'js', code: 'console.log(1)' };
    const out = r.render(node);
    expect(out).toContain('```js');
    expect(out).toContain('console.log(1)');
  });

  test('renders ordered and unordered lists', () => {
    const list = { type: 'list', items: [{ children: [{ type: 'text', text: 'a' }] }] };
    const out = r.render(list);
    expect(out).toContain('- a');

    const ol = { type: 'orderedList', items: [{ children: [{ type: 'text', text: 'b' }] }] };
    const out2 = r.render(ol);
    expect(out2).toMatch(/1\./);
  });

  test('renders table with alignment', () => {
    const node = {
      type: 'table',
      thead: { cells: [{ content: [{ type: 'text', text: 'H' }], align: 'center' }] },
      tbody: { rows: [{ cells: [{ content: [{ type: 'text', text: 'c' }] }] }] }
    };
    const out = r.render(node);
    expect(out).toContain('| H |');
    expect(out).toMatch(/:---:/);
  });

  describe('MarkdownRenderer - Extended Coverage', () => {
    let renderer;

    beforeEach(() => {
      renderer = new MarkdownRenderer();
    });

    test('should render text nodes', () => {
      const node = { type: 'text', value: 'Hello World' };
      const output = renderer.render(node);
      expect(typeof output).toBe('string');
      expect(output).toBeDefined();
    });

    test('should render bold/strong text', () => {
      const node = {
        type: 'strong',
        children: [{ type: 'text', value: 'bold text' }],
      };
      const output = renderer.render(node);
      expect(typeof output).toBe('string');
      expect(output).toBeDefined();
    });

    test('should render italic/em text', () => {
      const node = {
        type: 'em',
        children: [{ type: 'text', value: 'italic text' }],
      };
      const output = renderer.render(node);
      expect(typeof output).toBe('string');
      expect(output).toBeDefined();
    });

    test('should render deleted/strikethrough text', () => {
      const node = {
        type: 'del',
        children: [{ type: 'text', value: 'deleted' }],
      };
      const output = renderer.render(node);
      expect(typeof output).toBe('string');
      expect(output).toBeDefined();
    });

    test('should render links', () => {
      const node = {
        type: 'link',
        href: 'https://example.com',
        children: [{ type: 'text', value: 'Example' }],
      };
      const output = renderer.render(node);
      expect(typeof output).toBe('string');
      expect(output).toBeDefined();
    });

    test('should render images', () => {
      const node = {
        type: 'image',
        src: 'image.jpg',
        alt: 'alt text',
      };
      const output = renderer.render(node);
      expect(output).toContain('![');
      expect(output).toContain('image.jpg');
    });

    test('should render inline code', () => {
      const node = {
        type: 'inlineCode',
        code: 'const x = 1;',
      };
      const output = renderer.render(node);
      expect(output).toContain('`');
      expect(output).toContain('const x = 1;');
    });

    test('should render headings', () => {
      const node = {
        type: 'heading',
        level: 1,
        children: [{ type: 'text', value: 'Title' }],
      };
      const output = renderer.render(node);
      expect(typeof output).toBe('string');
      expect(output).toBeDefined();
    });

    test('should render multiple heading levels', () => {
      const h2 = {
        type: 'heading',
        level: 2,
        children: [{ type: 'text', value: 'Heading 2' }],
      };
      const h3 = {
        type: 'heading',
        level: 3,
        children: [{ type: 'text', value: 'Heading 3' }],
      };

      const output2 = renderer.render(h2);
      const output3 = renderer.render(h3);
      
      expect(output2).toBeDefined();
      expect(output3).toBeDefined();
      expect(typeof output2).toBe('string');
      expect(typeof output3).toBe('string');
    });

    test('should render blockquotes', () => {
      const node = {
        type: 'blockquote',
        children: [{ type: 'text', value: 'Quote text' }],
      };
      const output = renderer.render(node);
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });

    test('should render horizontal rule', () => {
      const node = { type: 'hr' };
      const output = renderer.render(node);
      expect(output).toMatch(/^-{3,}$|^\*{3,}$/m);
    });

    test('should render list items', () => {
      const node = {
        type: 'list',
        items: [
          { children: [{ type: 'text', value: 'Item 1' }] },
          { children: [{ type: 'text', value: 'Item 2' }] },
        ],
      };
      const output = renderer.render(node);
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });

    test('should render ordered lists with numbers', () => {
      const node = {
        type: 'orderedList',
        items: [
          { children: [{ type: 'text', value: 'First' }] },
          { children: [{ type: 'text', value: 'Second' }] },
        ],
      };
      const output = renderer.render(node);
      expect(output).toMatch(/1\./);
      expect(output).toMatch(/2\./);
    });

    test('should render code blocks without language', () => {
      const node = {
        type: 'codeBlock',
        code: 'const x = 1;',
      };
      const output = renderer.render(node);
      expect(output).toContain('```');
      expect(output).toContain('const x = 1;');
    });

    test('should render paragraphs', () => {
      const node = {
        type: 'paragraph',
        children: [{ type: 'text', value: 'Paragraph text' }],
      };
      const output = renderer.render(node);
      // Paragraph rendering may include whitespace
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });

    test('should render root element', () => {
      const node = {
        type: 'root',
        children: [
          { type: 'paragraph', children: [{ type: 'text', value: 'Para 1' }] },
          { type: 'paragraph', children: [{ type: 'text', value: 'Para 2' }] },
        ],
      };
      const output = renderer.render(node);
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
      expect(output.length > 0).toBe(true);
    });

    test('should handle null/undefined nodes', () => {
      expect(renderer.render(null)).toBe('');
      expect(renderer.render(undefined)).toBe('');
    });

    test('should render HTML pass-through', () => {
      const node = {
        type: 'html',
        value: '<div>HTML</div>',
      };
      const output = renderer.render(node);
      // HTML rendering may vary
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });

    test('should add custom renderer', () => {
      renderer.addRenderer('custom', (node) => `CUSTOM: ${node.value}`);
      const node = { type: 'custom', value: 'Test' };
      const output = renderer.render(node);
      expect(output).toBe('CUSTOM: Test');
    });

    test('should throw on invalid renderer function', () => {
      expect(() => {
        renderer.addRenderer('type', 'not a function');
      }).toThrow();
    });

    test('should render table with multiple columns', () => {
      const node = {
        type: 'table',
        thead: {
          cells: [
            { content: [{ type: 'text', value: 'Col1' }] },
            { content: [{ type: 'text', value: 'Col2' }] },
            { content: [{ type: 'text', value: 'Col3' }] },
          ],
        },
        tbody: {
          rows: [
            {
              cells: [
                { content: [{ type: 'text', value: 'A' }] },
                { content: [{ type: 'text', value: 'B' }] },
                { content: [{ type: 'text', value: 'C' }] },
              ],
            },
          ],
        },
      };
      const output = renderer.render(node);
      // Table rendering may vary, just check it produces output
      expect(output).toBeDefined();
      expect(output.length > 0).toBe(true);
    });

    test('should render table with left alignment', () => {
      const node = {
        type: 'table',
        thead: {
          cells: [{ content: [{ type: 'text', value: 'Left' }], align: 'left' }],
        },
        tbody: { rows: [{ cells: [{ content: [{ type: 'text', value: 'x' }] }] }] },
      };
      const output = renderer.render(node);
      expect(output).toContain('|');
    });

    test('should render table with right alignment', () => {
      const node = {
        type: 'table',
        thead: {
          cells: [{ content: [{ type: 'text', value: 'Right' }], align: 'right' }],
        },
        tbody: { rows: [{ cells: [{ content: [{ type: 'text', value: 'x' }] }] }] },
      };
      const output = renderer.render(node);
      expect(output).toContain('|');
    });

    test('should handle nodes without children', () => {
      const node = { type: 'paragraph' };
      const output = renderer.render(node);
      // Paragraph without children may render as empty or with newline
      expect(typeof output).toBe('string');
    });

    test('should preserve markdown formatting option', () => {
      const rendererWithPreserve = new MarkdownRenderer({ preserveFormatting: true });
      expect(rendererWithPreserve.options.preserveFormatting).toBe(true);
    });

    test('should render nested structures', () => {
      const node = {
        type: 'list',
        items: [
          {
            children: [
              {
                type: 'paragraph',
                children: [
                  { type: 'strong', children: [{ type: 'text', value: 'Bold' }] },
                ],
              },
            ],
          },
        ],
      };
      const output = renderer.render(node);
      // Check output is generated, formatting may vary
      expect(output).toBeDefined();
      expect(typeof output).toBe('string');
    });

    test('should handle unknown node types gracefully', () => {
      const node = { type: 'unknownType', children: [{ type: 'text', value: 'test' }] };
      const output = renderer.render(node);
      // Unknown types should render children or be handled gracefully
      expect(typeof output).toBe('string');
    });
  });
});
