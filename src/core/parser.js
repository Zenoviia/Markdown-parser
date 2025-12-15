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

  /**
   * ==================== ADVANCED PARSER FEATURES ====================
   * Інтегровані розширені можливості парсера для кешування, перевірки форматування,
   * аналізу рядків та інших утиліт
   * ==================================================================
   */

  /**
   * Реєструє hook для подій парсування
   * @param {string} event - Назва события (beforeParse, afterParse, onError)
   * @param {function} callback - Функція зворотного виклику
   */
  on(event, callback) {
    if (!this.hooks) {
      this.hooks = {
        beforeParse: [],
        afterParse: [],
        onError: [],
      };
    }
    if (this.hooks[event]) {
      this.hooks[event].push(callback);
    }
  }

  /**
   * Викликає hooks для подій
   * @private
   * @param {string} event - Назва события
   * @param {*} data - Дані для передачи в callback
   */
  emit(event, data) {
    if (!this.hooks) return;
    if (this.hooks[event]) {
      this.hooks[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.warn(`Hook error for ${event}:`, error.message);
        }
      });
    }
  }

  /**
   * Кешує результати парсування
   * @param {string} key - Ключ кеша
   * @param {*} value - Значення
   */
  setCacheEntry(key, value) {
    if (!this.cache) {
      this.cache = new Map();
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Отримує значення з кеша
   * @param {string} key - Ключ кеша
   * @returns {*|null} Значення або null
   */
  getCacheEntry(key) {
    if (!this.cache) return null;
    const entry = this.cache.get(key);
    return entry ? entry.value : null;
  }

  /**
   * Очищає кеш
   */
  clearCache() {
    if (!this.cache) {
      this.cache = new Map();
    }
    this.cache.clear();
  }

  /**
   * Парсує Markdown з кешем
   * @param {string} markdown - Markdown текст
   * @param {boolean} useCache - Використовувати кеш
   * @returns {object} Результат парсування
   */
  parseWithCache(markdown, useCache = true) {
    const cacheKey = this.hashString(markdown);

    if (useCache && this.getCacheEntry(cacheKey)) {
      return this.getCacheEntry(cacheKey);
    }

    this.emit("beforeParse", { markdown });

    try {
      const result = this.parse(markdown);

      if (useCache) {
        this.setCacheEntry(cacheKey, result);
      }

      this.emit("afterParse", { markdown, result });
      return result;
    } catch (error) {
      this.emit("onError", error);
      throw error;
    }
  }

  /**
   * Генерує хеш строки
   * @private
   * @param {string} str - Строка
   * @returns {string} Хеш
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash.toString();
  }

  /**
   * Знаходить за шаблоном у документі
   * @param {string} markdown - Markdown текст
   * @param {regex} pattern - Шаблон
   * @returns {array} Результати пошуку
   */
  search(markdown, pattern) {
    const results = [];
    let match;
    const regex = new RegExp(pattern, "g");

    while ((match = regex.exec(markdown)) !== null) {
      results.push({
        text: match[0],
        index: match.index,
        line: markdown.substring(0, match.index).split("\n").length,
      });
    }

    return results;
  }

  /**
   * Замінює текст у документі
   * @param {string} markdown - Markdown текст
   * @param {string|regex} searchValue - Значення пошуку
   * @param {string} replaceValue - Значення заміни
   * @returns {string} Результат
   */
  replace(markdown, searchValue, replaceValue) {
    return markdown.replace(searchValue, replaceValue);
  }

  /**
   * Розбиває документ на рядки з метаданими
   * @param {string} markdown - Markdown текст
   * @returns {array} Масив рядків з інформацією
   */
  analyzeLines(markdown) {
    const lines = markdown.split("\n");
    return lines.map((line, index) => ({
      content: line,
      lineNumber: index + 1,
      length: line.length,
      isEmpty: line.trim() === "",
      isHeading: line.trim().startsWith("#"),
      isList: /^[\s]*[-*+]\s/.test(line),
      isCodeFence:
        line.trim().startsWith("```") || line.trim().startsWith("~~~"),
      isBlockquote: line.trim().startsWith(">"),
      isHorizontalRule: /^[\s]*([-_*][\s]*){3,}$/.test(line),
    }));
  }

  /**
   * Отримує статистику за рядками
   * @param {string} markdown - Markdown текст
   * @returns {object} Статистика
   */
  getLineStatistics(markdown) {
    const lines = this.analyzeLines(markdown);
    const stats = {
      totalLines: lines.length,
      emptyLines: 0,
      headingLines: 0,
      listLines: 0,
      codeLines: 0,
      blockquoteLines: 0,
      averageLineLength: 0,
      longestLine: 0,
      shortestLine: Infinity,
    };

    let totalLength = 0;

    for (const line of lines) {
      if (line.isEmpty) stats.emptyLines++;
      if (line.isHeading) stats.headingLines++;
      if (line.isList) stats.listLines++;
      if (line.isCodeFence) stats.codeLines++;
      if (line.isBlockquote) stats.blockquoteLines++;

      totalLength += line.length;
      stats.longestLine = Math.max(stats.longestLine, line.length);
      stats.shortestLine = Math.min(stats.shortestLine, line.length);
    }

    stats.averageLineLength = lines.length > 0 ? totalLength / lines.length : 0;
    return stats;
  }

  /**
   * Форматує документ
   * @param {string} markdown - Markdown текст
   * @param {object} options - Опції форматування
   * @returns {string} Форматований текст
   */
  format(markdown, options = {}) {
    const defaultOptions = {
      indentSize: 2,
      normalizeHeadings: true,
      normalizeLists: true,
      removeTrailingWhitespace: true,
      ensureFinalNewline: true,
    };

    const opts = { ...defaultOptions, ...options };
    let formatted = markdown;

    if (opts.removeTrailingWhitespace) {
      formatted = formatted
        .split("\n")
        .map((line) => line.trimEnd())
        .join("\n");
    }

    if (opts.ensureFinalNewline && formatted && !formatted.endsWith("\n")) {
      formatted += "\n";
    }

    return formatted;
  }

  /**
   * Порівнює два документи
   * @param {string} doc1 - Перший документ
   * @param {string} doc2 - Другий документ
   * @returns {object} Результати порівняння
   */
  compare(doc1, doc2) {
    const lines1 = doc1.split("\n");
    const lines2 = doc2.split("\n");

    const differences = [];
    const maxLines = Math.max(lines1.length, lines2.length);

    for (let i = 0; i < maxLines; i++) {
      if ((lines1[i] || "") !== (lines2[i] || "")) {
        differences.push({
          line: i + 1,
          doc1: lines1[i] || "(missing)",
          doc2: lines2[i] || "(missing)",
        });
      }
    }

    return {
      isSame: differences.length === 0,
      differenceCount: differences.length,
      similarities: maxLines - differences.length,
      differences: differences,
    };
  }

  /**
   * Знаходить дублікати рядків
   * @param {string} markdown - Markdown текст
   * @returns {array} Дублікати
   */
  findDuplicates(markdown) {
    const lines = markdown.split("\n");
    const lineMap = new Map();
    const duplicates = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        if (lineMap.has(line)) {
          lineMap.get(line).push(i + 1);
        } else {
          lineMap.set(line, [i + 1]);
        }
      }
    }

    for (const [line, occurrences] of lineMap) {
      if (occurrences.length > 1) {
        duplicates.push({
          text: line,
          occurrences: occurrences,
        });
      }
    }

    return duplicates;
  }

  /**
   * Сортує рядки документа
   * @param {string} markdown - Markdown текст
   * @param {function} compareFn - Функція порівняння
   * @returns {string} Відсортований текст
   */
  sortLines(markdown, compareFn = null) {
    const lines = markdown.split("\n");
    const sortedLines = compareFn ? lines.sort(compareFn) : lines.sort();
    return sortedLines.join("\n");
  }

  /**
   * Фільтрує рядки документа
   * @param {string} markdown - Markdown текст
   * @param {function} filterFn - Функція фільтру
   * @returns {string} Відфільтрований текст
   */
  filterLines(markdown, filterFn) {
    const lines = markdown.split("\n");
    const filtered = lines.filter(filterFn);
    return filtered.join("\n");
  }

  /**
   * Трансформує кожен рядок документа
   * @param {string} markdown - Markdown текст
   * @param {function} mapFn - Функція трансформації
   * @returns {string} Трансформований текст
   */
  mapLines(markdown, mapFn) {
    const lines = markdown.split("\n");
    const mapped = lines.map(mapFn);
    return mapped.join("\n");
  }

  /**
   * Знаходить розходження у форматуванні Markdown
   * @param {string} markdown - Markdown текст
   * @returns {array} Проблеми з форматуванням
   */
  validateFormatting(markdown) {
    const issues = [];
    const lines = markdown.split("\n");
    let inCodeBlock = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Перевірка і оновлення стану блоку коду
      const fenceMatch = line.trim().match(/^(`{3,}|~{3,})/);
      if (fenceMatch) {
        inCodeBlock = !inCodeBlock;
      }

      // Пропускаємо перевірки для рядків всередині коду
      if (inCodeBlock || fenceMatch) {
        continue;
      }

      // Перевірка на незакриті квадратні дужки
      if (line.includes("[") && !line.includes("]")) {
        issues.push({
          line: lineNumber,
          type: "unmatched_bracket",
          message: "Unmatched opening bracket",
        });
      }

      // Перевірка на баланс круглих дужок
      let openParenCount = (line.match(/\(/g) || []).length;
      let closeParenCount = (line.match(/\)/g) || []).length;

      if (openParenCount !== closeParenCount) {
        issues.push({
          line: lineNumber,
          type: "unmatched_parenthesis_balance",
          message: "Unbalanced parentheses (open/close count mismatch)",
        });
      }

      // Перевірка на неузгоджені дужки у структурі посилання
      if (line.match(/\(\[/) && !line.match(/\]\)/)) {
        issues.push({
          line: lineNumber,
          type: "unmatched_parenthesis",
          message: "Unmatched opening parenthesis in link-like structure",
        });
      }

      // Перевірка на неправильні лінки
      if (line.includes("](") && !line.includes("[")) {
        issues.push({
          line: lineNumber,
          type: "malformed_link",
          message: "Malformed link syntax",
        });
      }

      // Перевірка на бектики
      const backticks = (line.match(/`/g) || []).length;
      if (backticks % 2 !== 0) {
        issues.push({
          line: lineNumber,
          type: "unmatched_backticks",
          message: "Unmatched backticks (odd number of backticks found)",
        });
      }
    }

    // Перевірка, чи не закінчився файл у блоці коду
    if (inCodeBlock) {
      issues.push({
        line: lines.length,
        type: "unclosed_code_block",
        message: "Document ended inside an unclosed code block fence.",
      });
    }

    return issues;
  }

  /**
   * Визначає найвживаніші слова у документі
   * @param {string} markdown - Markdown текст
   * @param {number} limit - Кількість слів для повернення
   * @returns {array} Найвживаніші слова з підрахунками
   */
  getMostCommonWords(markdown, limit = 10) {
    // Видаляємо Markdown синтаксис
    const text = markdown
      .replace(/[#*_\[\](){}]/g, " ")
      .replace(/\d+[\.:)]/g, " ")
      .toLowerCase();

    const words = text.match(/\b\w+\b/g) || [];
    const wordFreq = new Map();

    for (const word of words) {
      if (word.length > 2) {
        // Ігноруємо короткі слова
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([word, count]) => ({ word, count }));
  }

  /**
   * Отримує словник унікальних слів у документі
   * @param {string} markdown - Markdown текст
   * @returns {array} Відсортований словник слів
   */
  getVocabulary(markdown) {
    const text = markdown
      .replace(/[#*_\[\](){}]/g, " ")
      .replace(/\d+[\.:)]/g, " ")
      .toLowerCase();

    const words = new Set(text.match(/\b\w+\b/g) || []);
    return Array.from(words).sort();
  }
}

module.exports = MarkdownParser;
