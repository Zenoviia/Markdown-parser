const request = require("supertest");
const { createServer } = require("../../src/server");

describe("Express-like Server - HTTP endpoints", () => {
  let server;
  let listener;

  beforeAll((done) => {
    server = createServer();
    // start listening on an ephemeral port
    listener = server.listen(0, () => done());
  });

  afterAll((done) => {
    if (listener && listener.close) listener.close(done);
    else done();
  });

  test("POST /convert returns HTML", async () => {
    const res = await request(server)
      .post("/convert")
      .send({ markdown: "# Hello World" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    expect(res.body.html).toMatch(/<h1[^>]*>.*Hello World.*<\/h1>/);
  });

  test("POST /parse returns AST", async () => {
    const res = await request(server)
      .post("/parse")
      .send({ markdown: "# A\n\nParagraph" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ast");
    expect(res.body.ast.type).toBe("root");
    expect(Array.isArray(res.body.ast.children)).toBe(true);
  });

  test("POST /validate handles invalid input", async () => {
    const res = await request(server)
      .post("/validate")
      .send({ markdown: null })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("valid");
  });
});
