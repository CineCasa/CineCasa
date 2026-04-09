import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { cinemaData } from './data/cinema';

export const handlers = [
  // Mock cinema data
  rest.get('http://localhost:3000/api/cinema', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json(cinemaData)
    );
  }),

  // Mock user authentication
  rest.post('http://localhost:3000/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
        token: 'mock-token',
      })
    );
  }),

  // Mock user profiles
  rest.get('http://localhost:3000/api/profiles', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          name: 'Test Profile',
          avatar_url: '/test-avatar.png',
          is_kid: false,
          preferences: {},
        },
      ])
    );
  }),

  // Mock watch progress
  rest.get('http://localhost:3000/api/watch-progress', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          content_id: '1',
          progress: 50,
          current_time: 1800,
          total_time: 3600,
        },
      ])
    );
  }),

  // Mock recommendations
  rest.get('http://localhost:3000/api/recommendations', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([
        {
          id: '1',
          title: 'Recommended Movie',
          score: 0.9,
          category: 'personalized',
        },
      ])
    );
  }),
];

export const server = setupServer(...handlers);
