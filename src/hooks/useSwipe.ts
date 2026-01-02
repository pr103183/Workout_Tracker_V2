import { useCallback, useRef, TouchEvent } from 'react';

interface SwipeHandlers {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
}

const MIN_SWIPE_DISTANCE = 50;

export const useSwipe = ({ onSwipedLeft, onSwipedRight }: SwipeHandlers) => {
  const touchStart = useRef<number | null>(null);
  const touchEnd = useRef<number | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    touchEnd.current = e.targetTouches[0].clientX;
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distance = touchStart.current - touchEnd.current;
    const isLeftSwipe = distance > MIN_SWIPE_DISTANCE;
    const isRightSwipe = distance < -MIN_SWIPE_DISTANCE;

    if (isLeftSwipe && onSwipedLeft) {
      onSwipedLeft();
    }

    if (isRightSwipe && onSwipedRight) {
      onSwipedRight();
    }

    touchStart.current = null;
    touchEnd.current = null;
  }, [onSwipedLeft, onSwipedRight]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
