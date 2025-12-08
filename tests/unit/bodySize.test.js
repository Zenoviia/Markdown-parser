const request = require('supertest');

describe('body size limit', () => {
  let app;

  beforeAll(() => {
    process.env.BODY_SIZE_LIMIT = '1kb';
    app = require('../../src/server').createServer();
  });

  afterAll(() => {
    delete process.env.BODY_SIZE_LIMIT;
  });

  test('rejects payloads larger than BODY_SIZE_LIMIT', async () => {
    // create a payload slightly larger than 1kb
    const large = 'a'.repeat(1024 + 100);
    const res = await request(app)
      .post('/convert')
      .set('Content-Type', 'application/json')
      .send({ markdown: large });

    // express should return 413 Payload Too Large
    expect([413, 400]).toContain(res.status);
  });
});
