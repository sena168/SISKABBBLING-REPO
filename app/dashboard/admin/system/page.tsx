'use client';

import { useState, useEffect } from 'react';
import { HealthLog } from '@/lib/types';
import { auth } from '@/lib/firebase-client';

export default function SystemPage() {
  const [healthLogs, setHealthLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [backupTriggering, setBackupTriggering] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    async function fetchHealth() {
      try {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user) throw new Error('Not authenticated');
        
        const token = await user.getIdToken();
        const res = await fetch('/api/health', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error('Failed to fetch health logs');
        
        const data = await res.json();
        setHealthLogs(data.health || []);
      } catch (err) {
        setError('Unable to load health status.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchHealth();
  }, []);

  const handleBackup = async () => {
    if (!confirm('Are you sure you want to trigger a manual database backup?')) {
      return;
    }

    setBackupTriggering(true);
    setBackupMessage(null);
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : '';
      
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Backup request failed');
      }
      
      setBackupMessage({ type: 'success', text: 'Backup triggered successfully. The backup process has started in the background.' });
    } catch (err: any) {
      setBackupMessage({ type: 'error', text: err.message });
    } finally {
      setBackupTriggering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex flex-col h-full relative space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">System Controls</h1>
        <p className="text-sm text-gray-500 mt-1">Manage database backups and view service health.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Backup Card */}
        <div className="col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col items-start h-fit">
           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
             <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
             </svg>
           </div>
           <h3 className="font-bold text-gray-900 text-lg">Database Backup</h3>
           <p className="text-sm text-gray-600 mt-1 mb-6 leading-relaxed">
             Trigger a manual backup of the Neon PostgreSQL database via the n8n webhook.
           </p>
           
           <button
             onClick={handleBackup}
             disabled={backupTriggering}
             className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
           >
             {backupTriggering ? 'Triggering...' : 'Request Database Backup'}
           </button>

           {backupMessage && (
             <div className={`mt-4 w-full p-3 rounded text-sm ${backupMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
               {backupMessage.text}
             </div>
           )}
        </div>

        {/* Health Logs */}
        <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
           <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-bold text-gray-800">Latest Service Health</h3>
           </div>
           
           {error ? (
             <div className="p-6 text-red-500 text-sm">{error}</div>
           ) : loading ? (
             <div className="p-6 space-y-4">
               {[1, 2].map(i => (
                 <div key={i} className="animate-pulse flex justify-between h-4 bg-gray-100 rounded"></div>
               ))}
             </div>
           ) : healthLogs.length === 0 ? (
             <div className="p-6 text-gray-500 text-sm">No health logs available.</div>
           ) : (
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                  <thead className="bg-white text-gray-400 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 font-medium">Service</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium">Last Checked</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {healthLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold uppercase text-xs tracking-wider">{log.service}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {new Date(log.ts).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
