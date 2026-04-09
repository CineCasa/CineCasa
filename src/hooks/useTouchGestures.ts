import { useRef, useEffect, useCallback } from 'react';

interface TouchPoint {
  x: number;
  y: number;
  time: number;
}

interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
  velocity: number;
}

interface TouchGestureOptions {
  onSwipe?: (gesture: SwipeGesture) => void;
  onTap?: (point: TouchPoint) => void;
  onDoubleTap?: (point: TouchPoint) => void;
  onLongPress?: (point: TouchPoint) => void;
  onPinch?: (scale: number, center: TouchPoint) => void;
  onTouchStart?: (point: TouchPoint) => void;
  onTouchMove?: (point: TouchPoint) => void;
  onTouchEnd?: (point: TouchPoint) => void;
  swipeThreshold?: number;
  tapThreshold?: number;
  longPressDelay?: number;
  doubleTapDelay?: number;
  preventDefault?: boolean;
}

export function useTouchGestures(element: HTMLElement | null, options: TouchGestureOptions = {}) {
  const {
    onSwipe,
    onTap,
    onDoubleTap,
    onLongPress,
    onPinch,
    swipeThreshold = 50,
    tapThreshold = 10,
    longPressDelay = 500,
    doubleTapDelay = 300,
    preventDefault = true,
  } = options;

  const startPoint = useRef<TouchPoint | null>(null);
  const endPoint = useRef<TouchPoint | null>(null);
  const lastTap = useRef<TouchPoint | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isPinching = useRef(false);
  const initialDistance = useRef(0);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: Touch, touch2: Touch): TouchPoint => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
      time: Date.now(),
    };
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!element || preventDefault) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    if (!touch) return;

    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    startPoint.current = point;
    endPoint.current = point;

    // Long press
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(point);
        longPressTimer.current = null;
      }, longPressDelay);
    }

    // Double tap
    if (onDoubleTap && lastTap.current) {
      const timeDiff = point.time - lastTap.current.time;
      const distance = Math.sqrt(
        Math.pow(point.x - lastTap.current.x, 2) + 
        Math.pow(point.y - lastTap.current.y, 2)
      );

      if (timeDiff < doubleTapDelay && distance < tapThreshold) {
        onDoubleTap(point);
        lastTap.current = null;
        return;
      }
    }

    lastTap.current = point;
  }, [element, onLongPress, onDoubleTap, longPressDelay, doubleTapDelay, tapThreshold, preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!element || !startPoint.current || preventDefault) {
      e.preventDefault();
    }

    // Cancelar long press se mover
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Pinch gesture
    if (onPinch && e.touches.length === 2) {
      isPinching.current = true;
      
      const distance = getDistance(e.touches[0], e.touches[1]);
      if (initialDistance.current === 0) {
        initialDistance.current = distance;
      } else {
        const scale = distance / initialDistance.current;
        const center = getCenter(e.touches[0], e.touches[1]);
        onPinch(scale, center);
      }
    }
  }, [element, onPinch, preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!element || !startPoint.current || preventDefault) {
      e.preventDefault();
    }

    const touch = e.changedTouches[0];
    if (!touch) return;

    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    endPoint.current = point;

    // Cancelar long press
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    // Swipe gesture
    if (onSwipe && !isPinching.current) {
      const deltaX = point.x - startPoint.current.x;
      const deltaY = point.y - startPoint.current.y;
      const deltaTime = point.time - startPoint.current.time;
      const swipeDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (swipeDistance > swipeThreshold) {
        let direction: SwipeGesture['direction'];

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        const velocity = swipeDistance / deltaTime;
        const duration = deltaTime;

        onSwipe({
          direction,
          distance: swipeDistance,
          duration,
          velocity,
        });
      }
    }

    // Tap gesture
    if (onTap && !isPinching.current && swipeDistance < tapThreshold) {
      onTap(point);
    }

    // Reset
    startPoint.current = null;
    endPoint.current = null;
    isPinching.current = false;
    initialDistance.current = 0;
  }, [element, onSwipe, onTap, swipeThreshold, tapThreshold, preventDefault]);

  useEffect(() => {
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, [element, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Limpar timers
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return {
    // Métodos para controle manual
    clearStartPoint: () => { startPoint.current = null; },
    clearEndPoint: () => { endPoint.current = null; },
    getCurrentStartPoint: () => startPoint.current,
    getCurrentEndPoint: () => endPoint.current,
  } as {
    clearStartPoint: () => void;
    clearEndPoint: () => void;
    getCurrentStartPoint: () => TouchPoint | null;
    getCurrentEndPoint: () => TouchPoint | null;
  };
}

// Hook para swipe em carrossel
export function useCarouselSwipe(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 50
) {
  const elementRef = useRef<HTMLElement>(null);

  const { onSwipe } = useTouchGestures(elementRef.current, {
    onSwipe: (gesture) => {
      if (gesture.direction === 'left' && onSwipeLeft) {
        onSwipeLeft();
      } else if (gesture.direction === 'right' && onSwipeRight) {
        onSwipeRight();
      }
    },
    swipeThreshold: threshold,
    preventDefault: true,
  });

  return {
    elementRef,
    swipeLeft: onSwipeLeft,
    swipeRight: onSwipeRight,
  };
}

// Hook para pan (arrastar)
export function usePan(
  onPan?: (deltaX: number, deltaY: number) => void,
  onPanStart?: () => void,
  onPanEnd?: () => void
) {
  const elementRef = useRef<HTMLElement>(null);
  const isPanning = useRef(false);
  const lastPoint = useRef<TouchPoint | null>(null);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPanning.current || !lastPoint.current) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - lastPoint.current.x;
    const deltaY = touch.clientY - lastPoint.current.y;

    if (onPan) {
      onPan(deltaX, deltaY);
    }

    lastPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  }, [onPan]);

  const { onTouchStart } = useTouchGestures(elementRef.current, {
    onTouchStart: () => {
      isPanning.current = true;
      onPanStart?.();
    },
    onTouchMove: handleTouchMove,
    onTouchEnd: () => {
      isPanning.current = false;
      lastPoint.current = null;
      onPanEnd?.();
    },
    preventDefault: true,
  });

  return {
    elementRef,
    isPanning: isPanning.current,
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

  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures(elementRef.current, {
    onTouchStart: (point) => {
      pullDistance.current = 0;
      isPulling.current = false;
    },
    onTouchMove: (point) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const startY = rect.top + point.y;
      const pullDistance = Math.max(0, startY - rect.top);

      pullDistance.current = pullDistance;

      // Visual feedback
      if (pullDistance > threshold) {
        isPulling.current = true;
        elementRef.current.style.transform = `translateY(${Math.min(pullDistance, threshold + 20)}px)`;
      }
    },
    onTouchEnd: async () => {
      if (isPulling.current) {
        // Reset visual
        elementRef.current.style.transform = '';
        
        // Debounce refresh
        if (refreshTimeout.current) {
          clearTimeout(refreshTimeout.current);
        }

        refreshTimeout.current = setTimeout(async () => {
          try {
            await onRefresh();
          } finally {
            isPulling.current = false;
            pullDistance.current = 0;
          }
        }, debounceTime);
      }
    },
    preventDefault: true,
  });

  return {
    elementRef,
    isPulling: isPulling.current,
    pullDistance: pullDistance.current,
    canRefresh: pullDistance.current > threshold,
  };
}
