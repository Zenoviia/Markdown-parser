/**
 * Markdown Renderer Module
 * Рендеринг AST назад у Markdown
 */

/**
 * Рендерить AST у Markdown формат
 */
class MarkdownRenderer {
  constructor(options = {}) {
    this.options = {
      preserveFormatting: options.preserveFormatting || true,
      ...options,
    };

    this.renderers = new Map();
    this.initDefaultRenderers();
  }

  /**
   * Ініціалізує стандартні рендери
   * @private
   */
  initDefaultRenderers() {
    this.renderers.set("root", (node) => this.renderRoot(node));
    this.renderers.set("heading", (node) => this.renderHeading(node));
    this.renderers.set("paragraph", (node) => this.renderParagraph(node));
    this.renderers.set("codeBlock", (node) => this.renderCodeBlock(node));
    this.renderers.set("list", (node) => this.renderList(node));
    this.renderers.set("orderedList", (node) => this.renderOrderedList(node));
    this.renderers.set("blockquote", (node) => this.renderBlockquote(node));
    this.renderers.set("hr", (node) => this.renderHR(node));
    this.renderers.set("table", (node) => this.renderTable(node));
    this.renderers.set("html", (node) => this.renderHTML(node));
    this.renderers.set("text", (node) => this.renderText(node));
    this.renderers.set("inlineCode", (node) => this.renderInlineCode(node));
    this.renderers.set("link", (node) => this.renderLink(node));
    this.renderers.set("image", (node) => this.renderImage(node));
    this.renderers.set("strong", (node) => this.renderStrong(node));
    this.renderers.set("em", (node) => this.renderEm(node));
    this.renderers.set("del", (node) => this.renderDel(node));
    this.renderers.set("listItem", (node) => this.renderListItem(node));
  }

  /**
   * Додає кастомний рендер
   * @param {string} type - Тип вузла
   * @param {function} renderer - Функція рендеринга
   */
  addRenderer(type, renderer) {
    if (typeof renderer !== "function") {
      throw new TypeError("Renderer must be a function");
    }
    this.renderers.set(type, renderer);
  }

  /**
   * Рендерить AST у Markdown
   * @param {object} ast - AST
   * @returns {string} Markdown текст
   */
  render(ast) {
    if (!ast) {
      return "";
    }

    const renderer = this.renderers.get(ast.type);
    if (renderer) {
      return renderer(ast);
    }

    if (ast.children && Array.isArray(ast.children)) {
      return ast.children.map((child) => this.render(child)).join("");
    }

    return "";
  }

  /**
   * Рендерить корінь
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderRoot(node) {
    if (!node.children || !Array.isArray(node.children)) {
      return "";
    }

    return (
      node.children
        .map((child) => this.render(child))
        .join("\n")
        .trim() + "\n"
    );
  }

  /**
   * Рендерить заголовок
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderHeading(node) {
    const hashes = "#".repeat(node.level);
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `${hashes} ${content}\n`;
  }

  /**
   * Рендерить параграф
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderParagraph(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `${content}\n`;
  }

  /**
   * Рендерить блок коду
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderCodeBlock(node) {
    const fence = "```";
    const language = node.language || "";
    const code = node.code || "";

    return `${fence}${language}\n${code}\n${fence}\n`;
  }

  /**
   * Рендерить звичайний список
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderList(node) {
    const items =
      node.items?.map((item) => this.renderListItem(item, "-")).join("\n") ||
      "";

    return `${items}\n`;
  }

  /**
   * Рендерить упорядкований список
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderOrderedList(node) {
    const items =
      node.items
        ?.map((item, i) => this.renderListItem(item, `${i + 1}.`))
        .join("\n") || "";

    return `${items}\n`;
  }

  /**
   * Рендерить елемент списку
   * @private
   * @param {object} node - Вузол
   * @param {string} marker - Маркер списку
   * @returns {string} Markdown
   */
  renderListItem(node, marker) {
    const content =
      node.children
        ?.map((child) => this.render(child))
        .join("")
        .trim() || "";

    return `${marker} ${content}`;
  }

  /**
   * Рендерить цитату
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderBlockquote(node) {
    const content =
      node.children
        ?.map((child) => this.render(child))
        .join("")
        .split("\n")
        .map((line) => (line.trim() ? `> ${line}` : ">"))
        .join("\n") || "";

    return `${content}\n`;
  }

  /**
   * Рендерить горизонтальну лінію
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderHR(node) {
    return "---\n";
  }

  /**
   * Рендерить таблицю
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderTable(node) {
    let markdown = "";

    if (node.thead) {
      // Заголовки
      markdown +=
        "| " +
        node.thead.cells
          ?.map((cell) => {
            const content =
              cell.content
                ?.map((c) => this.render(c))
                .join("")
                .trim() || "";
            return content;
          })
          .join(" | ") +
        " |\n";

      // Розділювач
      markdown +=
        "| " +
        node.thead.cells
          ?.map((cell) => {
            const align = cell.align;
            if (align === "center") return ":---:";
            if (align === "right") return "---:";
            if (align === "left") return ":---";
            return "---";
          })
          .join(" | ") +
        " |\n";
    }

    // Рядки
    if (node.tbody) {
      node.tbody.rows?.forEach((row) => {
        markdown +=
          "| " +
          row.cells
            ?.map((cell) => {
              const content =
                cell.content
                  ?.map((c) => this.render(c))
                  .join("")
                  .trim() || "";
              return content;
            })
            .join(" | ") +
          " |\n";
      });
    }

    return markdown + "\n";
  }

  /**
   * Рендерить HTML блок
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderHTML(node) {
    return node.html + "\n";
  }

  /**
   * Рендерить текст
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderText(node) {
    return node.text || "";
  }

  /**
   * Рендерить вбудований код
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderInlineCode(node) {
    const code = node.code || "";
    return `\`${code}\``;
  }

  /**
   * Рендерить посилання
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderLink(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") ||
      node.text ||
      "";
    const href = node.href || "";
    const title = node.title ? ` "${node.title}"` : "";

    return `[${content}](${href}${title})`;
  }

  /**
   * Рендерить зображення
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderImage(node) {
    const alt = node.alt || "";
    const src = node.src || "";
    const title = node.title ? ` "${node.title}"` : "";

    return `![${alt}](${src}${title})`;
  }

  /**
   * Рендерить жирний текст
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderStrong(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `**${content}**`;
  }

  /**
   * Рендерить курсив
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderEm(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `*${content}*`;
  }

  /**
   * Рендерить закреслений текст
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderDel(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `~~${content}~~`;
  }

  /**
   * Форматує Markdown з відступами
   * @param {string} markdown - Markdown текст
   * @param {number} indentSize - Розмір відступу
   * @returns {string} Форматований Markdown
   */
  format(markdown, indentSize = 2) {
    const lines = markdown.split("\n");
    const formatted = [];
    let inCodeBlock = false;

    for (const line of lines) {
      if (line.trim().startsWith("```")) {
        inCodeBlock = !inCodeBlock;
      }

      if (inCodeBlock) {
        formatted.push(line);
      } else {
        // Основне форматування
        formatted.push(line);
      }
    }

    return formatted.join("\n");
  }

  /**
   * Мініфікує Markdown
   * @param {string} markdown - Markdown текст
   * @returns {string} Мініфікований Markdown
   */
  minify(markdown) {
    return markdown
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .join("\n");
  }
}

module.exports = MarkdownRenderer;
