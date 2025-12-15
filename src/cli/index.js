/**
 * CLI - Command Line Interface
 * Інтерфейс командного рядка для парсера Markdown
 */

const fs = require("fs");
const path = require("path");
const MarkdownParser = require("../core/parser");
const HTMLRenderer = require("../renderers/htmlRenderer");
const MarkdownRenderer = require("../renderers/markdownRenderer");
const { PluginManager } = require("../plugins/pluginSystem");

/**
 * Основний клас CLI
 */
class CLI {
  constructor() {
    this.parser = new MarkdownParser();
    this.htmlRenderer = new HTMLRenderer();
    this.markdownRenderer = new MarkdownRenderer();
    this.pluginManager = new PluginManager();
    this.version = "1.0.0";
  }

  /**
   * Парсить аргументи командного рядка
   * @param {array} argv - Аргументи
   */
  async run(argv) {
    if (argv.length < 3) {
      this.showHelp();
      return;
    }

    const command = argv[2];

    try {
      switch (command) {
        case "convert":
          await this.handleConvert(argv.slice(3));
          break;
        case "validate":
          await this.handleValidate(argv.slice(3));
          break;
        case "stats":
          await this.handleStats(argv.slice(3));
          break;
        case "toc":
          await this.handleTableOfContents(argv.slice(3));
          break;
        case "watch":
          await this.handleWatch(argv.slice(3));
          break;
        case "version":
          console.log(`Markdown Parser v${this.version}`);
          break;
        case "help":
        case "--help":
        case "-h":
          this.showHelp();
          break;
        case "plugins":
          this.showPlugins();
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }

  /**
   * Обробляє команду convert
   * @private
   * @param {array} args - Аргументи
   */
  async handleConvert(args) {
    const options = this.parseOptions(args);

    if (!options.input) {
      console.error("Error: input file is required");
      console.log("Usage: convert <input> [options]");
      return;
    }

    if (!fs.existsSync(options.input)) {
      console.error(`Error: file not found: ${options.input}`);
      return;
    }

    const markdown = fs.readFileSync(options.input, "utf-8");
    const output = options.output || options.input.replace(/\.md$/, ".html");
    const format = options.format || "html";

    let result;

    if (format === "html") {
      result = this.parser.parse(markdown);

      if (options.fullPage) {
        result = this.htmlRenderer.generateFullPage(result, {
          title: options.title || path.basename(options.input),
          author: options.author,
          description: options.description,
        });
      }
    } else if (format === "json") {
      result = this.parser.exportAsJSON(markdown);
    } else if (format === "markdown") {
      const ast = this.parser.parseToAST(markdown);
      result = this.markdownRenderer.render(ast);
    }

    fs.writeFileSync(output, result, "utf-8");
    console.log(`✓ Converted: ${options.input} -> ${output}`);
  }

  /**
   * Обробляє команду validate
   * @private
   * @param {array} args - Аргументи
   */
  async handleValidate(args) {
    const options = this.parseOptions(args);

    if (!options.input) {
      console.error("Error: input file is required");
      return;
    }

    if (!fs.existsSync(options.input)) {
      console.error(`Error: file not found: ${options.input}`);
      return;
    }

    const markdown = fs.readFileSync(options.input, "utf-8");

    const validation = this.parser.validate(markdown);

    // Використовуємо об'єднаний parser для валідації форматування
    const formattingIssues = this.parser.validateFormatting(markdown);

    const allErrors = [
      ...validation.errors,
      ...formattingIssues.map(
        (issue) => `Line ${issue.line}: ${issue.message} (${issue.type})`
      ),
    ];

    const isValid = validation.valid && formattingIssues.length === 0;

    if (isValid) {
      console.log("✓ Markdown is valid");
    } else {
      console.log("✗ Markdown has errors:");
      allErrors.forEach((error) => {
        console.log(`  - ${error}`);
      });
    }
  }

  /**
   * Обробляє команду stats
   * @private
   * @param {array} args - Аргументи
   */
  async handleStats(args) {
    const options = this.parseOptions(args);

    if (!options.input) {
      console.error("Error: input file is required");
      return;
    }

    if (!fs.existsSync(options.input)) {
      console.error(`Error: file not found: ${options.input}`);
      return;
    }

    const markdown = fs.readFileSync(options.input, "utf-8");
    const stats = this.parser.getStatistics(markdown);

    console.log("Document Statistics:");
    console.log(`  Lines: ${stats.lines}`);
    console.log(`  Characters: ${stats.characters}`);
    console.log(`  Tokens: ${stats.tokens}`);
    console.log(`  Nodes: ${stats.nodes}`);
    console.log(`  Headings: ${stats.headings}`);
    console.log(`  Links: ${stats.links}`);
    console.log(`  Images: ${stats.images}`);
    console.log(`  Lists: ${stats.lists}`);
    console.log(`  Code blocks: ${stats.codeBlocks}`);
    console.log(`  Tables: ${stats.tables}`);
  }

  /**
   * Обробляє команду toc (Table of Contents)
   * @private
   * @param {array} args - Аргументи
   */
  async handleTableOfContents(args) {
    const options = this.parseOptions(args);

    if (!options.input) {
      console.error("Error: input file is required");
      return;
    }

    if (!fs.existsSync(options.input)) {
      console.error(`Error: file not found: ${options.input}`);
      return;
    }

    const markdown = fs.readFileSync(options.input, "utf-8");
    const ast = this.parser.parseToAST(markdown);
    const astBuilder = require("../core/astBuilder");
    const builder = new astBuilder();
    const toc = builder.generateTableOfContents(ast);

    this.printTableOfContents(toc);

    if (options.output) {
      const tocMarkdown = this.generateTocMarkdown(toc);
      fs.writeFileSync(options.output, tocMarkdown, "utf-8");
      console.log(`\n✓ TOC saved to: ${options.output}`);
    }
  }

  /**
   * Обробляє команду watch
   * @private
   * @param {array} args - Аргументи
   */
  async handleWatch(args) {
    const options = this.parseOptions(args);

    if (!options.input) {
      console.error("Error: input file is required");
      return;
    }

    console.log(`Watching: ${options.input}`);

    let timer = null;
    const debounceDelay = 100;

    const watchFile = () => {
      fs.watch(options.input, (eventType) => {
        if (eventType === "change") {
          clearTimeout(timer);

          timer = setTimeout(() => {
            try {
              const markdown = fs.readFileSync(options.input, "utf-8");
              const output =
                options.output || options.input.replace(/\.md$/, ".html");
              const result = this.parser.parse(markdown);
              fs.writeFileSync(output, result, "utf-8");
              console.log(`✓ Updated: ${new Date().toLocaleTimeString()}`);
            } catch (error) {
              console.error(`Error: ${error.message}`);
            }
          }, debounceDelay);
        }
      });
    };

    watchFile();
    console.log("Press Ctrl+C to stop watching");
  }

  /**
   * Парсить опції
   * @private
   * @param {array} args - Аргументи
   * @returns {object} Об'єкт опцій
   */
  parseOptions(args) {
    const options = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg.startsWith("--")) {
        const key = arg.slice(2);
        const value = args[i + 1];

        if (value && !value.startsWith("--")) {
          options[key] = value;
          i++;
        } else {
          options[key] = true;
        }
      } else if (!options.input) {
        options.input = arg;
      }
    }

    return options;
  }

