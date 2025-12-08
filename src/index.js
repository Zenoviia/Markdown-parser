/**
 * Main Entry Point
 * Точка входу для проєкту
 */

const MarkdownParser = require("./core/parser");
const HTMLRenderer = require("./renderers/htmlRenderer");
const MarkdownRenderer = require("./renderers/markdownRenderer");
const { PluginManager } = require("./plugins/pluginSystem");
const CLI = require("./cli");
const API = require("./api");

/**
 * Экспортуємо основні компоненти
 */
module.exports = {
  // Основні класи
  MarkdownParser,
  HTMLRenderer,
  MarkdownRenderer,
  PluginManager,
  CLI,

  // API
  API,

  // Зручні функції для швидкого використання
  parse: (markdown, options) => {
    const parser = new MarkdownParser(options);
    return parser.parse(markdown);
  },

  parseToAST: (markdown, options) => {
    const parser = new MarkdownParser(options);
    return parser.parseToAST(markdown);
  },

  validate: (markdown, options) => {
    const parser = new MarkdownParser(options);
    return parser.validate(markdown);
  },

  getStatistics: (markdown, options) => {
    const parser = new MarkdownParser(options);
    return parser.getStatistics(markdown);
  },

  generateTableOfContents: (markdown, options) => {
    return API.generateTableOfContents(markdown, options);
  },

  extractLinks: (markdown, options) => {
    return API.extractLinks(markdown, options);
  },

  extractImages: (markdown, options) => {
    return API.extractImages(markdown, options);
  },

  extractHeadings: (markdown, options) => {
    return API.extractHeadings(markdown, options);
  },

  version: "1.0.0",
};
