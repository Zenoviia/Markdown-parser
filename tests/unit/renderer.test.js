/**
 * Renderer Tests
 * Тести для рендерерів
 */

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
      expect(html).toContain('<h1 id="title">');
      expect(html).toContain("Title");
      expect(html).toContain("</h1>");
    });

    test("renders paragraph node", () => {
      const node = {
        type: "paragraph",
        children: [{ type: "text", text: "Text" }],
      };
      const html = renderer.render(node);
      expect(html).toContain("<p>");
      expect(html).toContain("</p>");
    });

    test("renders code block", () => {
      const node = {
        type: "codeBlock",
        language: "js",
        code: "const x = 1;",
      };
      const html = renderer.render(node);
      expect(html).toContain("<pre>");
      expect(html).toContain("<code");
      expect(html).toContain("language-js");
    });

    test("renders link", () => {
      const node = {
        type: "link",
        href: "https://example.com",
        text: "Link",
        children: [{ type: "text", text: "Link" }],
      };
      const html = renderer.render(node);
      expect(html).toContain("<a href=");
      expect(html).toContain("https://example.com");
    });

    test("renders image", () => {
      const node = {
        type: "image",
        src: "image.jpg",
        alt: "Alt text",
      };
      const html = renderer.render(node);
      expect(html).toContain("<img");
      expect(html).toContain("image.jpg");
      expect(html).toContain("Alt text");
    });

    test("renders strong", () => {
      const node = {
        type: "strong",
        children: [{ type: "text", text: "bold" }],
      };
      const html = renderer.render(node);
      expect(html).toContain("<strong>");
      expect(html).toContain("</strong>");
    });

    test("renders em", () => {
      const node = {
        type: "em",
        children: [{ type: "text", text: "italic" }],
      };
      const html = renderer.render(node);
      expect(html).toContain("<em>");
      expect(html).toContain("</em>");
    });

    test("renders del", () => {
      const node = {
        type: "del",
        children: [{ type: "text", text: "strikethrough" }],
      };
      const html = renderer.render(node);
      expect(html).toContain("<del>");
      expect(html).toContain("</del>");
    });

    test("renders hr", () => {
      const node = { type: "hr" };
      const html = renderer.render(node);
      expect(html).toContain("<hr");
    });

    test("renders blockquote", () => {
      const node = {
        type: "blockquote",
        children: [
          { type: "paragraph", children: [{ type: "text", text: "Quote" }] },
        ],
      };
      const html = renderer.render(node);
      expect(html).toContain("<blockquote>");
      expect(html).toContain("</blockquote>");
    });
  });

  describe("Escaping", () => {
    test("escapes HTML special characters", () => {
      const text = '<script>alert("xss")</script>';
      const escaped = renderer.escape(text);
      expect(escaped).not.toContain("<script>");
      expect(escaped).toContain("&lt;");
      expect(escaped).toContain("&gt;");
    });

    test("escapes ampersands", () => {
      const escaped = renderer.escape("Tom & Jerry");
      expect(escaped).toContain("&amp;");
    });

    test("escapes quotes", () => {
      const escaped = renderer.escape('He said "hello"');
      expect(escaped).toContain("&quot;");
    });
  });

  describe("Full Page Generation", () => {
    test("generates complete HTML page", () => {
      const content = "<h1>Title</h1>";
      const page = renderer.generateFullPage(content, { title: "My Page" });
      expect(page).toContain("<!DOCTYPE html>");
      expect(page).toContain("<title>My Page</title>");
      expect(page).toContain("<h1>Title</h1>");
    });

    test("includes metadata in page", () => {
      const content = "<p>Content</p>";
      const page = renderer.generateFullPage(content, {
        title: "Title",
        author: "Author Name",
        description: "Page description",
      });
      expect(page).toContain("Author Name");
      expect(page).toContain("Page description");
    });

    test("includes CSS in page", () => {
      const content = "<p>Content</p>";
      const page = renderer.generateFullPage(content);
      expect(page).toContain("<style>");
      expect(page).toContain("</style>");
    });
  });

  describe("CSS Generation", () => {
    test("generates CSS", () => {
      const css = renderer.generateCSS();
      expect(css).toBeDefined();
      expect(css.length).toBeGreaterThan(0);
      expect(css).toContain("body");
      expect(css).toContain("h1");
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
      expect(md).toContain("# ");
      expect(md).toContain("Title");
    });

    test("renders paragraph", () => {
      const node = {
        type: "paragraph",
        children: [{ type: "text", text: "Text" }],
      };
      const md = renderer.render(node);
      expect(md).toContain("Text");
    });

    test("renders code block", () => {
      const node = {
        type: "codeBlock",
        language: "js",
        code: "const x = 1;",
      };
      const md = renderer.render(node);
      expect(md).toContain("```js");
      expect(md).toContain("const x = 1;");
    });

    test("renders link", () => {
      const node = {
        type: "link",
        href: "https://example.com",
        children: [{ type: "text", text: "Link" }],
      };
      const md = renderer.render(node);
      expect(md).toContain("[");
      expect(md).toContain("]");
      expect(md).toContain("(https://example.com)");
    });

    test("renders strong", () => {
      const node = {
        type: "strong",
        children: [{ type: "text", text: "bold" }],
      };
      const md = renderer.render(node);
      expect(md).toContain("**");
    });

    test("renders em", () => {
      const node = {
        type: "em",
        children: [{ type: "text", text: "italic" }],
      };
      const md = renderer.render(node);
      expect(md).toContain("*");
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
      expect(md).toContain("- ");
    });
  });
});
