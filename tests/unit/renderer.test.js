const HTMLRenderer = require("../../src/renderers/htmlRenderer");
const MarkdownRenderer = require("../../src/renderers/markdownRenderer");

describe("HTMLRenderer", () => {
  let renderer;

  beforeEach(() => {
    renderer = new HTMLRenderer();
  });

  describe("Node Rendering", () => {
    test("renders heading node", () => {
      const node = {
        type: "heading",
        level: 1,
        children: [{ type: "text", text: "Title" }],
        id: "title",
      };
      const html = renderer.render(node);
      expect(html).toMatch(/<h1[^>]*id=["']title["'][^>]*>Title<\/h1>/);
      expect((html.match(/Title/g) || []).length).toBe(1);
    });

    test("renders paragraph node", () => {
      const node = {
        type: "paragraph",
        children: [{ type: "text", text: "Text" }],
      };
      const html = renderer.render(node);
      expect(html).toMatch(/<p[^>]*>Text<\/p>/);
      expect((html.match(/Text/g) || []).length).toBe(1);
    });

    test("renders code block", () => {
      const node = {
        type: "codeBlock",
        language: "js",
        code: "const x = 1;",
      };
      const html = renderer.render(node);
      expect(html).toMatch(/<pre[^>]*>/);
      expect(html).toMatch(/<code[^>]*[\s\w-]*language-js/);
      expect(html).toMatch(/const x = 1;/);
      expect((html.match(/const x = 1;/g) || []).length).toBe(1);
    });

    test("renders link", () => {
      const node = {
        type: "link",
        href: "https://example.com",
        text: "Link",
        children: [{ type: "text", text: "Link" }],
      };
      const html = renderer.render(node);
      expect(html).toMatch(
        /<a[^>]*href=["']https:\/\/example\.com["'][^>]*>Link<\/a>/
      );
      expect((html.match(/Link/g) || []).length).toBe(1);
    });

    test("renders image", () => {
      const node = {
        type: "image",
        src: "image.jpg",
        alt: "Alt text",
      };
      const html = renderer.render(node);
      expect(html).toMatch(/<img[^>]*src=["']image\.jpg["']/);
      expect(html).toMatch(/<img[^>]*alt=["']Alt text["']/);
      expect((html.match(/Alt text/g) || []).length).toBe(1);
    });

    test("renders strong", () => {
      const node = {
        type: "strong",
        children: [{ type: "text", text: "bold" }],
      };
      const html = renderer.render(node);
      expect(html).toMatch(/<strong[^>]*>bold<\/strong>/);
      expect((html.match(/bold/g) || []).length).toBe(1);
    });

    test("renders em", () => {
      const node = {
        type: "em",
        children: [{ type: "text", text: "italic" }],
      };
      const html = renderer.render(node);
      expect(html).toMatch(/<em[^>]*>italic<\/em>/);
      expect((html.match(/italic/g) || []).length).toBe(1);
    });

    test("renders del", () => {
      const node = {
        type: "del",
        children: [{ type: "text", text: "strikethrough" }],
      };
      const html = renderer.render(node);
      expect(html).toMatch(/<del[^>]*>strikethrough<\/del>/);
      expect((html.match(/strikethrough/g) || []).length).toBe(1);
    });

    test("renders hr", () => {
      const node = { type: "hr" };
      const html = renderer.render(node);
      expect(html).toMatch(/<hr[^>]*\s*\/?\s*>/);
    });

    test("renders blockquote", () => {
      const node = {
        type: "blockquote",
        children: [
          { type: "paragraph", children: [{ type: "text", text: "Quote" }] },
        ],
      };
      const html = renderer.render(node);
      expect(html).toMatch(/<blockquote[^>]*>/);
      expect(html).toMatch(/Quote/);
      expect(html).toMatch(/<\/blockquote>/);
      expect((html.match(/Quote/g) || []).length).toBe(1);
    });
  });

  describe("Escaping", () => {
    test("escapes HTML special characters", () => {
      const text = '<script>alert("xss")</script>';
      const escaped = renderer.escape(text);
      expect(escaped).not.toMatch(/<script>/);
      expect(escaped).toMatch(/&lt;/);
      expect(escaped).toMatch(/&gt;/);
    });

    test("escapes ampersands", () => {
      const escaped = renderer.escape("Tom & Jerry");
      expect(escaped).toMatch(/Tom.*&amp;.*Jerry/);
      expect((escaped.match(/Tom/g) || []).length).toBe(1);
      expect((escaped.match(/Jerry/g) || []).length).toBe(1);
    });

    test("escapes quotes", () => {
      const escaped = renderer.escape('He said "hello"');
      expect(escaped).toMatch(/He said.*&quot;.*hello/);
      expect((escaped.match(/He said/g) || []).length).toBe(1);
      expect((escaped.match(/hello/g) || []).length).toBe(1);
    });
  });

  describe("Full Page Generation", () => {
    test("generates complete HTML page", () => {
      const content = "<h1>Title</h1>";
      const page = renderer.generateFullPage(content, { title: "My Page" });
      expect(page).toMatch(/<!DOCTYPE html>/);
      expect(page).toMatch(/<title>My Page<\/title>/);
      expect(page).toMatch(/<h1>Title<\/h1>/);
      expect((page.match(/My Page/g) || []).length).toBe(1);
    });

    test("includes metadata in page", () => {
      const content = "<p>Content</p>";
      const page = renderer.generateFullPage(content, {
        title: "Title",
        author: "Author Name",
        description: "Page description",
      });
      expect(page).toMatch(/Author Name/);
      expect(page).toMatch(/Page description/);
      expect((page.match(/Author Name/g) || []).length).toBe(1);
      expect((page.match(/Page description/g) || []).length).toBe(1);
    });

    test("includes CSS in page", () => {
      const content = "<p>Content</p>";
      const page = renderer.generateFullPage(content);
      expect(page).toMatch(/<style>/);
      expect(page).toMatch(/<\/style>/);
      expect((page.match(/<style>/g) || []).length).toBe(1);
      expect((page.match(/<\/style>/g) || []).length).toBe(1);
    });
  });

  describe("CSS Generation", () => {
    test("generates CSS", () => {
      const css = renderer.generateCSS();
      expect(css).toBeDefined();
      expect(css.length).toBeGreaterThan(0);
      expect(css).toMatch(/body/);
      expect(css).toMatch(/h1/);
      expect((css.match(/body\s*{/g) || []).length).toBeGreaterThanOrEqual(1);
    });
  });
});

describe("MarkdownRenderer", () => {
  let renderer;

  beforeEach(() => {
    renderer = new MarkdownRenderer();
  });

  describe("Node Rendering", () => {
    test("renders heading", () => {
      const node = {
        type: "heading",
        level: 1,
        children: [{ type: "text", text: "Title" }],
      };
      const md = renderer.render(node);
      expect(md).toMatch(/^#+\s+Title/);
      expect((md.match(/Title/g) || []).length).toBe(1);
    });

    test("renders paragraph", () => {
      const node = {
        type: "paragraph",
        children: [{ type: "text", text: "Text" }],
      };
      const md = renderer.render(node);
      expect(md).toMatch(/^Text/);
      expect((md.match(/Text/g) || []).length).toBe(1);
    });

    test("renders code block", () => {
      const node = {
        type: "codeBlock",
        language: "js",
        code: "const x = 1;",
      };
      const md = renderer.render(node);
      expect(md).toMatch(/```js/);
      expect(md).toMatch(/const x = 1;/);
      expect(md).toMatch(/```/);
      expect((md.match(/const x = 1;/g) || []).length).toBe(1);
    });

    test("renders link", () => {
      const node = {
        type: "link",
        href: "https://example.com",
        children: [{ type: "text", text: "Link" }],
      };
      const md = renderer.render(node);
      expect(md).toMatch(/\[Link\]/);
      expect(md).toMatch(/\(https:\/\/example\.com\)/);
      expect((md.match(/Link/g) || []).length).toBe(1);
    });

    test("renders strong", () => {
      const node = {
        type: "strong",
        children: [{ type: "text", text: "bold" }],
      };
      const md = renderer.render(node);
      expect(md).toMatch(/\*\*bold\*\*/);
      expect((md.match(/bold/g) || []).length).toBe(1);
    });

    test("renders em", () => {
      const node = {
        type: "em",
        children: [{ type: "text", text: "italic" }],
      };
      const md = renderer.render(node);
      expect(md).toMatch(/\*italic\*/);
      expect((md.match(/italic/g) || []).length).toBe(1);
    });

    test("renders list", () => {
      const node = {
        type: "list",
        items: [
          {
            type: "listItem",
            children: [{ type: "text", text: "item 1" }],
          },
        ],
      };
      const md = renderer.render(node);
      expect(md).toMatch(/^-\s+item 1/);
      expect((md.match(/item 1/g) || []).length).toBe(1);
    });
  });
});
