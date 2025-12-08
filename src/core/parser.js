/**
 * Markdown Parser - Core Parser Module
 * Основний модуль парсера для обробки Markdown документів
 */

const Tokenizer = require("./tokenizer");
const ASTBuilder = require("./astBuilder");
const Renderer = require("../renderers/htmlRenderer");

/**
 * Головний клас Parser для обробки Markdown
 */
class MarkdownParser {
  constructor(options = {}) {
    this.options = {
      breaks: options.breaks || false,
      pedantic: options.pedantic || false,
      gfm: options.gfm || true,
      tables: options.tables || true,
      strikethrough: options.strikethrough || true,
      taskLists: options.taskLists || true,
      smartypants: options.smartypants || false,
      langPrefix: options.langPrefix || "language-",
      sanitize: options.sanitize || false,
      ...options,
    };

    this.tokenizer = new Tokenizer(this.options);
    this.astBuilder = new ASTBuilder(this.options);
    this.renderer = new Renderer(this.options);
    this.plugins = new Map();
    this.extensions = new Map();
  }

  /**
   * Парсує Markdown текст і повертає HTML
   * @param {string} markdown - Markdown текст
   * @returns {string} HTML
   */
  parse(markdown) {
    if (typeof markdown !== "string") {
      throw new TypeError("Markdown must be a string");
    }

    // Нормалізація переносів рядків
    const normalized = this.normalizeLineEndings(markdown);

    // Токенізація
    const tokens = this.tokenizer.tokenize(normalized);

    // Валідація токенів
    this.validateTokens(tokens);

    // Побудова AST
    const ast = this.astBuilder.build(tokens);

    // Застосування плагінів до AST
    this.applyPluginsToAST(ast);

    // Рендеринг
    const html = this.renderer.render(ast);

    return html.trim();
  }

  /**
   * Парсує Markdown і повертає JSON AST
   * @param {string} markdown - Markdown текст
   * @returns {object} AST у форматі JSON
   */
  parseToAST(markdown) {
    if (typeof markdown !== "string") {
      throw new TypeError("Markdown must be a string");
    }

    const normalized = this.normalizeLineEndings(markdown);
    const tokens = this.tokenizer.tokenize(normalized);
    this.validateTokens(tokens);
    const ast = this.astBuilder.build(tokens);
    this.applyPluginsToAST(ast);

    return ast;
  }

  /**
   * Парсує Markdown з користувацьким рендерером
   * @param {string} markdown - Markdown текст
   * @param {object} renderer - Кастомний рендерер
   * @returns {string} Результат рендеринга
   */
  parseWithRenderer(markdown, renderer) {
    if (typeof markdown !== "string") {
      throw new TypeError("Markdown must be a string");
    }

    if (!renderer || typeof renderer.render !== "function") {
      throw new TypeError("Renderer must have a render method");
    }

    const normalized = this.normalizeLineEndings(markdown);
    const tokens = this.tokenizer.tokenize(normalized);
    this.validateTokens(tokens);
    const ast = this.astBuilder.build(tokens);
    this.applyPluginsToAST(ast);

    return renderer.render(ast);
  }

  /**
   * Регіструє плагін
   * @param {string} name - Назва плагіна
   * @param {function} plugin - Функція плагіна
   */
  use(name, plugin) {
    if (typeof name === "function") {
      plugin = name;
      name = plugin.name || `plugin_${this.plugins.size}`;
    }

    if (typeof plugin !== "function") {
      throw new TypeError("Plugin must be a function");
    }

    this.plugins.set(name, plugin);
    return this;
  }

  /**
   * Реєструє розширення
   * @param {string} name - Назва розширення
   * @param {object} extension - Об'єкт розширення
   */
  extend(name, extension) {
    if (typeof extension !== "object" || extension === null) {
      throw new TypeError("Extension must be an object");
    }

    this.extensions.set(name, extension);

    if (extension.tokenRules) {
      this.tokenizer.addTokenRules(extension.tokenRules);
    }

    if (extension.renderers) {
      Object.entries(extension.renderers).forEach(([type, renderer]) => {
        this.renderer.addRenderer(type, renderer);
      });
    }

    return this;
  }

  /**
   * Видаляє плагін
   * @param {string} name - Назва плагіна
   */
  unuse(name) {
    return this.plugins.delete(name);
  }

  /**
   * Видаляє розширення
   * @param {string} name - Назва розширення
   */
  unextend(name) {
    return this.extensions.delete(name);
  }

  /**
   * Нормалізує переноси рядків
   * @private
   * @param {string} text - Текст
   * @returns {string} Нормалізований текст
   */
  normalizeLineEndings(text) {
    return text
      .replace(/\r\n/g, "\n") // Windows -> Unix
      .replace(/\r/g, "\n"); // Old Mac -> Unix
  }

  /**
   * Валідує токени
   * @private
   * @param {array} tokens - Масив токенів
   */
  validateTokens(tokens) {
    if (!Array.isArray(tokens)) {
      throw new TypeError("Tokens must be an array");
    }

    tokens.forEach((token, index) => {
      if (!token.type) {
        throw new Error(`Token at index ${index} is missing type property`);
      }
      if (token.type === "list" && !Array.isArray(token.items)) {
        throw new Error(`List token at index ${index} must have items array`);
      }
    });
  }

  /**
   * Застосовує плагіни до AST
   * @private
   * @param {object} ast - Синтаксичне дерево
   */
  applyPluginsToAST(ast) {
    for (const [name, plugin] of this.plugins) {
      try {
        plugin(ast);
      } catch (error) {
        console.warn(`Plugin '${name}' failed:`, error.message);
      }
    }
  }

