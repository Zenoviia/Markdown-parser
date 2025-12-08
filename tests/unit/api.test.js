const api = require("../../src/api");

describe("API Module - unit tests", () => {
  test("parseMarkdown returns HTML string", () => {
    const html = api.parseMarkdown("# Title\n\nContent");
    expect(typeof html).toBe("string");
    expect(html).toContain("<h1");
  });

  test("parseToAST returns an object with type root", () => {
    const ast = api.parseToAST("# H");
    expect(ast).toBeDefined();
    expect(ast.type).toBe("root");
  });

  test("getStatistics returns expected fields", () => {
    const stats = api.getStatistics("# H\n\nContent");
    expect(stats).toHaveProperty("lines");
    expect(stats).toHaveProperty("headings");
  });
});
