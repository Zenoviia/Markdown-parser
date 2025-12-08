const request = require('supertest');

describe('rate limiting', () => {
  let app;

  beforeAll(() => {
    // configure env for fast window during the test
    process.env.RATE_LIMIT_WINDOW_MS = '1000';
    process.env.RATE_LIMIT_MAX = '5';
    // require after env set
    app = require('../../src/server').createServer();
  });

  afterAll(() => {
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX;
  });

  test('exceeds global rate limit and returns 429', async () => {
    const promises = [];
    for (let i = 0; i < 7; i++) {
      promises.push(request(app)
        .post('/convert')
        .set('Content-Type', 'application/json')
        .send({ markdown: '# test' }));
    }

    const results = await Promise.all(promises);
    const statuses = results.map(r => r.status);
    // At least one request should be rate limited (429)
    expect(statuses).toContain(429);
  });
});
