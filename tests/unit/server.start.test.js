const request = require('supertest');
const { createServer } = require('../../src/server');

describe('server.start smoke tests', () => {
  let app;

  beforeAll(() => {
    app = createServer();
  });

  test('POST /convert with non-JSON content-type returns 400', async () => {
    // send as text/plain to simulate non-JSON requests
    const res = await request(app)
      .post('/convert')
      .set('Content-Type', 'text/plain')
      .send('# Hi');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /convert with correct JSON returns html', async () => {
    const res = await request(app)
      .post('/convert')
      .set('Content-Type', 'application/json')
      .send({ markdown: '# Hi' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('html');
  });
});
