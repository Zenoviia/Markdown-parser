/**
 * Utils Module Tests
 * Тести для утилітарних функцій
 */

const Utils = require("../../src/utils");

describe("Utils", () => {
  describe("String Escaping", () => {
    test("escapeRegex should escape special regex characters", () => {
      expect(Utils.escapeRegex("a.b*c?d")).toBe("a\\.b\\*c\\?d");
      expect(Utils.escapeRegex("(test)")).toBe("\\(test\\)");
      expect(Utils.escapeRegex("[a-z]")).toBe("\\[a-z\\]");
      expect(Utils.escapeRegex("$100")).toBe("\\$100");
    });

    test("escapeHtml should escape HTML entities", () => {
      expect(Utils.escapeHtml("<p>Hello</p>")).toBe("&lt;p&gt;Hello&lt;/p&gt;");
      expect(Utils.escapeHtml('Say "Hi"')).toBe("Say &quot;Hi&quot;");
      expect(Utils.escapeHtml("It's mine")).toBe("It&#39;s mine");
      expect(Utils.escapeHtml("A & B")).toBe("A &amp; B");
    });

    test("unescapeHtml should unescape HTML entities", () => {
      expect(Utils.unescapeHtml("&lt;p&gt;")).toBe("<p>");
      expect(Utils.unescapeHtml("&quot;Hello&quot;")).toBe('"Hello"');
      expect(Utils.unescapeHtml("&#39;Hi&#39;")).toBe("'Hi'");
      expect(Utils.unescapeHtml("A &amp; B")).toBe("A & B");
    });

    test("escapeHtml and unescapeHtml should be reversible", () => {
      const original = '<p>"Hello & welcome\'s"</p>';
      const escaped = Utils.escapeHtml(original);
      const unescaped = Utils.unescapeHtml(escaped);
      expect(unescaped).toBe(original);
    });
  });

  describe("Validation", () => {
    test("isUrl should validate URLs", () => {
      expect(Utils.isUrl("https://example.com")).toBe(true);
      expect(Utils.isUrl("http://localhost:3000")).toBe(true);
      expect(Utils.isUrl("ftp://ftp.example.com")).toBe(true);
      expect(Utils.isUrl("not a url")).toBe(false);
      expect(Utils.isUrl("example.com")).toBe(false);
    });

    test("isEmail should validate emails", () => {
      expect(Utils.isEmail("user@example.com")).toBe(true);
      expect(Utils.isEmail("test.email@domain.co.uk")).toBe(true);
      expect(Utils.isEmail("invalid.email")).toBe(false);
      expect(Utils.isEmail("@example.com")).toBe(false);
      expect(Utils.isEmail("user@")).toBe(false);
    });

    test("containsHtmlTags should detect HTML tags", () => {
      expect(Utils.containsHtmlTags("<p>text</p>")).toBe(true);
      expect(Utils.containsHtmlTags("Plain text")).toBe(false);
      expect(Utils.containsHtmlTags("<br/>")).toBe(true);
      expect(Utils.containsHtmlTags("<>")).toBe(true);
    });
  });

  describe("Text Extraction", () => {
    test("findUrls should extract URLs from text", () => {
      const text = "Check https://example.com and http://test.org here";
      const urls = Utils.findUrls(text);
      expect(urls).toContain("https://example.com");
      expect(urls).toContain("http://test.org");
      expect(urls.length).toBe(2);
    });

    test("findUrls should return empty array if no URLs", () => {
      const urls = Utils.findUrls("No URLs here");
      expect(urls).toEqual([]);
    });

    test("findEmails should extract email addresses", () => {
      const text = "Contact user@example.com or admin@test.org";
      const emails = Utils.findEmails(text);
      expect(emails).toContain("user@example.com");
      expect(emails).toContain("admin@test.org");
      expect(emails.length).toBe(2);
    });

    test("findEmails should return empty array if no emails", () => {
      const emails = Utils.findEmails("No emails here");
      expect(emails).toEqual([]);
    });
  });

  describe("Array Operations", () => {
    test("shuffle should shuffle array elements", () => {
      const arr = [1, 2, 3, 4, 5];
      const shuffled = Utils.shuffle(arr);
      expect(shuffled).toHaveLength(5);
      expect(new Set(shuffled)).toEqual(new Set(arr));
      // Original should not be modified
      expect(arr).toEqual([1, 2, 3, 4, 5]);
    });

    test("unique should remove duplicates", () => {
      expect(Utils.unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(Utils.unique(["a", "b", "a"])).toEqual(["a", "b"]);
      expect(Utils.unique([])).toEqual([]);
    });

    test("groupBy should group array by key", () => {
      const arr = [
        { type: "a", value: 1 },
        { type: "b", value: 2 },
        { type: "a", value: 3 },
      ];
      const grouped = Utils.groupBy(arr, "type");
      expect(grouped.a).toHaveLength(2);
      expect(grouped.b).toHaveLength(1);
      expect(grouped.a[0].value).toBe(1);
    });

    test("sortBy should sort array by key", () => {
      const arr = [
        { name: "Charlie", age: 30 },
        { name: "Alice", age: 25 },
        { name: "Bob", age: 35 },
      ];
      const sorted = Utils.sortBy(arr, "age", "asc");
      expect(sorted[0].age).toBe(25);
      expect(sorted[1].age).toBe(30);
      expect(sorted[2].age).toBe(35);
    });

    test("sortBy should sort in descending order", () => {
      const arr = [{ val: 1 }, { val: 3 }, { val: 2 }];
      const sorted = Utils.sortBy(arr, "val", "desc");
      expect(sorted[0].val).toBe(3);
      expect(sorted[1].val).toBe(2);
      expect(sorted[2].val).toBe(1);
    });

    test("filter should filter array", () => {
      const arr = [1, 2, 3, 4, 5];
      const filtered = Utils.filter(arr, (x) => x > 2);
      expect(filtered).toEqual([3, 4, 5]);
    });

    test("map should transform array", () => {
      const arr = [1, 2, 3];
      const mapped = Utils.map(arr, (x) => x * 2);
      expect(mapped).toEqual([2, 4, 6]);
    });

    test("find should find first matching element", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(Utils.find(arr, (x) => x > 3)).toBe(4);
      expect(Utils.find(arr, (x) => x > 10)).toBeUndefined();
    });

    test("some should check if any element matches", () => {
      const arr = [1, 2, 3, 4, 5];
      expect(Utils.some(arr, (x) => x > 4)).toBe(true);
      expect(Utils.some(arr, (x) => x > 10)).toBe(false);
    });

    test("every should check if all elements match", () => {
      const arr = [2, 4, 6];
      expect(Utils.every(arr, (x) => x % 2 === 0)).toBe(true);
      expect(Utils.every(arr, (x) => x > 5)).toBe(false);
    });

    test("concat should concatenate arrays", () => {
      const result = Utils.concat([1, 2], [3, 4], [5]);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    test("chunk should split array into chunks", () => {
      const chunked = Utils.chunk([1, 2, 3, 4, 5], 2);
      expect(chunked).toEqual([[1, 2], [3, 4], [5]]);
    });

    test("chunk with exact divisor", () => {
      const chunked = Utils.chunk([1, 2, 3, 4], 2);
      expect(chunked).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });
  });

  describe("Object Operations", () => {
    test("clone should create deep copy", () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = Utils.clone(original);
      expect(cloned).toEqual(original);
      cloned.b.c = 99;
      expect(original.b.c).toBe(2); // Original unchanged
    });

    test("merge should merge objects", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { b: 3, c: 4 };
      const merged = Utils.merge(obj1, obj2);
      expect(merged).toEqual({ a: 1, b: 3, c: 4 });
    });

    test("get should retrieve nested values", () => {
      const obj = { a: { b: { c: "value" } } };
      expect(Utils.get(obj, "a.b.c")).toBe("value");
      expect(Utils.get(obj, "a.b")).toEqual({ c: "value" });
      expect(Utils.get(obj, "a.x.y")).toBeUndefined();
    });

    test("set should set nested values", () => {
      const obj = {};
      Utils.set(obj, "a.b.c", "value");
      expect(obj.a.b.c).toBe("value");
    });

    test("isEmpty should check if object is empty", () => {
      expect(Utils.isEmpty({})).toBe(true);
      expect(Utils.isEmpty({ a: 1 })).toBe(false);
      expect(Utils.isEmpty({ a: undefined })).toBe(false);
    });

    test("keys should get object keys", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(Utils.keys(obj)).toEqual(["a", "b", "c"]);
    });

    test("values should get object values", () => {
      const obj = { a: 1, b: 2, c: 3 };
      expect(Utils.values(obj)).toEqual([1, 2, 3]);
    });

    test("entries should get key-value pairs", () => {
      const obj = { a: 1, b: 2 };
      expect(Utils.entries(obj)).toEqual([
        ["a", 1],
        ["b", 2],
      ]);
    });

    test("invert should invert object", () => {
      const obj = { a: "x", b: "y", c: "z" };
      const inverted = Utils.invert(obj);
      expect(inverted).toEqual({ x: "a", y: "b", z: "c" });
    });

    test("deepEqual should compare objects deeply", () => {
      expect(
        Utils.deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })
      ).toBe(true);
      expect(Utils.deepEqual({ a: 1 }, { a: 2 })).toBe(false);
      expect(Utils.deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
      expect(Utils.deepEqual("test", "test")).toBe(true);
      expect(Utils.deepEqual(null, null)).toBe(true);
    });

    test("omit should remove keys from object", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const omitted = Utils.omit(obj, ["b", "d"]);
      expect(omitted).toEqual({ a: 1, c: 3 });
      expect(obj).toEqual({ a: 1, b: 2, c: 3, d: 4 }); // Original unchanged
    });

    test("pick should select keys from object", () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const picked = Utils.pick(obj, ["a", "c"]);
      expect(picked).toEqual({ a: 1, c: 3 });
    });

    test("pick with non-existent keys", () => {
      const obj = { a: 1, b: 2 };
      const picked = Utils.pick(obj, ["a", "x", "y"]);
      expect(picked).toEqual({ a: 1 });
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty arrays", () => {
      expect(Utils.unique([])).toEqual([]);
      expect(Utils.concat([])).toEqual([]);
      expect(Utils.chunk([], 2)).toEqual([]);
    });

    test("should handle empty objects", () => {
      expect(Utils.keys({})).toEqual([]);
      expect(Utils.values({})).toEqual([]);
      expect(Utils.entries({})).toEqual([]);
    });

    test("should handle null and undefined gracefully", () => {
      expect(Utils.get({ a: null }, "a")).toBeNull();
      expect(Utils.get({ a: undefined }, "a")).toBeUndefined();
      expect(Utils.deepEqual(null, undefined)).toBe(false);
    });

    test("should handle special characters in strings", () => {
      const special = '!@#$%^&*()[]{}";:<>?,./~`\\|';
      const escaped = Utils.escapeRegex(special);
      expect(escaped).toBeDefined();
      expect(escaped).not.toBe(special);
    });
  });
});
