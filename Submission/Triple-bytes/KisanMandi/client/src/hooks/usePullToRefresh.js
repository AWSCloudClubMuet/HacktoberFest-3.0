import { useEffect, useRef } from 'react';

export function usePullToRefresh(onRefresh) {
  const startY = useRef(null);
  const refreshing = useRef(false);

  useEffect(() => {
    const start = (event) => {
      if (window.scrollY === 0) startY.current = event.touches[0].clientY;
    };
    const end = async (event) => {
      if (startY.current == null || refreshing.current) return;
      const distance = event.changedTouches[0].clientY - startY.current;
      startY.current = null;
      if (distance > 80) {
        refreshing.current = true;
        try { await onRefresh(); } finally { refreshing.current = false; }
      }
    };
    window.addEventListener('touchstart', start, { passive: true });
    window.addEventListener('touchend', end, { passive: true });
    return () => {
      window.removeEventListener('touchstart', start);
      window.removeEventListener('touchend', end);
    };
  }, [onRefresh]);
}
