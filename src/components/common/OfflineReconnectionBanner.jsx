import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, X } from 'lucide-react';

export default function OfflineReconnectionBanner() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    let timer = null;

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setShowBanner(false);
      }, 3500);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-out transform shadow-md text-xs font-semibold py-2.5 px-4 flex items-center justify-between ${
        isOnline
          ? 'bg-emerald-600 text-white border-b border-emerald-700 animate-slide-down'
          : 'bg-amber-600 text-white border-b border-amber-700 animate-slide-down'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto w-full flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 shrink-0 animate-pulse text-emerald-200" />
          ) : (
            <WifiOff className="w-4 h-4 shrink-0 text-amber-200" />
          )}
          <span>
            {isOnline
              ? 'Internet connection restored! Background sync complete.'
              : 'You are currently offline. Forms and inquiries are safely queued locally until reconnect.'}
          </span>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1 hover:bg-black/20 rounded transition-colors text-white shrink-0 cursor-pointer"
          aria-label="Dismiss connectivity notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