  /**
   * Налаштовує опції парсера
   * @param {object} options - Нові опції
   */
  setOptions(options) {
    this.options = { ...this.options, ...options };
    this.tokenizer.options = this.options;
    this.astBuilder.options = this.options;
    this.renderer.options = this.options;
    return this;
  }

  /**
   * Повертає поточні опції
   * @returns {object} Опції парсера
   */
  getOptions() {
    return { ...this.options };
  }

  /**
   * Статистика про документ
   * @param {string} markdown - Markdown текст
   * @returns {object} Статистика
   */
  getStatistics(markdown) {
    if (typeof markdown !== "string") {
      throw new TypeError("Markdown must be a string");
    }

    const normalized = this.normalizeLineEndings(markdown);
    const tokens = this.tokenizer.tokenize(normalized);
    const ast = this.astBuilder.build(tokens);

    return {
      lines: normalized.split("\n").length,
      characters: markdown.length,
      tokens: tokens.length,
      nodes: this.countNodes(ast),
      headings: this.countHeadings(ast),
      links: this.countLinks(ast),
      images: this.countImages(ast),
      lists: this.countLists(ast),
      codeBlocks: this.countCodeBlocks(ast),
      tables: this.countTables(ast),
    };
  }

  /**
   * Лічить вузли в AST
   * @private
   * @param {object} node - Вузол
   * @returns {number} Кількість вузлів
   */
  countNodes(node) {
    if (!node) return 0;
    let count = 1;
    if (Array.isArray(node.children)) {
      count += node.children.reduce(
        (sum, child) => sum + this.countNodes(child),
        0
      );
    }
    return count;
  }

  /**
   * Лічить заголовки
   * @private
   * @param {object} node - Вузол
   * @returns {number} Кількість заголовків
   */
  countHeadings(node) {
    if (!node) return 0;
    let count = node.type === "heading" ? 1 : 0;
    if (Array.isArray(node.children)) {
      count += node.children.reduce(
        (sum, child) => sum + this.countHeadings(child),
        0
      );
    }
    return count;
  }

  /**
   * Лічить посилання
   * @private
   * @param {object} node - Вузол
   * @returns {number} Кількість посилань
   */
  countLinks(node) {
    if (!node) return 0;
    let count = node.type === "link" ? 1 : 0;
    if (Array.isArray(node.children)) {
      count += node.children.reduce(
        (sum, child) => sum + this.countLinks(child),
        0
      );
    }
    return count;
  }

  /**
   * Лічить зображення
   * @private
   * @param {object} node - Вузол
   * @returns {number} Кількість зображень
   */
  countImages(node) {
    if (!node) return 0;
    let count = node.type === "image" ? 1 : 0;
    if (Array.isArray(node.children)) {
      count += node.children.reduce(
        (sum, child) => sum + this.countImages(child),
        0
      );
    }
    return count;
  }

  /**
   * Лічить списки
   * @private
   * @param {object} node - Вузол
   * @returns {number} Кількість списків
   */
  countLists(node) {
    if (!node) return 0;
    let count = node.type === "list" || node.type === "orderedList" ? 1 : 0;
    if (Array.isArray(node.children)) {
      count += node.children.reduce(
        (sum, child) => sum + this.countLists(child),
        0
      );
    }
    return count;
  }

  /**
   * Лічить блоки коду
   * @private
   * @param {object} node - Вузол
   * @returns {number} Кількість блоків коду
   */
  countCodeBlocks(node) {
    if (!node) return 0;
    let count = node.type === "codeBlock" ? 1 : 0;
    if (Array.isArray(node.children)) {
      count += node.children.reduce(
        (sum, child) => sum + this.countCodeBlocks(child),
        0
      );
    }
    return count;
  }

  /**
   * Лічить таблиці
   * @private
   * @param {object} node - Вузол
   * @returns {number} Кількість таблиць
   */
  countTables(node) {
    if (!node) return 0;
    let count = node.type === "table" ? 1 : 0;
    if (Array.isArray(node.children)) {
      count += node.children.reduce(
        (sum, child) => sum + this.countTables(child),
        0
      );
    }
    return count;
  }

  /**
   * Експортує AST у JSON
   * @param {string} markdown - Markdown текст
   * @returns {string} JSON представлення AST
   */
  exportAsJSON(markdown) {
    const ast = this.parseToAST(markdown);
    return JSON.stringify(ast, null, 2);
  }

  /**
   * Копіює парсер з новими опціями
   * @param {object} options - Нові опції
   * @returns {MarkdownParser} Новий парсер
   */
  clone(options = {}) {
    return new MarkdownParser({ ...this.options, ...options });
  }

  /**
   * Валідує Markdown синтаксис
   * @param {string} markdown - Markdown текст
   * @returns {object} Результат валідації
   */
  validate(markdown) {
    if (typeof markdown !== "string") {
      return {
        valid: false,
        errors: ["Input must be a string"],
      };
    }

    const errors = [];

    try {
      const normalized = this.normalizeLineEndings(markdown);
      const tokens = this.tokenizer.tokenize(normalized);
      this.validateTokens(tokens);
      const ast = this.astBuilder.build(tokens);

      if (!ast || typeof ast !== "object") {
        errors.push("AST build failed");
      }
    } catch (error) {
      errors.push(error.message);
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  }
}

module.exports = MarkdownParser;
