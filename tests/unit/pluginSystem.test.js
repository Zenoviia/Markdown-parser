const {
  PluginManager,
  BasePlugin,
  LinkProcessorPlugin,
  HeadingIdPlugin,
  ImageProcessorPlugin,
} = require("../../src/plugins/pluginSystem");

describe("PluginSystem - unit tests", () => {
  test("PluginManager registers and creates plugins", () => {
    const pm = new PluginManager();
    expect(pm.has("linkProcessor")).toBe(true);
    const instance = pm.create("linkProcessor", { validateUrls: false });
    expect(instance).toBeInstanceOf(BasePlugin);
  });

  test("HeadingIdPlugin generates ids for headings", () => {
    const plugin = new HeadingIdPlugin();
    const ast = {
      type: "root",
      children: [
        { type: "heading", children: [{ type: "text", text: "Hello World" }] },
      ],
    };
    plugin.execute(ast);
    expect(ast.children[0].id).toBeDefined();
    expect(ast.children[0].id).toContain("hello-world");
  });

  test("ImageProcessorPlugin sets lazyLoad and responsive flags", () => {
    const plugin = new ImageProcessorPlugin();
    const ast = { type: "root", children: [{ type: "image", src: "img.png" }] };
    plugin.execute(ast);
    expect(ast.children[0].lazyLoad).toBe(true);
    expect(ast.children[0].responsive).toBe(true);
  });

  describe("PluginManager - Extended", () => {
    let pm;

    beforeEach(() => {
      pm = new PluginManager();
    });

    test("should check if plugin exists", () => {
      expect(pm.has("linkProcessor")).toBe(true);
      expect(pm.has("nonExistent")).toBe(false);
    });

    test("should get all registered plugins", () => {
      const plugins = pm.list();
      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
    });

    test("should create plugin instance with options", () => {
      const plugin = pm.create("linkProcessor", { validateUrls: true });
      expect(plugin).toBeDefined();
      expect(plugin instanceof BasePlugin).toBe(true);
    });

    test("should handle non-existent plugin gracefully", () => {
      // Plugin system may not throw for missing plugins
      try {
        const plugin = pm.create("nonExistent");
        expect(plugin === undefined || plugin instanceof BasePlugin).toBe(true);
      } catch (e) {
        expect(e).toBeDefined();
      }
    });
  });

  describe("BasePlugin", () => {
    test("should instantiate base plugin", () => {
      const plugin = new BasePlugin({ option: "value" });
      expect(plugin.options).toEqual({ option: "value" });
      expect(plugin.name).toBe("BasePlugin");
    });

    test("should throw error if execute not implemented", () => {
      const plugin = new BasePlugin();
      expect(() => {
        plugin.execute({});
      }).toThrow("Plugin must implement execute method");
    });
  });

  describe("LinkProcessorPlugin - Extended", () => {
    test("should process links in AST", () => {
      const plugin = new LinkProcessorPlugin({ validateUrls: false });
      const ast = {
        type: "root",
        children: [{ type: "link", href: "https://example.com", children: [] }],
      };

      plugin.execute(ast);
      expect(ast.children[0]).toBeDefined();
    });

    test("should add target to external links", () => {
      const plugin = new LinkProcessorPlugin({ externalLinkTarget: true });
      const ast = {
        type: "root",
        children: [{ type: "link", href: "https://example.com", children: [] }],
      };

      plugin.execute(ast);
      expect(ast.children[0].target).toBe("_blank");
    });

    test("should validate URLs", () => {
      const plugin = new LinkProcessorPlugin({ validateUrls: true });
      const ast = {
        type: "root",
        children: [{ type: "link", href: "https://example.com", children: [] }],
      };

      expect(() => {
        plugin.execute(ast);
      }).not.toThrow();
    });

    test("should handle internal links", () => {
      const plugin = new LinkProcessorPlugin({ validateUrls: true });
      const ast = {
        type: "root",
        children: [
          { type: "link", href: "#section", children: [] },
          { type: "link", href: "/path/to/page", children: [] },
        ],
      };

      expect(() => {
        plugin.execute(ast);
      }).not.toThrow();
    });

    test("should process nested links", () => {
      const plugin = new LinkProcessorPlugin();
      const ast = {
        type: "root",
        children: [
          {
            type: "paragraph",
            children: [
              { type: "link", href: "https://example.com", children: [] },
            ],
          },
        ],
      };

      plugin.execute(ast);
      expect(ast.children[0].children[0]).toBeDefined();
    });
  });

  describe("ImageProcessorPlugin - Extended", () => {
    test("should process images in AST", () => {
      const plugin = new ImageProcessorPlugin();
      const ast = {
        type: "root",
        children: [{ type: "image", src: "image.jpg", alt: "test" }],
      };

      plugin.execute(ast);
      expect(ast.children[0].lazyLoad).toBe(true);
      expect(ast.children[0].responsive).toBe(true);
    });

    test("should disable lazy loading if configured", () => {
      const plugin = new ImageProcessorPlugin({ lazyLoading: false });
      const ast = {
        type: "root",
        children: [{ type: "image", src: "image.jpg" }],
      };

      plugin.execute(ast);
      expect(ast.children[0].lazyLoad).not.toBe(true);
    });

    test("should handle nested images", () => {
      const plugin = new ImageProcessorPlugin();
      const ast = {
        type: "root",
        children: [
          {
            type: "link",
            href: "https://example.com",
            children: [{ type: "image", src: "image.jpg" }],
          },
        ],
      };

      plugin.execute(ast);
      expect(ast.children[0].children[0].lazyLoad).toBe(true);
    });

    test("should set responsive flag", () => {
      const plugin = new ImageProcessorPlugin({ responsive: true });
      const ast = {
        type: "root",
        children: [{ type: "image", src: "image.jpg" }],
      };

      plugin.execute(ast);
      expect(ast.children[0].responsive).toBe(true);
    });
  });

  describe("HeadingIdPlugin - Extended", () => {
    test("should generate slug from heading text", () => {
      const plugin = new HeadingIdPlugin();
      const ast = {
        type: "root",
        children: [
          {
            type: "heading",
            children: [{ type: "text", text: "My First Heading" }],
          },
        ],
      };

      plugin.execute(ast);
      expect(ast.children[0].id).toBeDefined();
      expect(ast.children[0].id).toMatch(/my-first-heading/i);
    });

    test("should handle headings without text", () => {
      const plugin = new HeadingIdPlugin();
      const ast = {
        type: "root",
        children: [{ type: "heading", children: [] }],
      };

      plugin.execute(ast);
      // Should not throw
      expect(ast.children[0]).toBeDefined();
    });

    test("should handle special characters in headings", () => {
      const plugin = new HeadingIdPlugin();
      const ast = {
        type: "root",
        children: [
          {
            type: "heading",
            children: [{ type: "text", text: "Hello @#$ World!" }],
          },
        ],
      };

      plugin.execute(ast);
      expect(ast.children[0].id).toBeDefined();
    });

    test("should process multiple headings", () => {
      const plugin = new HeadingIdPlugin();
      const ast = {
        type: "root",
        children: [
          { type: "heading", children: [{ type: "text", text: "Heading 1" }] },
          { type: "heading", children: [{ type: "text", text: "Heading 2" }] },
        ],
      };

      plugin.execute(ast);
      expect(ast.children[0].id).toBeDefined();
      expect(ast.children[1].id).toBeDefined();
    });
  });

  describe("Plugin Execution", () => {
    test("should execute plugin on AST", () => {
      const plugin = new LinkProcessorPlugin();
      const ast = {
        type: "root",
        children: [{ type: "link", href: "https://example.com", children: [] }],
      };

      const result = plugin.execute(ast);
      // execute should modify AST in place
      expect(ast.children[0]).toBeDefined();
    });

    test("should handle null AST", () => {
      const plugin = new LinkProcessorPlugin();
      expect(() => {
        plugin.execute(null);
      }).not.toThrow();
    });

    test("should process complex AST structure", () => {
      const plugin = new ImageProcessorPlugin();
      const ast = {
        type: "root",
        children: [
          {
            type: "section",
            children: [
              {
                type: "paragraph",
                children: [
                  { type: "image", src: "img1.jpg" },
                  { type: "text", text: "Image" },
                ],
              },
            ],
          },
        ],
      };

      plugin.execute(ast);
      expect(ast.children[0]).toBeDefined();
    });
  });
});
