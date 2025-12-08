/**
 * HTML Renderer Module
 * Рендеринг AST у HTML
 */

/**
 * Генерує HTML із AST
 */
class HTMLRenderer {
  constructor(options = {}) {
    this.options = {
      sanitize: options.sanitize || false,
      highlightCode: options.highlightCode || false,
      breaks: options.breaks || false,
      typographer: options.typographer || false,
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
   * Видаляє рендер
   * @param {string} type - Тип вузла
   */
  removeRenderer(type) {
    this.renderers.delete(type);
  }

  /**
   * Рендерить AST у HTML
   * @param {object} ast - AST
   * @returns {string} HTML
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
   * @returns {string} HTML
   */
  renderRoot(node) {
    if (!node.children || !Array.isArray(node.children)) {
      return "";
    }

    return node.children.map((child) => this.render(child)).join("");
  }

  /**
   * Рендерить заголовок
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderHeading(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    const id = node.id ? ` id="${this.escape(node.id)}"` : "";
    return `<h${node.level}${id}>${content}</h${node.level}>\n`;
  }

  /**
   * Рендерить параграф
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderParagraph(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `<p>${content}</p>\n`;
  }

  /**
   * Рендерить блок коду
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderCodeBlock(node) {
    const code = this.escape(node.code || "");
    const language = node.language
      ? ` class="language-${this.escape(node.language)}"`
      : "";

    let highlighted = code;
    if (this.options.highlightCode && node.language) {
      highlighted = this.highlightCode(code, node.language);
    }

    return `<pre><code${language}>${highlighted}</code></pre>\n`;
  }

  /**
   * Рендерить звичайний список
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderList(node) {
    const items = node.items?.map((item) => this.render(item)).join("") || "";

    return `<ul>\n${items}</ul>\n`;
  }

  /**
   * Рендерить упорядкований список
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderOrderedList(node) {
    const items = node.items?.map((item) => this.render(item)).join("") || "";

    return `<ol>\n${items}</ol>\n`;
  }

  /**
   * Рендерить елемент списку
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderListItem(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `<li>${content}</li>\n`;
  }

  /**
   * Рендерить цитату
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderBlockquote(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `<blockquote>\n${content}</blockquote>\n`;
  }

  /**
   * Рендерить горизонтальну лінію
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderHR(node) {
    return "<hr />\n";
  }

  /**
   * Рендерить таблицю
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderTable(node) {
    let html = "<table>\n";

    // Рендеримо голову таблиці
    if (node.thead) {
      html += "<thead>\n<tr>\n";
      node.thead.cells?.forEach((cell) => {
        const align = cell.align ? ` style="text-align: ${cell.align}"` : "";
        const content = cell.content?.map((c) => this.render(c)).join("") || "";
        html += `<th${align}>${content}</th>\n`;
      });
      html += "</tr>\n</thead>\n";
    }

    // Рендеримо тіло таблиці
    if (node.tbody) {
      html += "<tbody>\n";
      node.tbody.rows?.forEach((row) => {
        html += "<tr>\n";
        row.cells?.forEach((cell) => {
          const align = cell.align ? ` style="text-align: ${cell.align}"` : "";
          const content =
            cell.content?.map((c) => this.render(c)).join("") || "";
          html += `<td${align}>${content}</td>\n`;
        });
        html += "</tr>\n";
      });
      html += "</tbody>\n";
    }

    html += "</table>\n";
    return html;
  }

  /**
   * Рендерить HTML блок
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderHTML(node) {
    if (this.options.sanitize) {
      return `<!-- HTML block sanitized -->\n`;
    }
    return node.html + "\n";
  }

  /**
   * Рендерить текст
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderText(node) {
    let text = this.escape(node.text || "");

    if (this.options.typographer) {
      text = this.applyTypography(text);
    }

    if (this.options.breaks) {
      text = text.replace(/\n/g, "<br />\n");
    }

    return text;
  }

  /**
   * Рендерить вбудований код
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderInlineCode(node) {
    const code = this.escape(node.code || "");
    return `<code>${code}</code>`;
  }

  /**
   * Рендерить посилання
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderLink(node) {
    const href = this.escape(node.href || "#");
    const title = node.title ? ` title="${this.escape(node.title)}"` : "";
    const content =
      node.children?.map((child) => this.render(child)).join("") ||
      node.text ||
      "";

    return `<a href="${href}"${title}>${content}</a>`;
  }

  /**
   * Рендерить зображення
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderImage(node) {
    const src = this.escape(node.src || "");
    const alt = this.escape(node.alt || "");
    const title = node.title ? ` title="${this.escape(node.title)}"` : "";

    return `<img src="${src}" alt="${alt}"${title} />`;
  }

  /**
   * Рендерить жирний текст
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderStrong(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `<strong>${content}</strong>`;
  }

  /**
   * Рендерить курсив
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderEm(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `<em>${content}</em>`;
  }

  /**
   * Рендерить закреслений текст
   * @private
   * @param {object} node - Вузол
   * @returns {string} HTML
   */
  renderDel(node) {
    const content =
      node.children?.map((child) => this.render(child)).join("") || "";

    return `<del>${content}</del>`;
  }

  /**
   * Екранує HTML символи
   * @private
   * @param {string} text - Текст
   * @returns {string} Екранований текст
   */
  escape(text) {
    if (!text) return "";

    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Підсвічує код
   * @private
   * @param {string} code - Код
   * @param {string} language - Мова
   * @returns {string} Підсвічений код
   */
  highlightCode(code, language) {
    // Базова реалізація без бібліотеки
    // На практиці можна використати highlight.js або prism
    return this.escape(code);
  }

  /**
   * Застосовує типографські правила
   * @private
   * @param {string} text - Текст
   * @returns {string} Текст з типографією
   */
  applyTypography(text) {
    // Лапки
    text = text.replace(/["]/g, "&ldquo;");
    text = text.replace(/["]/g, "&rdquo;");

    // Дефіс
    text = text.replace(/--/g, "&ndash;");
    text = text.replace(/---/g, "&mdash;");

    // Три крапки
    text = text.replace(/\.\.\./g, "&hellip;");

    return text;
  }

  /**
   * Генерує CSS для стилізації
   * @returns {string} CSS
   */
  generateCSS() {
    return `
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
      }

      h1, h2, h3, h4, h5, h6 {
        margin-top: 24px;
        margin-bottom: 16px;
        font-weight: 600;
        line-height: 1.25;
      }

      h1 { font-size: 2em; }
      h2 { font-size: 1.5em; }
      h3 { font-size: 1.25em; }
      h4 { font-size: 1em; }
      h5 { font-size: 0.875em; }
      h6 { font-size: 0.85em; }

      p {
        margin-bottom: 16px;
      }

      ul, ol {
        margin-bottom: 16px;
        padding-left: 2em;
      }

      li {
        margin-bottom: 8px;
      }

      blockquote {
        margin: 0;
        padding: 0 1em;
        color: #6a737d;
        border-left: 0.25em solid #dfe2e5;
        margin-bottom: 16px;
      }

      code {
        background-color: rgba(27, 31, 35, 0.05);
        border-radius: 3px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        font-size: 12px;
        padding: 0.2em 0.4em;
      }

      pre {
        background-color: #f6f8fa;
        border-radius: 6px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
        padding: 16px;
        overflow: auto;
        margin-bottom: 16px;
      }

      pre code {
        background-color: transparent;
        color: inherit;
        font-size: inherit;
        padding: 0;
      }

      table {
        border-collapse: collapse;
        width: 100%;
        margin-bottom: 16px;
      }

      table th, table td {
        border: 1px solid #dfe2e5;
        padding: 6px 13px;
        text-align: left;
      }

      table th {
        background-color: #f6f8fa;
        font-weight: 600;
      }

      table tr:nth-child(2n) {
        background-color: #f6f8fa;
      }

      strong {
        font-weight: 600;
      }

      em {
        font-style: italic;
      }

      del {
        color: #6a737d;
        text-decoration: line-through;
      }

      a {
        color: #0366d6;
        text-decoration: none;
      }

      a:hover {
        text-decoration: underline;
      }

      img {
        max-width: 100%;
        height: auto;
      }

      hr {
        background-color: #e1e4e8;
        border: 0;
        height: 0.25em;
        margin: 24px 0;
        padding: 0;
      }
    `;
  }

  /**
   * Генерує повну HTML сторінку
   * @param {string} content - Вміст
   * @param {object} meta - Метадані
   * @returns {string} HTML сторінка
   */
  generateFullPage(content, meta = {}) {
    const title = meta.title || "Markdown Document";
    const author = meta.author || "";
    const description = meta.description || "";
    const css = meta.css || this.generateCSS();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escape(title)}</title>
  ${author ? `<meta name="author" content="${this.escape(author)}">` : ""}
  ${description ? `<meta name="description" content="${this.escape(description)}">` : ""}
  <style>
    ${css}
  </style>
</head>
<body>
  <article>
    ${content}
  </article>
</body>
</html>`;
  }

  /**
   * Експортує до Markdown
   * @param {object} ast - AST
   * @returns {string} Markdown
   */
  exportToMarkdown(ast) {
    // Можна використовувати для кругового перетворення
    return this.renderToMarkdown(ast);
  }

  /**
   * Рендерить у Markdown формат
   * @private
   * @param {object} node - Вузол
   * @returns {string} Markdown
   */
  renderToMarkdown(node) {
    if (!node) return "";

    switch (node.type) {
      case "root":
        return (
          node.children
            ?.map((child) => this.renderToMarkdown(child))
            .join("\n") || ""
        );
      case "heading":
        return (
          "#".repeat(node.level) +
          " " +
          (node.children?.map((c) => this.renderToMarkdown(c)).join("") || "") +
          "\n"
        );
      case "paragraph":
        return (
          (node.children?.map((c) => this.renderToMarkdown(c)).join("") || "") +
          "\n"
        );
      case "codeBlock":
        return (
          "```" + (node.language || "") + "\n" + (node.code || "") + "\n```\n"
        );
      case "list":
        return (
          (node.items
            ?.map((item) => "- " + this.renderToMarkdown(item))
            .join("\n") || "") + "\n"
        );
      case "orderedList":
        return (
          (node.items
            ?.map((item, i) => i + 1 + ". " + this.renderToMarkdown(item))
            .join("\n") || "") + "\n"
        );
      case "blockquote":
        return (
          (node.children
            ?.map((c) => "> " + this.renderToMarkdown(c))
            .join("") || "") + "\n"
        );
      case "hr":
        return "---\n";
      case "text":
        return node.text || "";
      case "strong":
        return (
          "**" +
          (node.children?.map((c) => this.renderToMarkdown(c)).join("") || "") +
          "**"
        );
      case "em":
        return (
          "*" +
          (node.children?.map((c) => this.renderToMarkdown(c)).join("") || "") +
          "*"
        );
      case "link":
        return (
          "[" +
          (node.children?.map((c) => this.renderToMarkdown(c)).join("") ||
            node.text ||
            "") +
          "](" +
          node.href +
          ")"
        );
      case "image":
        return "![" + (node.alt || "") + "](" + (node.src || "") + ")";
      default:
        return "";
    }
  }
}

module.exports = HTMLRenderer;
