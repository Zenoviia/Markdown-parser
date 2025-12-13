/**
 * Advanced Parser Features
 * Розширені можливості парсера
 */

const Tokenizer = require("./tokenizer");

/**
 * Розширений парсер з додатковими можливостями
 */
class AdvancedParser {
  constructor(options = {}) {
    this.options = options;
    this.tokenizer = new Tokenizer(options);
    this.cache = new Map();
    this.hooks = {
      beforeParse: [],
      afterParse: [],
      onError: [],
    };
  }

  /**
   * Реєструє hook
   * @param {string} event - Назва события
   * @param {function} callback - Функція зворотного виклику
   */
  on(event, callback) {
    if (this.hooks[event]) {
      this.hooks[event].push(callback);
    }
  }

  /**
   * Викликає hooks
   * @private
   * @param {string} event - Назва события
   * @param {*} data - Дані
   */
  emit(event, data) {
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
    const entry = this.cache.get(key);
    return entry ? entry.value : null;
  }

  /**
   * Очищає кеш
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Аналізує Markdown з кешем
   * @param {string} markdown - Markdown текст
   * @param {boolean} useCache - Використовувати кеш
   * @returns {object} Результат парсування
   */
  parseWithCache(markdown, useCache = true) {
    const cacheKey = this.hashString(markdown);

    if (useCache && this.cache.has(cacheKey)) {
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
   * Парсує Markdown
   * @param {string} markdown - Markdown текст
   * @returns {object} Результат
   */
  parse(markdown) {
    return {
      tokens: this.tokenizer.tokenize(markdown),
      markdown: markdown,
    };
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
   * Знаходить дублікати
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
   * Сортує рядки
   * @param {string} markdown - Markdown текст
   * @param {function} compareFn - Функція порівняння
   * @returns {string} Відсортований текст
   */
  sortLines(markdown, compareFn = null) {
    const lines = markdown.split("\n");
    const sortedLines = lines.sort(compareFn);
    return sortedLines.join("\n");
  }

  /**
   * Фільтрує рядки
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
   * Трансформує кожен рядок
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
   * Знаходить розходження у форматуванні
   * @param {string} markdown - Markdown текст
   * @returns {array} Проблеми з форматуванням
   */
validateFormatting(markdown) {
    const issues = [];
    const lines = markdown.split("\n");
    let inCodeBlock = false; // <--- НОВИЙ СТАН
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;
      
      // 1. ПЕРЕВІРКА І ОНОВЛЕННЯ СТАНУ БЛОКУ КОДУ
      const fenceMatch = line.trim().match(/^(`{3,}|~{3,})/);
      if (fenceMatch) {
          // Знайдено огороджувальний паркан (початок або кінець)
          inCodeBlock = !inCodeBlock;
      }
      
      // 2. Виконуємо суворі перевірки тільки для звичайних рядків (не коду і не всередині коду)
      // Крім того, перевірка backticks НЕ повинна запускатися на рядках, які є парканами
      if (inCodeBlock || fenceMatch) {
          // Якщо ми всередині коду або на рядку паркана, пропускаємо всі inline-перевірки.
          continue;
      }

      // 3. Стандартні inline-перевірки (викликали false positive раніше)
      // Перевірка на незакриті квадратні кронштейни
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

      // 4. ПЕРЕВІРКА НА БЕКТИКИ (тепер вона запускається ТІЛЬКИ для звичайного тексту)
      const backticks = (line.match(/`/g) || []).length;
      if (backticks % 2 !== 0) {
        issues.push({
          line: lineNumber,
          type: "unmatched_backticks",
          message: "Unmatched backticks (odd number of backticks found)",
        });
      }
    }
    
    // 5. ОПЦІЙНО: Перевірка, чи не закінчився файл у блоці коду
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
   * Визначає найвживаніші слова
   * @param {string} markdown - Markdown текст
   * @param {number} limit - Кількість слів
   * @returns {array} Найвживаніші слова
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
   * Отримує словник слів
   * @param {string} markdown - Markdown текст
   * @returns {array} Відсортований словник
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

module.exports = AdvancedParser;
