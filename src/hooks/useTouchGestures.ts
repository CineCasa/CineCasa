import { useRef, useCallback } from 'react';

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface TouchGestureOptions {
  onTouchStart?: (point: TouchPoint) => void;
  onTouchMove?: (point: TouchPoint) => void;
  onTouchEnd?: (point: TouchPoint) => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: () => void;
  onLongPress?: () => void;
  swipeThreshold?: number;
  longPressThreshold?: number;
}

export function useTouchGestures(
  element: HTMLElement | null,
  options: TouchGestureOptions = {}
) {
  const startPoint = useRef<TouchPoint | null>(null);
  const currentPoint = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    swipeThreshold = 50,
    longPressThreshold = 500
  } = options;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!element) return;
    
    const touch = e.touches[0];
    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    currentPoint.current = startPoint.current;

    // Start long press timer
    longPressTimer.current = setTimeout(() => {
      if (startPoint.current) {
        onLongPress?.();
      }
    }, longPressThreshold);

    onTouchStart?.(startPoint.current);
  }, [element, onTouchStart, onLongPress, longPressThreshold]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!element || !startPoint.current) return;
    
    const touch = e.touches[0];
    currentPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };

    // Clear long press timer if moved
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    onTouchMove?.(currentPoint.current);
  }, [element, onTouchMove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!element || !startPoint.current || !currentPoint.current) return;
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const deltaX = currentPoint.current.x - startPoint.current.x;
    const deltaY = currentPoint.current.y - startPoint.current.y;
    const deltaTime = currentPoint.current.timestamp - startPoint.current.timestamp;

    // Check for swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > swipeThreshold) {
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    } else if (deltaTime < 200) {
      // Tap
      onTap?.();
    }

    onTouchEnd?.(currentPoint.current);
    
    startPoint.current = null;
    currentPoint.current = null;
  }, [element, onTouchEnd, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap, swipeThreshold]);

  // Add event listeners
  if (element) {
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  // Cleanup function
  const cleanup = useCallback(() => {
    if (element) {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    }
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, [element, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    cleanup
  };
}

// Hook para pull-to-refresh
export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  threshold = 80,
  debounceTime = 500
) {
  const elementRef = useRef<HTMLElement>(null);
  const isPulling = useRef(false);
  const pullDistance = useRef(0);
  const refreshTimeout = useRef<NodeJS.Timeout | null>(null);

  const { cleanup } = useTouchGestures(elementRef.current, {
    onTouchStart: (point) => {
      pullDistance.current = 0;
      isPulling.current = false;
    },
    onTouchMove: (point) => {
      if (!elementRef.current) return;

      const deltaY = point.y - (elementRef.current.getBoundingClientRect().top || 0);
      
      if (deltaY > 0 && deltaY < 200) {
        pullDistance.current = deltaY;
        isPulling.current = true;
        
        // Apply visual feedback
        elementRef.current.style.transform = `translateY(${deltaY / 2}px)`;
        elementRef.current.style.transition = 'none';
      }
    },
    onTouchEnd: async (point) => {
      if (isPulling.current && pullDistance.current > threshold) {
        // Trigger refresh
        if (refreshTimeout.current) {
          clearTimeout(refreshTimeout.current);
        }

        refreshTimeout.current = setTimeout(async () => {
          try {
            await onRefresh();
          } catch (error) {
            console.error('Erro ao atualizar:', error);
          }
        }, 100);
      }
      
      // Reset visual
      if (elementRef.current) {
        elementRef.current.style.transform = '';
        elementRef.current.style.transition = 'transform 0.3s ease';
      }
      
      pullDistance.current = 0;
      isPulling.current = false;
    }
  });

  return {
    elementRef,
    isPulling: () => isPulling.current,
    pullDistance: () => pullDistance.current,
    cleanup
  };
}
