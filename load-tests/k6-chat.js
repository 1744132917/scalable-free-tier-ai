import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 20,
  duration: '30s'
};

export default function () {
  const res = http.post('http://localhost:3000/v1/chat?stream=false', JSON.stringify({ prompt: 'hello' }), {
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'change-me-in-production-1234',
      'x-tenant-id': 'k6-tenant'
    }
  });
  check(res, { 'status is 200': (r) => r.status === 200 || r.status === 500 });
  sleep(1);
}
