/**
 * API Module
 * Публічний API для использання парсера як бібліотеки
 */

const MarkdownParser = require("../core/parser");
const HTMLRenderer = require("../renderers/htmlRenderer");
const MarkdownRenderer = require("../renderers/markdownRenderer");
const { PluginManager } = require("../plugins/pluginSystem");
const Tokenizer = require("../core/tokenizer");
const ASTBuilder = require("../core/astBuilder");

/**
 * Головний експортний об'єкт API
 */
class MarkdownAPI {
  constructor() {
    this.version = "1.0.0";
    this.ParserClass = MarkdownParser;
    this.HTMLRendererClass = HTMLRenderer;
    this.MarkdownRendererClass = MarkdownRenderer;
    this.PluginManager = PluginManager;
    this.TokenizerClass = Tokenizer;
    this.ASTBuilderClass = ASTBuilder;
  }

  /**
   * Створює новий парсер
   * @param {object} options - Опції парсера
   * @returns {MarkdownParser} Новий парсер
   */
  createParser(options = {}) {
    return new MarkdownParser(options);
  }

  /**
   * Створює новий HTML рендерер
   * @param {object} options - Опції рендеринга
   * @returns {HTMLRenderer} Новий HTML рендерер
   */
  createHTMLRenderer(options = {}) {
    return new HTMLRenderer(options);
  }

  /**
   * Створює новий Markdown рендерер
   * @param {object} options - Опції рендеринга
   * @returns {MarkdownRenderer} Новий Markdown рендерер
   */
  createMarkdownRenderer(options = {}) {
    return new MarkdownRenderer(options);
  }

  /**
   * Створює новий менеджер плагінів
   * @returns {PluginManager} Менеджер плагінів
   */
  createPluginManager() {
    return new PluginManager();
  }

  /**
   * Конвертує Markdown у HTML
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції парсера
   * @returns {string} HTML
   */
  parseMarkdown(markdown, options = {}) {
    const parser = new MarkdownParser(options);
    return parser.parse(markdown);
  }

  /**
   * Парсить Markdown і повертає AST
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції парсера
   * @returns {object} AST
   */
  parseToAST(markdown, options = {}) {
    const parser = new MarkdownParser(options);
    return parser.parseToAST(markdown);
  }

  /**
   * Генерує повну HTML сторінку
   * @param {string} markdown - Markdown текст
   * @param {object} meta - Метадані
   * @param {object} options - Опції парсера
   * @returns {string} Повна HTML сторінка
   */
  generateHTMLPage(markdown, meta = {}, options = {}) {
    const parser = new MarkdownParser(options);
    const renderer = new HTMLRenderer(options);
    const html = parser.parse(markdown);
    return renderer.generateFullPage(html, meta);
  }

  /**
   * Валідує Markdown
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції парсера
   * @returns {object} Результат валідації
   */
  validate(markdown, options = {}) {
    const parser = new MarkdownParser(options);
    return parser.validate(markdown);
  }

  /**
   * Отримує статистику документа
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції парсера
   * @returns {object} Статистика
   */
  getStatistics(markdown, options = {}) {
    const parser = new MarkdownParser(options);
    return parser.getStatistics(markdown);
  }

  /**
   * Генерує оглавлення
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції парсера
   * @returns {array} Оглавлення
   */
  generateTableOfContents(markdown, options = {}) {
    const parser = new MarkdownParser(options);
    const ast = parser.parseToAST(markdown);
    const builder = new ASTBuilder(options);
    return builder.generateTableOfContents(ast);
  }

  /**
   * Екстрактує посилання з документа
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції парсера
   * @returns {array} Масив посилань
   */
  extractLinks(markdown, options = {}) {
    const parser = new MarkdownParser(options);
    const ast = parser.parseToAST(markdown);
    const builder = new ASTBuilder(options);
    return builder.extractLinks(ast);
  }

  /**
   * Екстрактує зображення з документа
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції парсера
   * @returns {array} Масив зображень
   */
  extractImages(markdown, options = {}) {
    const parser = new MarkdownParser(options);
    const ast = parser.parseToAST(markdown);
    const builder = new ASTBuilder(options);
    return builder.extractImages(ast);
  }

  /**
   * Екстрактує заголовки з документа
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції парсера
   * @returns {array} Масив заголовків
   */
  extractHeadings(markdown, options = {}) {
    const parser = new MarkdownParser(options);
    const ast = parser.parseToAST(markdown);
    const builder = new ASTBuilder(options);
    return builder.extractHeadings(ast);
  }

  /**
   * Трансформує документ за допомогою функції
   * @param {string} markdown - Markdown текст
   * @param {function} transform - Функція трансформації
   * @param {object} options - Опції парсера
   * @returns {string} Трансформований Markdown
   */
  transform(markdown, transform, options = {}) {
    const parser = new MarkdownParser(options);
    const ast = parser.parseToAST(markdown);
    const builder = new ASTBuilder(options);
    const transformed = builder.transform(ast, transform);
    const renderer = new MarkdownRenderer(options);
    return renderer.render(transformed);
  }

  /**
   * Фільтрує вузли за типом
   * @param {string} markdown - Markdown текст
   * @param {string} type - Тип вузла
   * @param {object} options - Опції парсера
   * @returns {array} Масив вузлів
   */
  filterByType(markdown, type, options = {}) {
    const parser = new MarkdownParser(options);
    const ast = parser.parseToAST(markdown);
    const builder = new ASTBuilder(options);
    return builder.filterByType(ast, type);
  }

  /**
   * Побудовує простий парсер для швидкого використання
   * @returns {MarkdownParser} Парсер з опціями за замовчуванням
   */
  getQuickParser() {
    return new MarkdownParser({
      gfm: true,
      tables: true,
      strikethrough: true,
    });
  }

  /**
   * Побудовує парсер для суворого використання
   * @returns {MarkdownParser} Парсер зі суворими опціями
   */
  getStrictParser() {
    return new MarkdownParser({
      pedantic: true,
      gfm: false,
      tables: false,
      strikethrough: false,
    });
  }

  /**
   * Повертає версію API
   * @returns {string} Версія
   */
  getVersion() {
    return this.version;
  }

  /**
   * Повертає інформацію про API
   * @returns {object} Інформація про API
   */
  getInfo() {
    return {
      name: "Markdown Parser",
      version: this.version,
      description: "A powerful Markdown parser with plugin system",
      features: [
        "Full Markdown parsing",
        "AST generation",
        "HTML rendering",
        "Markdown regeneration",
        "Plugin system",
        "Validation",
        "Statistics",
        "Table of contents generation",
      ],
    };
  }
}

/**
 * Глобальний екземпляр API
 */
const api = new MarkdownAPI();

// Експортуємо як синглтон
module.exports = api;

// Також експортуємо класи для розширення
module.exports.MarkdownAPI = MarkdownAPI;
module.exports.MarkdownParser = MarkdownParser;
module.exports.HTMLRenderer = HTMLRenderer;
module.exports.MarkdownRenderer = MarkdownRenderer;
module.exports.PluginManager = PluginManager;
module.exports.Tokenizer = Tokenizer;
module.exports.ASTBuilder = ASTBuilder;
