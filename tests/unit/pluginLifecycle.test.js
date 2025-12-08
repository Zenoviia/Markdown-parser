const {
  PluginManager,
  HeadingIdPlugin,
  ImageProcessorPlugin,
} = require("../../src/plugins/pluginSystem");

describe("Plugin lifecycle and behavior", () => {
  test("HeadingIdPlugin assigns ids to headings", () => {
    const pm = new PluginManager();
    const plugin = pm.create("headingId");

    const ast = {
      type: "root",
      children: [
        {
          type: "heading",
          level: 1,
          children: [{ type: "text", text: "Hello World" }],
        },
      ],
    };

    plugin.execute(ast);

    expect(ast.children[0].id).toBeDefined();
    expect(ast.children[0].id).toMatch(/hello-world/);
  });

  test("ImageProcessorPlugin applies lazyLoading and responsive flags", () => {
    const pm = new PluginManager();
    const plugin = pm.create("imageProcessor", { lazyLoading: true, responsive: false });

    const ast = {
      type: "root",
      children: [
        {
          type: "paragraph",
          children: [
            { type: "image", alt: "alt", src: "img.png", title: "t" },
          ],
        },
      ],
    };

    plugin.execute(ast);

    const img = ast.children[0].children[0];
    expect(img.lazyLoad).toBe(true);
    // responsive option passed as false is not applied (plugin only sets true)
    expect(img.responsive).toBeUndefined();
  });
});
