const plugins = require('../../src/plugins/pluginSystem');

describe('plugin system expanded coverage', () => {
  test('LinkProcessorPlugin sets target when externalLinkTarget true', () => {
    const { LinkProcessorPlugin } = plugins;
    const p = new LinkProcessorPlugin({ externalLinkTarget: true });
    const ast = { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'link', href: 'http://a', text: 'a' }] }] };
    p.execute(ast);
    const link = ast.children[0].children[0];
    expect(link.target).toBe('_blank');
  });

  test('AnchorLinkPlugin adds toc metadata', () => {
    const { AnchorLinkPlugin } = plugins;
    const p = new AnchorLinkPlugin();
    const ast = { type: 'root', children: [{ type: 'heading', level: 1, children: [{ type: 'text', text: 'Hi' }] }] };
    p.execute(ast);
    expect(ast.toc).toBeDefined();
    expect(Array.isArray(ast.toc)).toBe(true);
  });

  test('EmojiPlugin replaces simple codes', () => {
    const { EmojiPlugin } = plugins;
    const p = new EmojiPlugin();
    const ast = { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Hello :)' }] }] };
    p.execute(ast);
    const txt = ast.children[0].children[0];
    expect(txt.text).toMatch(/😊/);
  });

  test('CodeHighlightPlugin marks code blocks', () => {
    const { CodeHighlightPlugin } = plugins;
    const p = new CodeHighlightPlugin();
    const ast = { type: 'root', children: [{ type: 'codeBlock', code: 'x=1', language: 'js' }] };
    p.execute(ast);
    expect(ast.children[0].highlighted).toBe(true);
  });
});
