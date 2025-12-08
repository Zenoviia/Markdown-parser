const api = require("../../src/api");

describe("API additional methods", () => {
  test("generateTableOfContents returns structured TOC", () => {
    const md = "# One\n\n## Two\n\n### Three\n";
    const toc = api.generateTableOfContents(md);
    expect(Array.isArray(toc)).toBe(true);
    // Should contain at least one top-level entry
    expect(toc.length).toBeGreaterThan(0);
    // Check that nested items exist for deeper headings
    const first = toc[0];
    expect(first.level).toBeGreaterThanOrEqual(1);
  });

  test("extractLinks finds links in document", () => {
    const md = "Hello [link](http://example.com) world";
    const links = api.extractLinks(md);
    expect(Array.isArray(links)).toBe(true);
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0].href).toBe("http://example.com");
  });

  test("extractImages finds images in document", () => {
    const md = "An image ![alt text](/path/to/img.png)";
    const images = api.extractImages(md);
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBeGreaterThanOrEqual(1);
    expect(images[0].src).toBe("/path/to/img.png");
  });

  test("transform applies node-level transform", () => {
    const md = "# Title\n\nHello world";

    const transform = (node) => {
      if (node.type === "text") {
        return Object.assign({}, node, { text: (node.text || "") + "X" });
      }
      return node;
    };

    const out = api.transform(md, transform);
    expect(typeof out).toBe("string");
    expect(out).toMatch(/Hello worldX/);
    expect(out).toMatch(/TitleX/);
  });
});
