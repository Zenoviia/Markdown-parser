/**
 * Plugin System
 * Система для розширення парсера за допомогою плагінів
 */

/**
 * Базовий клас для плагінів
 */
class BasePlugin {
  constructor(options = {}) {
    this.options = options;
    this.name = this.constructor.name;
  }

  /**
   * Виконується парсером
   * @param {object} ast - AST для обробки
   */
  execute(ast) {
    throw new Error("Plugin must implement execute method");
  }
}

/**
 * Плагін для обробки посилань
 */
class LinkProcessorPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "LinkProcessor";
  }

  execute(ast) {
    this.processLinks(ast);
  }

  processLinks(node) {
    if (!node) return;

    if (node.type === "link") {
      // Можна добавити валідацію, логування тощо
      if (this.options.validateUrls) {
        this.validateUrl(node.href);
      }
      if (this.options.externalLinkTarget) {
        node.target = "_blank";
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.processLinks(child));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.processLinks(item));
    }
  }

  validateUrl(url) {
    try {
      new URL(url);
    } catch {
      if (!url.startsWith("#") && !url.startsWith("/")) {
        console.warn(`Invalid URL: ${url}`);
      }
    }
  }
}

/**
 * Плагін для обробки зображень
 */
class ImageProcessorPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "ImageProcessor";
    this.options = {
      lazyLoading: true,
      responsive: true,
      ...options,
    };
  }

  execute(ast) {
    this.processImages(ast);
  }

  processImages(node) {
    if (!node) return;

    if (node.type === "image") {
      if (this.options.lazyLoading) {
        node.lazyLoad = true;
      }
      if (this.options.responsive) {
        node.responsive = true;
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.processImages(child));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.processImages(item));
    }
  }
}

/**
 * Плагін для додавання ID до заголовків
 */
class HeadingIdPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "HeadingId";
  }

  execute(ast) {
    this.processHeadings(ast);
  }

  processHeadings(node) {
    if (!node) return;

    if (node.type === "heading") {
      if (!node.id) {
        node.id = this.generateId(node);
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.processHeadings(child));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.processHeadings(item));
    }
  }

  generateId(node) {
    const text = this.extractText(node);
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  extractText(node) {
    if (node.type === "text") {
      return node.text || "";
    }

    let text = "";
    if (node.children && Array.isArray(node.children)) {
      text = node.children.map((child) => this.extractText(child)).join("");
    }
    return text;
  }
}

/**
 * Плагін для синтаксичного підсвічення
 */
class CodeHighlightPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "CodeHighlight";
  }

  execute(ast) {
    this.processCodeBlocks(ast);
  }

  processCodeBlocks(node) {
    if (!node) return;

    if (node.type === "codeBlock") {
      node.highlighted = true;
      // Тут можна додати інтеграцію з highlight.js
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.processCodeBlocks(child));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.processCodeBlocks(item));
    }
  }
}

/**
 * Плагін для додавання класів до елементів
 */
class ClassNamePlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "ClassName";
    this.classMap = options.classMap || {};
  }

  execute(ast) {
    this.addClassNames(ast);
  }

  addClassNames(node) {
    if (!node) return;

    if (this.classMap[node.type]) {
      node.className = this.classMap[node.type];
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.addClassNames(child));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.addClassNames(item));
    }
  }
}

/**
 * Плагін для сніпетів коду
 */
class CodeSnippetPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "CodeSnippet";
  }

  execute(ast) {
    this.processSnippets(ast);
  }

  processSnippets(node) {
    if (!node) return;

    if (node.type === "codeBlock") {
      if (node.language) {
        node.snippet = true;
        node.copyable = true;
        node.lineNumbers = true;
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.processSnippets(child));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.processSnippets(item));
    }
  }
}

/**
 * Плагін для обробки посилань на якорі
 */
class AnchorLinkPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "AnchorLink";
  }

  execute(ast) {
    this.processAnchorLinks(ast);
    this.addTableOfContents(ast);
  }

  processAnchorLinks(node) {
    if (!node) return;

    if (node.type === "heading" && !node.id) {
      node.id = this.generateId(node);
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.processAnchorLinks(child));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.processAnchorLinks(item));
    }
  }

  generateId(node) {
    const text = this.extractText(node);
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  extractText(node) {
    if (node.type === "text") {
      return node.text || "";
    }

    let text = "";
    if (node.children && Array.isArray(node.children)) {
      text = node.children.map((child) => this.extractText(child)).join("");
    }
    return text;
  }

  addTableOfContents(ast) {
    // Додає метадані для оглавлення
    if (ast.type === "root") {
      const headings = this.extractHeadings(ast);
      ast.toc = headings;
    }
  }

  extractHeadings(node, headings = []) {
    if (!node) return headings;

    if (node.type === "heading") {
      headings.push({
        level: node.level,
        text: this.extractText(node),
        id: node.id,
      });
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.extractHeadings(child, headings));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.extractHeadings(item, headings));
    }

    return headings;
  }
}

