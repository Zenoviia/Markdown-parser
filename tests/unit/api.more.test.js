const api = require("../../src/api");

describe("API additional coverage", () => {
  test("filterByType returns nodes of given type", () => {
    const md = "# H1\n\nParagraph\n\n## H2\n\nAnother";
    const nodes = api.filterByType(md, "heading");
    expect(Array.isArray(nodes)).toBe(true);
    expect(nodes.length).toBeGreaterThanOrEqual(2);
    nodes.forEach((n) => expect(n.type).toBe("heading"));
  });

  test("getQuickParser and getStrictParser return parser instances", () => {
    const quick = api.getQuickParser();
    const strict = api.getStrictParser();
    expect(quick).toBeDefined();
    expect(strict).toBeDefined();
    // Basic behavior: both should have parse or parseToAST methods
    expect(typeof quick.parse === "function" || typeof quick.parseToAST === "function").toBe(true);
    expect(typeof strict.parse === "function" || typeof strict.parseToAST === "function").toBe(true);
  });

  test("generateHTMLPage returns a full HTML document string", () => {
    const md = "# Title\n\nBody text";
    const html = api.generateHTMLPage(md, { title: "Doc" });
    expect(typeof html).toBe("string");
    expect(html.toLowerCase()).toMatch(/<html|<!doctype/);
  });

  test("getVersion and getInfo return metadata", () => {
    const v = api.getVersion();
    const info = api.getInfo();
    expect(typeof v).toBe("string");
    expect(info).toBeDefined();
    expect(info).toHaveProperty("name");
    expect(info).toHaveProperty("version");
  });
});