  /**
   * Показує довідку
   * @private
   */
  showHelp() {
    console.log(`
Markdown Parser CLI v${this.version}

Usage: markdown-parser <command> [options]

Commands:
  convert       Convert Markdown to HTML
  validate      Validate Markdown syntax
  stats         Show document statistics
  toc           Generate table of contents
  watch         Watch for file changes
  plugins       List available plugins
  version       Show version
  help          Show this help message

Options:
  --input, -i    Input file path
  --output, -o   Output file path
  --format       Output format (html, json, markdown)
  --full-page    Generate full HTML page
  --title        Document title
  --author       Document author
  --description  Document description

Examples:
  markdown-parser convert document.md
  markdown-parser convert document.md --output output.html
  markdown-parser convert document.md --full-page --title "My Document"
  markdown-parser stats document.md
  markdown-parser toc document.md --output toc.md
  markdown-parser watch document.md --output document.html
  markdown-parser validate document.md
    `);
  }

  /**
   * Показує список плагінів
   * @private
   */
  showPlugins() {
    const plugins = this.pluginManager.list();
    console.log("Available Plugins:");
    plugins.forEach((plugin, index) => {
      console.log(`  ${index + 1}. ${plugin}`);
    });
  }

  /**
   * Виводить оглавлення
   * @private
   * @param {array} toc - Оглавлення
   * @param {number} level - Поточний рівень
   */
  printTableOfContents(toc, level = 0) {
    toc.forEach((item) => {
      const indent = "  ".repeat(item.level - 1);
      console.log(`${indent}- ${item.text} (#${item.id})`);

      if (item.items && item.items.length > 0) {
        this.printTableOfContents(item.items, level + 1);
      }
    });
  }

  /**
   * Генерує Markdown оглавлення
   * @private
   * @param {array} toc - Оглавлення
   * @returns {string} Markdown оглавлення
   */
  generateTocMarkdown(toc) {
    let markdown = "# Table of Contents\n\n";

    const generateItems = (items, level = 0) => {
      return items
        .map((item) => {
          const indent = "  ".repeat(item.level - 1);
          let result = `${indent}- [${item.text}](#${item.id})\n`;

          if (item.items && item.items.length > 0) {
            result += generateItems(item.items, level + 1);
          }

          return result;
        })
        .join("");
    };

    markdown += generateItems(toc);
    return markdown;
  }
}

module.exports = CLI;

// Виконання, якщо запущено безпосередньо
if (require.main === module) {
  const cli = new CLI();
  cli.run(process.argv);
}
