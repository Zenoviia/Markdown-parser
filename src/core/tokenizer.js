/**
 * Tokenizer Module
 * Розбивка Markdown тексту на токени
 */

/**
 * Клас для токенізації Markdown
 */
class Tokenizer {
  constructor(options = {}) {
    this.options = options;
    this.blockRules = this.initBlockRules();
    this.inlineRules = this.initInlineRules();
    this.customTokenRules = [];
  }

  /**
   * Ініціалізує блокові правила
   * @private
   * @returns {object} Правила блокових елементів
   */
  initBlockRules() {
    return {
      // Горизонтальна лінія
      hr: /^ {0,3}(?:(?:\*[ \t]*){3,}|(?:_[ \t]*){3,}|(?:-[ \t]*){3,})(?:\n+|$)/,

      // Заголовки
      heading: /^ {0,3}(#{1,6})(?:\s+|$)(.*?)(?:\s+#+)?$/m,

      // Список (неупорядкований)
      list: /^( {0,3})([*+-])( |\t)/,

      // Упорядкований список
      ol: /^( {0,3})(\d{1,9})([.)])( |\t)/,

      // Блок коду
      codeBlock: /^( {4}|\t)[^\n]/,

      // Огороджений блок коду
      fencedCode: /^(`{3,}|~{3,})([^\n]*)?\n([\s\S]*?)\1(?:\n+|$)/,

      // Цитата
      blockquote: /^> +/,

      // Таблиця
      table: /^ {0,3}\|?.+\|.+\n {0,3}\|?[ :|-]+[ :|-]*\|[ :|-]+\n/,

      // HTML блок
      html: /^<(?:script|pre|style|textarea)[\s\S]*?<\/(?:script|pre|style|textarea)>/i,

      // Визначення посилання
      def: /^ {0,3}\[([^\]]+)\]:\s*<?([^\s>]+)>?(?:\s+["(]([^\n]*)[")])?\s*(?:\n+|$)/,

      // Параграф
      paragraph: /^[^\n]+/,

      text: /^[^\n]+/,
    };
  }

  /**
   * Ініціалізує вбудовані правила
   * @private
   * @returns {object} Правила вбудованих елементів
   */
  initInlineRules() {
    return {
      // Escape символи
      escape: /^\\([\\`*{}\[\]()#+\-.!_>~|])/,

      // Код
      code: /^(`+)([\s\S]*?)\1(?!`)/,

      // Жирний текст
      strong:
        /^__([^\s_][\s\S]*?[^\s_])__(?!_)|^\*\*([^\s*][\s\S]*?[^\s*])\*\*(?!\*)/,

      // Курсив
      em: /^_([^\s_][\s\S]*?[^\s_])_(?!_)|\*([^\s*][\s\S]*?[^\s*])\*(?!\*)/,

      // Закреслений текст
      del: /^~~([^\s~][\s\S]*?[^\s~])~~/,

      // Зображення
      image: /^!\[([^\]]*)\]\(([^\s)]+)\s*(?:"([^"]*)"|'([^']*)')?\s*\)/,

      // Посилання
      link: /^\[([^\]]*)\]\(([^\s)]+)\s*(?:"([^"]*)"|'([^']*)')?\s*\)/,

      // Автоматичне посилання
      autolink: /^<(https?:\/\/[^\s<>]*|[^\s<>]+@[^\s<>]+)>/,

      // Посилання у лапках
      url: /^(https?:\/\/[^\s<>]*|[^\s<>]+@[^\s<>]+)(?=\s|$)/,

      // Примітка
      mention: /^@([a-zA-Z0-9_-]+)/,

      // Хеш-тег
      hashtag: /^#([a-zA-Z0-9_-]+)/,

      // Розрив
      br: /^ {2,}\n(?!\s*$)/,

      // Текст
      text: /^[\s\S]+?(?=\\|`|\[|!|\*|_|~|<|https?:\/\/|@|#|\n|$)/,
    };
  }

  /**
   * Додає користувацькі правила токенізації
   * @param {object} rules - Об'єкт з правилами
   */
  addTokenRules(rules) {
    if (typeof rules === "object" && rules !== null) {
      this.customTokenRules.push(rules);
    }
  }

  /**
   * Токенізує текст
   * @param {string} text - Вхідний текст
   * @returns {array} Масив токенів
   */
  tokenize(text) {
    const tokens = [];
    let pos = 0;
    const lines = text.split("\n");

    while (pos < lines.length) {
      const line = lines[pos];
      let matched = false;

      if (!line.trim()) {
        tokens.push({
          type: "blank",
          raw: line,
          line: pos,
        });
        pos++;
        continue;
      }

      const headingMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?$/);
      if (headingMatch) {
        tokens.push({
          type: "heading",
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
          raw: line,
          line: pos,
        });
        pos++;
        matched = true;
        continue;
      }

      if (/^([\*\-_]\s?){3,}$/.test(line.trim())) {
        tokens.push({
          type: "hr",
          raw: line,
          line: pos,
        });
        pos++;
        matched = true;
        continue;
      }

      const fencedMatch = this.matchFencedCode(lines, pos);
      if (fencedMatch) {
        tokens.push(fencedMatch.token);
        pos = fencedMatch.endLine + 1;
        matched = true;
        continue;
      }

      if (line.startsWith(">")) {
        const quoteMatch = this.matchBlockquote(lines, pos);
        if (quoteMatch) {
          tokens.push(quoteMatch.token);
          pos = quoteMatch.endLine + 1;
          matched = true;
          continue;
        }
      }

      const listMatch = line.match(/^( {0,3})([*+-]|\d{1,9}[.)])\s+/);
      if (listMatch) {
        const listTokens = this.matchList(lines, pos);
        if (listTokens.token) {
          tokens.push(listTokens.token);
          pos = listTokens.endLine + 1;
          matched = true;
          continue;
        }
      }

      if (this.isTableLine(line) && pos + 1 < lines.length) {
        const tableMatch = this.matchTable(lines, pos);
        if (tableMatch) {
          tokens.push(tableMatch.token);
          pos = tableMatch.endLine + 1;
          matched = true;
          continue;
        }
      }

      if (line.match(/^<(?!script|style|pre|textarea)/i)) {
        const htmlMatch = this.matchHtmlBlock(lines, pos);
        if (htmlMatch) {
          tokens.push(htmlMatch.token);
          pos = htmlMatch.endLine + 1;
          matched = true;
          continue;
        }
      }

      if (line.match(/^    \S/) || line.match(/^\t\S/)) {
        const codeMatch = this.matchIndentedCode(lines, pos);
        tokens.push(codeMatch.token);
        pos = codeMatch.endLine + 1;
        matched = true;
        continue;
      }

      if (!matched) {
        const paraMatch = this.matchParagraph(lines, pos);
        tokens.push(paraMatch.token);
        pos = paraMatch.endLine + 1;
      }
    }

    return tokens;
  }

  /**
   * Мечить огороджений блок коду
   * @private
   * @param {array} lines - Масив рядків
   * @param {number} startLine - Початковий рядок
   * @returns {object|null} Результат мечу
   */
  matchFencedCode(lines, startLine) {
    const line = lines[startLine];
    const fence = line.match(/^(`{3,}|~{3,})/);

    if (!fence) return null;

    const fenceStr = fence[1];
    const info = line.slice(fence[1].length).trim();
    const content = [];
    let endLine = startLine;
    let foundClosing = false;

    for (let i = startLine + 1; i < lines.length; i++) {
      const currentLine = lines[i];

      if (
        currentLine.match(
          new RegExp(`^${fenceStr.replace(/([`\\])/g, "\\$1")}\\s*$`)
        )
      ) {
        endLine = i;
        foundClosing = true;
        break;
      }

      const fenceIndex = currentLine.indexOf(fenceStr);
      if (fenceIndex >= 0) {
        const beforeFence = currentLine.slice(0, fenceIndex);
        const fromFence = currentLine.slice(fenceIndex);

        if (
          beforeFence.match(/^\s*$/) &&
          fromFence.match(
            new RegExp(`^${fenceStr.replace(/([`\\])/g, "\\$1")}\\s*$`)
          )
        ) {
          endLine = i;
          foundClosing = true;
          break;
        } else if (
          fenceIndex > 0 &&
          fromFence.match(
            new RegExp(`^${fenceStr.replace(/([`\\])/g, "\\$1")}`)
          )
        ) {
          content.push(currentLine.slice(0, fenceIndex));
          endLine = i;
          foundClosing = true;
          break;
        }
      }

      content.push(currentLine);
      endLine = i;
    }

    return {
      token: {
        type: "codeBlock",
        language: info || "",
        code: content.join("\n"),
        raw: lines.slice(startLine, endLine + 1).join("\n"),
        line: startLine,
      },
      endLine,
    };
  }

  /**
   * Мечить цитату
   * @private
   * @param {array} lines - Масив рядків
   * @param {number} startLine - Початковий рядок
   * @returns {object|null} Результат мечу
   */
  matchBlockquote(lines, startLine) {
    const content = [];
    let endLine = startLine;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith(">")) {
        content.push(line.replace(/^>\s?/, ""));
        endLine = i;
      } else if (!line.trim()) {
        content.push(line);
        endLine = i;
      } else {
        break;
      }
    }

    return {
      token: {
        type: "blockquote",
        content: content.join("\n"),
        raw: lines.slice(startLine, endLine + 1).join("\n"),
        line: startLine,
      },
      endLine,
    };
  }

  /**
   * Мечить список
   * @private
   * @param {array} lines - Масив рядків
   * @param {number} startLine - Початковий рядок
   * @returns {object} Результат мечу
   */
  matchList(lines, startLine) {
    const line = lines[startLine];
    const isOrdered = /^\d+[.)]/.test(line.trim());
    const listMarker = isOrdered
      ? /^(\s*)(\d+)[.)](\s+)/
      : /^(\s*)([*+-])(\s+)/;

    const items = [];
    let endLine = startLine;

    for (let i = startLine; i < lines.length; i++) {
      const currentLine = lines[i];

      if (!currentLine.trim()) {
        endLine = i;
        continue;
      }

      const match = currentLine.match(listMarker);
      if (match) {
        items.push({
          marker: match[2],
          content: currentLine.slice(match[0].length),
          raw: currentLine,
          line: i,
        });
        endLine = i;
      } else if (currentLine.match(/^  /) && items.length > 0) {
        items[items.length - 1].content += "\n" + currentLine;
        endLine = i;
      } else {
        break;
      }
    }

    return {
      token: {
        type: isOrdered ? "orderedList" : "list",
        items: items,
        raw: lines.slice(startLine, endLine + 1).join("\n"),
        line: startLine,
      },
      endLine,
    };
  }

  /**
   * Перевіряє, чи це строка таблиці
   * @private
   * @param {string} line - Рядок
   * @returns {boolean} Результат перевірки
   */
  isTableLine(line) {
    return /\|.*\|/.test(line);
  }

  /**
   * Мечить таблицю
   * @private
   * @param {array} lines - Масив рядків
   * @param {number} startLine - Початковий рядок
   * @returns {object|null} Результат мечу
   */
  matchTable(lines, startLine) {
    const headerLine = lines[startLine];
    const separatorLine = lines[startLine + 1];

    if (!separatorLine) return null;

    const separatorCells = separatorLine.split("|").map((cell) => cell.trim());
    const isValidSeparator = separatorCells.every(
      (cell) => /^:?-+:?$/.test(cell) || cell === ""
    );

    if (!isValidSeparator) return null;

    const headerCells = headerLine
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell);
    const headers = [];
    const rows = [];

    for (const cell of headerCells) {
      const align = this.parseTableAlignment(
        separatorLine,
        headerCells.indexOf(cell)
      );
      headers.push({
        text: cell,
        align: align,
      });
    }

    let endLine = startLine + 1;
    for (let i = startLine + 2; i < lines.length; i++) {
      const line = lines[i];

      if (!this.isTableLine(line)) {
        break;
      }

      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell);
      rows.push(cells);
      endLine = i;
    }

    return {
      token: {
        type: "table",
        headers: headers,
        rows: rows,
        raw: lines.slice(startLine, endLine + 1).join("\n"),
        line: startLine,
      },
      endLine,
    };
  }

  /**
   * Парсить вирівнювання таблиці
   * @private
   * @param {string} separatorLine - Рядок розділювача
   * @param {number} cellIndex - Індекс клітинки
   * @returns {string} Вирівнювання
   */
  parseTableAlignment(separatorLine, cellIndex) {
    const cells = separatorLine.split("|");
    const cell = cells[cellIndex + 1]?.trim() || "";

    if (cell.startsWith(":") && cell.endsWith(":")) {
      return "center";
    } else if (cell.endsWith(":")) {
      return "right";
    } else if (cell.startsWith(":")) {
      return "left";
    }
    return null;
  }

  /**
   * Мечить HTML блок
   * @private
   * @param {array} lines - Масив рядків
   * @param {number} startLine - Початковий рядок
   * @returns {object|null} Результат мечу
   */
  matchHtmlBlock(lines, startLine) {
    const line = lines[startLine];
    const tagMatch = line.match(/^<([a-z][a-z0-9-]*)/i);

    if (!tagMatch) return null;

    const tag = tagMatch[1];
    const content = [];
    let endLine = startLine;
    let found = false;

    for (let i = startLine; i < lines.length; i++) {
      content.push(lines[i]);

      if (lines[i].includes(`</${tag}>`)) {
        endLine = i;
        found = true;
        break;
      }
    }

    if (!found) {
      content.pop();
      endLine = startLine;
    }

    return {
      token: {
        type: "html",
        html: content.join("\n"),
        raw: lines.slice(startLine, endLine + 1).join("\n"),
        line: startLine,
      },
      endLine,
    };
  }

  /**
   * Мечить блок коду з відступом
   * @private
   * @param {array} lines - Масив рядків
   * @param {number} startLine - Початковий рядок
   * @returns {object} Результат мечу
   */
  matchIndentedCode(lines, startLine) {
    const content = [];
    let endLine = startLine;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i];

      if (line.match(/^    \S/) || line.match(/^\t\S/)) {
        const dedented = line.replace(/^    /, "").replace(/^\t/, "");
        content.push(dedented);
        endLine = i;
      } else if (!line.trim()) {
        content.push("");
        endLine = i;
      } else {
        break;
      }
    }

    return {
      token: {
        type: "codeBlock",
        language: "",
        code: content.join("\n"),
        raw: lines.slice(startLine, endLine + 1).join("\n"),
        line: startLine,
      },
      endLine,
    };
  }

  /**
   * Мечить параграф
   * @private
   * @param {array} lines - Масив рядків
   * @param {number} startLine - Початковий рядок
   * @returns {object} Результат мечу
   */
  matchParagraph(lines, startLine) {
    const content = [lines[startLine]];
    let endLine = startLine;

    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i];

      if (!line.trim()) {
        break;
      }

      if (
        line.match(
          /^(#{1,6})\s|^[\*\-_]{3,}$|^> |^( {0,3})([*+-]|\d{1,9}[.)])\s/
        )
      ) {
        break;
      }

      content.push(line);
      endLine = i;
    }

    return {
      token: {
        type: "paragraph",
        text: content.join("\n"),
        raw: lines.slice(startLine, endLine + 1).join("\n"),
        line: startLine,
      },
      endLine,
    };
  }

  /**
   * Токенізує вбудовані елементи
   * @param {string} text - Текст
   * @returns {array} Масив вбудованих токенів
   */
  tokenizeInline(text) {
    const tokens = [];
    let pos = 0;

    while (pos < text.length) {
      let matched = false;

      const codeMatch = text.slice(pos).match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push({
          type: "inlineCode",
          code: codeMatch[1],
          raw: codeMatch[0],
        });
        pos += codeMatch[0].length;
        matched = true;
        continue;
      }

      const linkMatch = text
        .slice(pos)
        .match(/^\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/);
      if (linkMatch) {
        tokens.push({
          type: "link",
          text: linkMatch[1],
          href: linkMatch[2],
          title: linkMatch[3] || null,
          raw: linkMatch[0],
        });
        pos += linkMatch[0].length;
        matched = true;
        continue;
      }

      const imageMatch = text
        .slice(pos)
        .match(/^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)/);
      if (imageMatch) {
        tokens.push({
          type: "image",
          alt: imageMatch[1],
          src: imageMatch[2],
          title: imageMatch[3] || null,
          raw: imageMatch[0],
        });
        pos += imageMatch[0].length;
        matched = true;
        continue;
      }

      const strongMatch = text
        .slice(pos)
        .match(/^\*\*([^\*]+)\*\*|^__([^_]+)__/);
      if (strongMatch) {
        const content = strongMatch[1] || strongMatch[2];
        tokens.push({
          type: "strong",
          text: content,
          raw: strongMatch[0],
        });
        pos += strongMatch[0].length;
        matched = true;
        continue;
      }

      const emMatch = text
        .slice(pos)
        .match(/^\*([^\*]+)\*(?!\*)|^_([^_]+)_(?!_)/);
      if (emMatch) {
        const content = emMatch[1] || emMatch[2];
        tokens.push({
          type: "em",
          text: content,
          raw: emMatch[0],
        });
        pos += emMatch[0].length;
        matched = true;
        continue;
      }

      if (this.options.strikethrough) {
        const delMatch = text.slice(pos).match(/^~~([^~]+)~~/);
        if (delMatch) {
          tokens.push({
            type: "del",
            text: delMatch[1],
            raw: delMatch[0],
          });
          pos += delMatch[0].length;
          matched = true;
          continue;
        }
      }

      if (!matched) {
        const textMatch = text.slice(pos).match(/^(?:(?!!\[)[^\*\[\]_`~])+/);
        if (textMatch) {
          tokens.push({
            type: "text",
            text: textMatch[0],
            raw: textMatch[0],
          });
          pos += textMatch[0].length;
        } else {
          pos++;
        }
      }
    }

    return tokens;
  }
}

module.exports = Tokenizer;
