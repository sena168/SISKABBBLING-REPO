'use client';

import { useState, useEffect } from 'react';

export default function HealthStatus() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'down'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('API failed');
        const data = await res.json();
        
        if (!mounted) return;
        
        // Find WAHA service status
        const wahaLog = data.health?.find((l: any) => l.service === 'waha');
        
        if (wahaLog && wahaLog.status === 'ok') {
          setStatus('ok');
        } else {
          setStatus('down');
        }
        setLastChecked(new Date());
      } catch (err) {
        if (mounted) {
          setStatus('down');
          setLastChecked(new Date());
        }
      }
    }

    checkHealth();
    
    // Poll every 60 seconds
    const interval = setInterval(checkHealth, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 rounded-full px-3 py-1 shadow-sm">
      <div className="relative flex h-3 w-3">
        {status === 'checking' && (
          <div className="h-3 w-3 bg-gray-300 rounded-full animate-pulse"></div>
        )}
        {status === 'ok' && (
          <div className="h-3 w-3 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
        )}
        {status === 'down' && (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
          </>
        )}
      </div>
      <span className="font-medium">
        WAHA {status === 'ok' ? 'Online' : status === 'down' ? 'Offline' : 'Checking'}
      </span>
    </div>
  );
}
