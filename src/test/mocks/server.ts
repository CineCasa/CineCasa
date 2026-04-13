import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { cinemaData } from './data/cinema';

export const handlers = [
  // Mock cinema data
  http.get('http://localhost:3000/api/cinema', () => {
    return HttpResponse.json(cinemaData, { status: 200 });
  }),

  // Mock user authentication
  http.post('http://localhost:3000/api/auth/login', () => {
    return HttpResponse.json({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
      token: 'mock-token',
    }, { status: 200 });
  }),

  // Mock user profiles
  http.get('http://localhost:3000/api/profiles', () => {
    return HttpResponse.json([
      {
        id: '1',
        name: 'Test Profile',
        avatar_url: '/test-avatar.png',
        is_kid: false,
        preferences: {},
      },
    ], { status: 200 });
  }),

  // Mock watch progress
  http.get('http://localhost:3000/api/watch-progress', () => {
    return HttpResponse.json([
      {
        id: '1',
        content_id: '1',
        progress: 50,
        current_time: 1800,
        total_time: 3600,
      },
    ], { status: 200 });
  }),

  // Mock recommendations
  http.get('http://localhost:3000/api/recommendations', () => {
    return HttpResponse.json([
      {
        id: '1',
        title: 'Recommended Movie',
        score: 0.9,
        category: 'personalized',
      },
    ], { status: 200 });
  }),
];

export const server = setupServer(...handlers);
