/**
 * AST Builder Module
 * Побудова абстрактного синтаксичного дерева
 */

const Tokenizer = require("./tokenizer");

/**
 * Будує AST із токенів
 */
class ASTBuilder {
  constructor(options = {}) {
    this.options = options;
    this.tokenizer = new Tokenizer(options);
    this.references = {};
  }

  /**
   * Будує AST із масиву токенів
   * @param {array} tokens - Масив токенів
   * @returns {object} Коренева вузла AST
   */
  build(tokens) {
    this.references = {};
    const children = [];

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === "blank") {
        continue;
      }

      const node = this.buildNode(token);
      if (node) {
        children.push(node);
      }
    }

    return {
      type: "root",
      children: children,
      metadata: {
        generated: new Date().toISOString(),
        nodeCount: this.countNodes(children),
      },
    };
  }

  /**
   * Будує вузол із токену
   * @private
   * @param {object} token - Токен
   * @returns {object|null} Вузол AST
   */
  buildNode(token) {
    switch (token.type) {
      case "heading":
        return this.buildHeading(token);

      case "paragraph":
        return this.buildParagraph(token);

      case "codeBlock":
        return this.buildCodeBlock(token);

      case "list":
      case "orderedList":
        return this.buildList(token);

      case "blockquote":
        return this.buildBlockquote(token);

      case "hr":
        return this.buildHR(token);

      case "table":
        return this.buildTable(token);

      case "html":
        return this.buildHTML(token);

      default:
        return null;
    }
  }

  /**
   * Будує заголовок
   * @private
   * @param {object} token - Токен заголовку
   * @returns {object} Вузол заголовку
   */
  buildHeading(token) {
    const children = this.tokenizer.tokenizeInline(token.text);

    return {
      type: "heading",
      level: token.level,
      children: this.buildInlineNodes(children),
      raw: token.raw,
      line: token.line,
      id: this.generateHeadingId(token.text),
    };
  }

  /**
   * Будує параграф
   * @private
   * @param {object} token - Токен параграфу
   * @returns {object} Вузол параграфу
   */
  buildParagraph(token) {
    const children = this.tokenizer.tokenizeInline(token.text);

    return {
      type: "paragraph",
      children: this.buildInlineNodes(children),
      raw: token.raw,
      line: token.line,
    };
  }

  /**
   * Будує блок коду
   * @private
   * @param {object} token - Токен блоку коду
   * @returns {object} Вузол блоку коду
   */
  buildCodeBlock(token) {
    return {
      type: "codeBlock",
      language: token.language || "",
      code: token.code,
      raw: token.raw,
      line: token.line,
      lineCount: token.code.split("\n").length,
    };
  }

  /**
   * Будує список
   * @private
   * @param {object} token - Токен списку
   * @returns {object} Вузол списку
   */
  buildList(token) {
    const items = [];

    for (const item of token.items) {
      const itemNode = {
        type: "listItem",
        marker: item.marker,
        children: this.buildInlineNodes(
          this.tokenizer.tokenizeInline(item.content)
        ),
        raw: item.raw,
        line: item.line,
      };
      items.push(itemNode);
    }

    return {
      type: token.type === "orderedList" ? "orderedList" : "list",
      items: items,
      itemCount: items.length,
      raw: token.raw,
      line: token.line,
    };
  }

  /**
   * Будує цитату
   * @private
   * @param {object} token - Токен цитати
   * @returns {object} Вузол цитати
   */
  buildBlockquote(token) {
    // Рекурсивно парсимо вміст цитати
    const innerTokens = this.tokenizeContent(token.content);
    const children = [];

    for (const innerToken of innerTokens) {
      if (innerToken.type !== "blank") {
        const node = this.buildNode(innerToken);
        if (node) {
          children.push(node);
        }
      }
    }

    return {
      type: "blockquote",
      children: children,
      raw: token.raw,
      line: token.line,
    };
  }

  /**
   * Будує горизонтальну лінію
   * @private
   * @param {object} token - Токен лінії
   * @returns {object} Вузол лінії
   */
  buildHR(token) {
    return {
      type: "hr",
      raw: token.raw,
      line: token.line,
    };
  }

  /**
   * Будує таблицю
   * @private
   * @param {object} token - Токен таблиці
   * @returns {object} Вузол таблиці
   */
  buildTable(token) {
    const thead = {
      type: "tableHead",
      cells: token.headers.map((header) => ({
        type: "tableCell",
        content: this.buildInlineNodes(
          this.tokenizer.tokenizeInline(header.text)
        ),
        align: header.align,
        isHeader: true,
      })),
    };

    const tbody = {
      type: "tableBody",
      rows: token.rows.map((row) => ({
        type: "tableRow",
        cells: row.map((cell, index) => ({
          type: "tableCell",
          content: this.buildInlineNodes(this.tokenizer.tokenizeInline(cell)),
          align: token.headers[index]?.align || null,
          isHeader: false,
        })),
      })),
    };

    return {
      type: "table",
      thead: thead,
      tbody: tbody,
      raw: token.raw,
      line: token.line,
      columnCount: token.headers.length,
      rowCount: token.rows.length,
    };
  }

  /**
   * Будує HTML блок
   * @private
   * @param {object} token - Токен HTML
   * @returns {object} Вузол HTML
   */
  buildHTML(token) {
    return {
      type: "html",
      html: token.html,
      raw: token.raw,
      line: token.line,
    };
  }

  /**
   * Будує вузли вбудованих елементів
   * @private
   * @param {array} tokens - Масив вбудованих токенів
   * @returns {array} Масив вузлів вбудованих елементів
   */
  buildInlineNodes(tokens) {
    return tokens.map((token) => {
      switch (token.type) {
        case "text":
          return {
            type: "text",
            text: token.text,
            raw: token.raw,
          };

        case "inlineCode":
          return {
            type: "inlineCode",
            code: token.code,
            raw: token.raw,
          };

        case "link":
          return {
            type: "link",
            text: token.text,
            href: token.href,
            title: token.title,
            children: this.buildInlineNodes(
              this.tokenizer.tokenizeInline(token.text)
            ),
            raw: token.raw,
          };

        case "image":
          return {
            type: "image",
            alt: token.alt,
            src: token.src,
            title: token.title,
            raw: token.raw,
          };

        case "strong":
          return {
            type: "strong",
            children: this.buildInlineNodes(
              this.tokenizer.tokenizeInline(token.text)
            ),
            raw: token.raw,
          };

        case "em":
          return {
            type: "em",
            children: this.buildInlineNodes(
              this.tokenizer.tokenizeInline(token.text)
            ),
            raw: token.raw,
          };

        case "del":
          return {
            type: "del",
            children: this.buildInlineNodes(
              this.tokenizer.tokenizeInline(token.text)
            ),
            raw: token.raw,
          };

        default:
          return {
            type: "text",
            text: token.raw,
            raw: token.raw,
          };
      }
    });
  }

  /**
   * Токенізує вміст
   * @private
   * @param {string} content - Вміст
   * @returns {array} Масив токенів
   */
  tokenizeContent(content) {
    const lines = content.split("\n");
    const tokenizer = new Tokenizer(this.options);
    const tokens = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (!line.trim()) {
        tokens.push({
          type: "blank",
          raw: line,
          line: i,
        });
        continue;
      }

      // Отримуємо токени із лінії
      const lineTokens = this.getLineTokens(line, i);
      tokens.push(...lineTokens);
    }

    return tokens;
  }

  /**
   * Отримує токени із лінії
   * @private
   * @param {string} line - Рядок
   * @param {number} lineNum - Номер рядка
   * @returns {array} Масив токенів
   */
  getLineTokens(line, lineNum) {
    const tokens = [];

    // Заголовок
    const headingMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
    if (headingMatch) {
      tokens.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
        raw: line,
        line: lineNum,
      });
      return tokens;
    }

    // HR
    if (/^([\*\-_]\s?){3,}$/.test(line.trim())) {
      tokens.push({
        type: "hr",
        raw: line,
        line: lineNum,
      });
      return tokens;
    }

    // Параграф
    tokens.push({
      type: "paragraph",
      text: line,
      raw: line,
      line: lineNum,
    });
    return tokens;
  }

  /**
   * Генерує ID для заголовку
   * @private
   * @param {string} text - Текст заголовку
   * @returns {string} ID
   */
  generateHeadingId(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  /**
   * Лічить вузли
   * @private
   * @param {array} nodes - Масив вузлів
   * @returns {number} Кількість вузлів
   */
  countNodes(nodes) {
    if (!Array.isArray(nodes)) {
      return 1;
    }

    return nodes.reduce((sum, node) => {
      let count = 1;
      if (Array.isArray(node.children)) {
        count += this.countNodes(node.children);
      }
      if (Array.isArray(node.items)) {
        count += node.items.reduce(
          (itemSum, item) =>
            itemSum +
            (Array.isArray(item.children) ? this.countNodes(item.children) : 1),
          0
        );
      }
      return sum + count;
    }, 0);
  }

  /**
   * Валідує AST
   * @param {object} ast - AST
   * @returns {boolean} Результат валідації
   */
  validate(ast) {
    if (!ast || typeof ast !== "object") {
      return false;
    }

    if (ast.type !== "root" || !Array.isArray(ast.children)) {
      return false;
    }

    return this.validateNode(ast);
  }

  /**
   * Валідує вузол
   * @private
   * @param {object} node - Вузол
   * @returns {boolean} Результат валідації
   */
  validateNode(node) {
    if (!node.type) {
      return false;
    }

    if (node.children && !Array.isArray(node.children)) {
      return false;
    }

    if (node.items && !Array.isArray(node.items)) {
      return false;
    }

    if (node.children) {
      return node.children.every((child) => this.validateNode(child));
    }

    if (node.items) {
      return node.items.every((item) => this.validateNode(item));
    }

    return true;
  }

  /**
   * Трансформує AST
   * @param {object} ast - AST
   * @param {function} transform - Функція трансформації
   * @returns {object} Трансформований AST
   */
  transform(ast, transform) {
    if (typeof transform !== "function") {
      throw new TypeError("Transform must be a function");
    }

    return this.transformNode(ast, transform);
  }

  /**
   * Трансформує вузол
   * @private
   * @param {object} node - Вузол
   * @param {function} transform - Функція трансформації
   * @returns {object} Трансформований вузол
   */
  transformNode(node, transform) {
    let transformed = transform(node);

    if (transformed.children && Array.isArray(transformed.children)) {
      transformed.children = transformed.children.map((child) =>
        this.transformNode(child, transform)
      );
    }

    if (transformed.items && Array.isArray(transformed.items)) {
      transformed.items = transformed.items.map((item) =>
        this.transformNode(item, transform)
      );
    }

    return transformed;
  }

  /**
   * Фільтрує вузли за типом
   * @param {object} ast - AST
   * @param {string} type - Тип вузла
   * @returns {array} Масив вузлів
   */
  filterByType(ast, type) {
    const results = [];

    const traverse = (node) => {
      if (node.type === type) {
        results.push(node);
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => traverse(child));
      }

      if (node.items && Array.isArray(node.items)) {
        node.items.forEach((item) => traverse(item));
      }
    };

    traverse(ast);
    return results;
  }

  /**
   * Отримує всі посилання з документа
   * @param {object} ast - AST
   * @returns {array} Масив посилань
   */
  extractLinks(ast) {
    const links = [];

    const traverse = (node) => {
      if (node.type === "link") {
        links.push({
          text: node.text,
          href: node.href,
          title: node.title,
        });
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => traverse(child));
      }

      if (node.items && Array.isArray(node.items)) {
        node.items.forEach((item) => traverse(item));
      }
    };

    traverse(ast);
    return links;
  }

  /**
   * Отримує всі зображення з документа
   * @param {object} ast - AST
   * @returns {array} Масив зображень
   */
  extractImages(ast) {
    const images = [];

    const traverse = (node) => {
      if (node.type === "image") {
        images.push({
          alt: node.alt,
          src: node.src,
          title: node.title,
        });
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => traverse(child));
      }

      if (node.items && Array.isArray(node.items)) {
        node.items.forEach((item) => traverse(item));
      }
    };

    traverse(ast);
    return images;
  }

  /**
   * Отримує всі заголовки з документа
   * @param {object} ast - AST
   * @returns {array} Масив заголовків
   */
  extractHeadings(ast) {
    const headings = [];

    const traverse = (node) => {
      if (node.type === "heading") {
        headings.push({
          level: node.level,
          text: this.extractText(node),
          id: node.id,
        });
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child) => traverse(child));
      }

      if (node.items && Array.isArray(node.items)) {
        node.items.forEach((item) => traverse(item));
      }
    };

    traverse(ast);
    return headings;
  }

  /**
   * Екстрактує текст з вузла
   * @private
   * @param {object} node - Вузол
   * @returns {string} Текст
   */
  extractText(node) {
    if (node.type === "text") {
      return node.text;
    }

    if (node.type === "inlineCode") {
      return node.code;
    }

    let text = "";

    if (node.children && Array.isArray(node.children)) {
      text = node.children.map((child) => this.extractText(child)).join("");
    }

    if (node.text) {
      text += node.text;
    }

    return text;
  }

  /**
   * Отримує оглавлення
   * @param {object} ast - AST
   * @returns {array} Масив розділів оглавлення
   */
  generateTableOfContents(ast) {
    const headings = this.extractHeadings(ast);
    const toc = [];
    let currentLevel = 0;
    let currentParent = null;

    for (const heading of headings) {
      const level = heading.level;

      if (level > currentLevel) {
        for (let i = currentLevel; i < level; i++) {
          if (currentParent) {
            currentParent.children = currentParent.children || [];
            const newParent = {
              level: i + 1,
              items: [],
            };
            currentParent.children.push(newParent);
            currentParent = newParent;
          } else {
            currentParent = {
              level: i + 1,
              items: [],
            };
            toc.push(currentParent);
          }
        }
      } else if (level < currentLevel) {
        // Перейти на вищий рівень
        let parent = null;
        for (let item of toc) {
          if (this.findParentAtLevel(item, level)) {
            parent = this.findParentAtLevel(item, level);
            break;
          }
        }
        currentParent = parent || toc[toc.length - 1];
      }

      const item = {
        text: heading.text,
        id: heading.id,
        level: heading.level,
        items: [],
      };

      if (currentParent && currentParent.items) {
        currentParent.items.push(item);
      }

      currentLevel = level;
    }

    return toc;
  }

  /**
   * Знаходить батька на рівні
   * @private
   * @param {object} item - Елемент
   * @param {number} level - Рівень
   * @returns {object|null} Батько або null
   */
  findParentAtLevel(item, level) {
    if (item.level === level - 1) {
      return item;
    }

    if (item.children) {
      for (const child of item.children) {
        const result = this.findParentAtLevel(child, level);
        if (result) return result;
      }
    }

    if (item.items) {
      for (const child of item.items) {
        const result = this.findParentAtLevel(child, level);
        if (result) return result;
      }
    }

    return null;
  }
}

module.exports = ASTBuilder;