/**
 * Плагін для обробки смайликів
 */
class EmojiPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "Emoji";
    this.emojiMap = {
      ":)": "😊",
      ":(": "😞",
      ":D": "😄",
      ":P": "😛",
      ":/": "😕",
      ":O": "😮",
    };
  }

  execute(ast) {
    this.processEmojis(ast);
  }

  processEmojis(node) {
    if (!node) return;

    if (node.type === "text") {
      // Escape emoji codes before building RegExp to avoid invalid patterns
      const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      for (const [code, emoji] of Object.entries(this.emojiMap)) {
        if (node.text && node.text.includes(code)) {
          const re = new RegExp(escapeRegExp(code), "g");
          node.text = node.text.replace(re, emoji);
        }
      }
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => this.processEmojis(child));
    }

    if (node.items && Array.isArray(node.items)) {
      node.items.forEach((item) => this.processEmojis(item));
    }
  }
}

/**
 * Плагін для валідації структури
 */
class StructureValidatorPlugin extends BasePlugin {
  constructor(options = {}) {
    super(options);
    this.name = "StructureValidator";
    this.errors = [];
  }

  execute(ast) {
    this.errors = [];
    this.validate(ast);
    if (this.errors.length > 0) {
      console.warn("Structure validation errors:", this.errors);
    }
  }

  validate(node, level = 0) {
    if (!node) {
      this.errors.push("Null node encountered");
      return;
    }

    if (!node.type) {
      this.errors.push(`Node at level ${level} has no type`);
      return;
    }

    if (node.children && !Array.isArray(node.children)) {
      this.errors.push(`Node ${node.type} has children that is not an array`);
    } else if (node.children) {
      node.children.forEach((child) => this.validate(child, level + 1));
    }

    if (node.items && !Array.isArray(node.items)) {
      this.errors.push(`Node ${node.type} has items that is not an array`);
    } else if (node.items) {
      node.items.forEach((item) => this.validate(item, level + 1));
    }
  }

  getErrors() {
    return this.errors;
  }
}

/**
 * Менеджер плагінів
 */
class PluginManager {
  constructor() {
    this.plugins = new Map();
    this.registerDefaultPlugins();
  }

  /**
   * Реєструє плагіни за замовчуванням
   * @private
   */
  registerDefaultPlugins() {
    this.register("linkProcessor", LinkProcessorPlugin);
    this.register("imageProcessor", ImageProcessorPlugin);
    this.register("headingId", HeadingIdPlugin);
    this.register("codeHighlight", CodeHighlightPlugin);
    this.register("className", ClassNamePlugin);
    this.register("codeSnippet", CodeSnippetPlugin);
    this.register("anchorLink", AnchorLinkPlugin);
    this.register("emoji", EmojiPlugin);
    this.register("structureValidator", StructureValidatorPlugin);
  }

  /**
   * Реєструє плагін
   * @param {string} name - Назва плагіна
   * @param {class} PluginClass - Клас плагіна
   */
  register(name, PluginClass) {
    this.plugins.set(name, PluginClass);
  }

  /**
   * Отримує плагін за назвою
   * @param {string} name - Назва плагіна
   * @returns {class|undefined} Клас плагіна
   */
  get(name) {
    return this.plugins.get(name);
  }

  /**
   * Перевіряє наявність плагіна
   * @param {string} name - Назва плагіна
   * @returns {boolean} Результат
   */
  has(name) {
    return this.plugins.has(name);
  }

  /**
   * Отримує список всіх плагінів
   * @returns {array} Список назв плагінів
   */
  list() {
    return Array.from(this.plugins.keys());
  }

  /**
   * Створює екземпляр плагіна
   * @param {string} name - Назва плагіна
   * @param {object} options - Опції плагіна
   * @returns {BasePlugin|undefined} Екземпляр плагіна
   */
  create(name, options = {}) {
    const PluginClass = this.plugins.get(name);
    if (!PluginClass) return undefined;
    return new PluginClass(options);
  }
}

module.exports = {
  BasePlugin,
  LinkProcessorPlugin,
  ImageProcessorPlugin,
  HeadingIdPlugin,
  CodeHighlightPlugin,
  ClassNamePlugin,
  CodeSnippetPlugin,
  AnchorLinkPlugin,
  EmojiPlugin,
  StructureValidatorPlugin,
  PluginManager,
};
