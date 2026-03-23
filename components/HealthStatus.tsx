'use client';

import { useState, useEffect, useRef } from 'react';

export default function HealthStatus() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'down' | 'unknown'>(
    'checking'
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [message, setMessage] = useState<string>('');
  const lastFetchRef = useRef<number>(0);

  const checkHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();

      setStatus(data.status as 'ok' | 'down');
      setLastChecked(data.lastChecked ? new Date(data.lastChecked) : null);
      setMessage(data.message || '');
    } catch (err) {
      setStatus('unknown');
      setLastChecked(new Date());
      setMessage('Status unknown');
    }
  };

  const handleManualRefresh = async () => {
    const now = Date.now();
    // Don't create a new Neon query if last fetch was less than 60 seconds ago
    if (now - lastFetchRef.current < 60000) {
      return;
    }

    lastFetchRef.current = now;
    setStatus('checking');

    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();

      setStatus(data.status as 'ok' | 'down');
      setLastChecked(data.lastChecked ? new Date(data.lastChecked) : null);
      setMessage(data.message || '');
    } catch (err) {
      setStatus('unknown');
      setLastChecked(new Date());
      setMessage('Status unknown');
    }
  };

  useEffect(() => {
    let mounted = true;

    checkHealth();
    lastFetchRef.current = Date.now();

    // Poll every 10 minutes (600000ms)
    const interval = setInterval(checkHealth, 600000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className='flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm'>
      <div className='relative flex h-3 w-3'>
        {status === 'checking' && (
          <div className='h-3 w-3 bg-gray-300 rounded-full animate-pulse'></div>
        )}
        {status === 'ok' && (
          <div className='h-3 w-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]'></div>
        )}
        {status === 'down' && (
          <>
            <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75'></span>
            <span className='relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'></span>
          </>
        )}
        {status === 'unknown' && (
          <div className='h-3 w-3 bg-yellow-400 rounded-full animate-pulse'></div>
        )}
      </div>
      <div className='flex flex-col items-start'>
        <span className='font-medium'>
          WAHA{' '}
          {status === 'ok'
            ? 'Online'
            : status === 'down'
              ? 'Offline'
              : status === 'unknown'
                ? 'Status Unknown'
                : 'Checking'}
        </span>
        {message && <span className='text-xs text-gray-500'>{message}</span>}
      </div>
      <button
        onClick={handleManualRefresh}
        className='ml-2 p-1 rounded hover:bg-gray-100 transition-colors'
        title='Refresh health status'
      >
        {/* Refresh icon - using circular arrows */}
        <svg
          xmlns='http://www.w3.org/2000/svg'
          className='h-4 w-4 text-gray-500 hover:text-gray-700'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
          strokeLinejoin='round'
        >
          <path d='M21 12a9 9 0 1 1-6.219-8.56'></path>
          <polyline points='17 6 21 6 21 10'></polyline>
          <polyline points='7 18 3 18 3 14'></polyline>
        </svg>
      </button>
    </div>
  );
}
