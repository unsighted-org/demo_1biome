// src/mocks/handlers.js
import { rest } from 'msw';

export const handlers = [
  rest.post('/api/notifications/token', (req, res, ctx) => {
    return res(ctx.json({ token: 'test-token' }));
  }),
  rest.post('/api/notifications/register', (req, res, ctx) => {
    return res(ctx.status(200));
  }),
];
