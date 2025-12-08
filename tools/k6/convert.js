import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 50,
  duration: '10s',
};

export default function () {
  const url = 'http://127.0.0.1:3000/convert';
  const payload = JSON.stringify({ markdown: '# Hello\n\nWorld' });
  const params = { headers: { 'Content-Type': 'application/json' } };
  const res = http.post(url, payload, params);
  check(res, { 'status is 200': (r) => r.status === 200 });
  sleep(1);
}
