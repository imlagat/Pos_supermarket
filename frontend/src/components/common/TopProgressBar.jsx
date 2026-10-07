import { useEffect, useState } from 'react';
import { useLoadingStore } from '../../stores/loadingStore';

export default function TopProgressBar() {
  const activeRequests = useLoadingStore(state => state.activeRequests);
  const isNavigating = useLoadingStore(state => state.isNavigating);
  const isLoading = activeRequests > 0 || isNavigating;

  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;
    if (isLoading) {
      setVisible(true);
      setWidth(30);
      timer = setInterval(() => {
        setWidth(prev => (prev < 85 ? prev + Math.random() * 10 : prev));
      }, 200);
    } else {
      setWidth(100);
      timer = setTimeout(() => {
        setVisible(false);
        setWidth(0);
      }, 300);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading]);

  if (!visible && width === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent pointer-events-none">
      <div
        className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.9)] transition-all duration-300 ease-out"
        style={{
          width: `${width}%`,
          opacity: visible ? 1 : 0
        }}
      />
    </div>
  );
}
