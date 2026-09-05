import http from 'k6/http';

export default function () {
  http.post('http://localhost:3000/v1/chat', JSON.stringify({ prompt: 'simulate failover' }), {
    headers: {
      'content-type': 'application/json',
      'x-api-key': 'change-me-in-production-1234',
      'x-tenant-id': 'failover'
    }
  });
}
