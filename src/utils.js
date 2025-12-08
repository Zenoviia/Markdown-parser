/**
 * Utils Module
 * Утилітарні функції
 */

/**
 * Утилітарні методи для роботи з текстом та даними
 */
class Utils {
  /**
   * Екранує спеціальні символи регулярного виразу
   * @param {string} str - Строка
   * @returns {string} Екранована строка
   */
  static escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Екранує HTML
   * @param {string} html - HTML
   * @returns {string} Екранований HTML
   */
  static escapeHtml(html) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return html.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Розекранює HTML
   * @param {string} html - HTML
   * @returns {string} Розекранований HTML
   */
  static unescapeHtml(html) {
    const map = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      "#39": "'",
    };
    return html.replace(/&([^;]+);/g, (m, p1) => map[p1] || m);
  }

  /**
   * Перевіряє, чи строка містить URL
   * @param {string} str - Строка
   * @returns {boolean} Результат
   */
  static isUrl(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Перевіряє, чи строка є email
   * @param {string} str - Строка
   * @returns {boolean} Результат
   */
  static isEmail(str) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  }

  /**
   * Перевіряє, чи строка містить HTML теги
   * @param {string} str - Строка
   * @returns {boolean} Результат
   */
  static containsHtmlTags(str) {
    return /<[^>]*>/g.test(str);
  }

  /**
   * Знаходить все посилання у тексті
   * @param {string} text - Текст
   * @returns {array} Масив посилань
   */
  static findUrls(text) {
    const urlRegex = /https?:\/\/[^\s]+/g;
    return text.match(urlRegex) || [];
  }

  /**
   * Знаходить всі email адреси у тексті
   * @param {string} text - Текст
   * @returns {array} Масив email адрес
   */
  static findEmails(text) {
    const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
    return text.match(emailRegex) || [];
  }

  /**
   * Випадковим чином перемішує масив
   * @param {array} arr - Масив
   * @returns {array} Перемішаний масив
   */
  static shuffle(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Видаляє дублікати з масиву
   * @param {array} arr - Масив
   * @returns {array} Масив без дублікатів
   */
  static unique(arr) {
    return [...new Set(arr)];
  }

  /**
   * Групує масив за ключем
   * @param {array} arr - Масив об'єктів
   * @param {string} key - Ключ для групування
   * @returns {object} Об'єкт з групами
   */
  static groupBy(arr, key) {
    return arr.reduce((result, item) => {
      const group = item[key];
      if (!result[group]) {
        result[group] = [];
      }
      result[group].push(item);
      return result;
    }, {});
  }

  /**
   * Сортує масив об'єктів
   * @param {array} arr - Масив
   * @param {string} key - Ключ для сортування
   * @param {string} order - 'asc' або 'desc'
   * @returns {array} Відсортований масив
   */
  static sortBy(arr, key, order = "asc") {
    const sorted = [...arr];
    sorted.sort((a, b) => {
      if (a[key] < b[key]) return order === "asc" ? -1 : 1;
      if (a[key] > b[key]) return order === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  /**
   * Фільтрує масив за умовою
   * @param {array} arr - Масив
   * @param {function} predicate - Функція умови
   * @returns {array} Відфільтрований масив
   */
  static filter(arr, predicate) {
    return arr.filter(predicate);
  }

  /**
   * Трансформує масив
   * @param {array} arr - Масив
   * @param {function} transform - Функція трансформації
   * @returns {array} Трансформований масив
   */
  static map(arr, transform) {
    return arr.map(transform);
  }

  /**
   * Знаходить перший елемент
   * @param {array} arr - Масив
   * @param {function} predicate - Функція умови
   * @returns {*} Елемент або undefined
   */
  static find(arr, predicate) {
    return arr.find(predicate);
  }

  /**
   * Перевіряє, чи хоча б один елемент відповідає умові
   * @param {array} arr - Масив
   * @param {function} predicate - Функція умови
   * @returns {boolean} Результат
   */
  static some(arr, predicate) {
    return arr.some(predicate);
  }

  /**
   * Перевіряє, чи всі елементи відповідають умові
   * @param {array} arr - Масив
   * @param {function} predicate - Функція умови
   * @returns {boolean} Результат
   */
  static every(arr, predicate) {
    return arr.every(predicate);
  }

  /**
   * Об'єднує масиви
   * @param {...array} arrays - Масиви
   * @returns {array} Об'єднаний масив
   */
  static concat(...arrays) {
    return arrays.reduce((result, arr) => result.concat(arr), []);
  }

  /**
   * Розбиває масив на чанки
   * @param {array} arr - Масив
   * @param {number} size - Розмір чанка
   * @returns {array} Масив чанків
   */
  static chunk(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Клонує об'єкт
   * @param {object} obj - Об'єкт
   * @returns {object} Клон об'єкта
   */
  static clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Об'єднує об'єкти
   * @param {...object} objects - Об'єкти
   * @returns {object} Об'єднаний об'єкт
   */
  static merge(...objects) {
    return Object.assign({}, ...objects);
  }

  /**
   * Отримує значення з вложеного об'єкта
   * @param {object} obj - Об'єкт
   * @param {string} path - Шлях (наприклад 'a.b.c')
   * @returns {*} Значення або undefined
   */
  static get(obj, path) {
    return path.split(".").reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Встановлює значення у вложеному об'єкті
   * @param {object} obj - Об'єкт
   * @param {string} path - Шлях
   * @param {*} value - Значення
   */
  static set(obj, path, value) {
    const keys = path.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Перевіряє, чи об'єкт порожній
   * @param {object} obj - Об'єкт
   * @returns {boolean} Результат
   */
  static isEmpty(obj) {
    return Object.keys(obj).length === 0;
  }

  /**
   * Отримує ключі об'єкта
   * @param {object} obj - Об'єкт
   * @returns {array} Масив ключів
   */
  static keys(obj) {
    return Object.keys(obj);
  }

  /**
   * Отримує значення об'єкта
   * @param {object} obj - Об'єкт
   * @returns {array} Масив значень
   */
  static values(obj) {
    return Object.values(obj);
  }

  /**
   * Отримує пари ключ-значення
   * @param {object} obj - Об'єкт
   * @returns {array} Масив пар
   */
  static entries(obj) {
    return Object.entries(obj);
  }

  /**
   * Інвертує об'єкт (ключи стають значеннями)
   * @param {object} obj - Об'єкт
   * @returns {object} Інвертований об'єкт
   */
  static invert(obj) {
    const inverted = {};
    for (const [key, value] of Object.entries(obj)) {
      inverted[value] = key;
    }
    return inverted;
  }

  /**
   * Перевіряє, чи два об'єкти рівні
   * @param {*} a - Перший об'єкт
   * @param {*} b - Другий об'єкт
   * @returns {boolean} Результат
   */
  static deepEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === "object") {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;

      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!this.deepEqual(a[key], b[key])) return false;
      }
      return true;
    }

    return false;
  }

  /**
   * Опускає значення з об'єкта
   * @param {object} obj - Об'єкт
   * @param {array} keys - Ключі для видалення
   * @returns {object} Новий об'єкт
   */
  static omit(obj, keys) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (!keys.includes(key)) {
        result[key] = value;
      }
    }
    return result;
  }

  /**
   * Вибирає значення з об'єкта
   * @param {object} obj - Об'єкт
   * @param {array} keys - Ключі для вибору
   * @returns {object} Новий об'єкт
   */
  static pick(obj, keys) {
    const result = {};
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    return result;
  }
}

module.exports = Utils;
