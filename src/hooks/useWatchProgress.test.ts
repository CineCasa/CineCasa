import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useWatchProgress } from './useWatchProgress';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    })),
    channel: vi.fn(() => ({
      on: vi.fn(() => ({
        subscribe: vi.fn(() => ({
          unsubscribe: vi.fn(),
        })),
      })),
      subscribe: vi.fn(() => ({
        unsubscribe: vi.fn(),
      })),
    })),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useWatchProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useWatchProgress(), {
      wrapper: createWrapper(),
    });

    expect(result.current.progress).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBe(null);
  });

  it('should update progress successfully', async () => {
    const mockData = {
      id: '1',
      content_id: 'movie-1',
      progress: 50,
      current_time: 1800,
      total_time: 3600,
    };

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: [mockData],
            error: null,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useWatchProgress({ userId: 'test-user' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.progress).toEqual([mockData]);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle updateProgress mutation', async () => {
    const { result } = renderHook(() => useWatchProgress({ userId: 'test-user' }), {
      wrapper: createWrapper(),
    });

    const mockUpdate = vi.fn().mockResolvedValue({
      data: { id: '1', progress: 75 },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    await result.current.updateProgress('movie-1', 'movie', 2700, 3600);

    expect(mockUpdate).toHaveBeenCalledWith({
      progress: 75,
      current_time: 2700,
      total_time: 3600,
    });
  });

  it('should handle markAsCompleted mutation', async () => {
    const { result } = renderHook(() => useWatchProgress({ userId: 'test-user' }), {
      wrapper: createWrapper(),
    });

    const mockUpdate = vi.fn().mockResolvedValue({
      data: { id: '1', progress: 100 },
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as any);

    await result.current.markAsCompleted('movie-1', 'movie');

    expect(mockUpdate).toHaveBeenCalledWith({
      progress: 100,
      completed_at: expect.any(String),
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error');
    
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            data: null,
            error: mockError,
          }),
        }),
      }),
    } as any);

    const { result } = renderHook(() => useWatchProgress({ userId: 'test-user' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.error).toBe(mockError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle real-time updates', () => {
    const mockChannel = {
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
      unsubscribe: vi.fn(),
    };

    vi.mocked(supabase.channel).mockReturnValue(mockChannel as any);

    renderHook(() => useWatchProgress({ userId: 'test-user', enableRealtime: true }), {
      wrapper: createWrapper(),
    });

    expect(supabase.channel).toHaveBeenCalledWith('watch_progress:test-user');
    expect(mockChannel.on).toHaveBeenCalled();
    expect(mockChannel.subscribe).toHaveBeenCalled();
  });
});
