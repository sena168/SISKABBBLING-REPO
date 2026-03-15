'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ChatEventCard from '@/components/ChatEventCard';
import Pagination from '@/components/Pagination';
import { ChatEvent, Role } from '@/lib/types';
import { auth } from '@/lib/firebase-client';

export default function ChatLogPage() {
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    sender: '',
    from: '',
    to: '',
    type: '',
  });

  // Export Modal State
  const [showExport, setShowExport] = useState(false);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exporting, setExporting] = useState(false);

  // Fetch initial role
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        await auth.authStateReady();
        const user = auth.currentUser;
        if (!user) {
           setError('No active session.');
           return;
        }
        const token = await user.getIdToken();
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setRole(data.role as Role);
        }
      } catch (e) {
        if (mounted) setError('Session error.');
      }
    }
    init();
    return () => { mounted = false; };
  }, []);

  // Fetch Events
  const fetchEvents = useCallback(async (showSkeleton = true) => {
    if (!role) return;
    if (showSkeleton) setLoading(true);
    
    try {
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : '';
      
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      if (filters.sender) params.append('sender', filters.sender);
      if (filters.from) params.append('from', new Date(filters.from).toISOString());
      
      // Add end of day for 'to' date
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        params.append('to', toDate.toISOString());
      }
      if (filters.type) params.append('type', filters.type);

      const res = await fetch(`/api/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('API error');
      
      const data = await res.json();
      setEvents(data.events || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError('Unable to load patrol data. Please refresh or contact your administrator.');
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, [page, filters, role]);

  // Initial fetch and dependency fetch
  useEffect(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(false); // Background refresh, no skeleton
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1); // reset to page 1 on filter
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : '';
      
      const params = new URLSearchParams();
      params.append('format', exportFormat);
      if (exportFrom) params.append('from', new Date(exportFrom).toISOString());
      if (exportTo) {
        const toDate = new Date(exportTo);
        toDate.setHours(23, 59, 59, 999);
        params.append('to', toDate.toISOString());
      }

      const res = await fetch(`/api/export?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Export failed');
      
      // Trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `patrol-export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setShowExport(false);
    } catch (err) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const showExportBtn = role === 'admin' || role === 'leader';
  const showTypeFilter = role !== 'stakeholder';

  if (!role && !error) return null; // wait for role setup

  return (
    <div className="flex flex-col h-full relative space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-xl font-bold text-gray-900">Patrol Log</h1>
        {showExportBtn && (
          <button
            onClick={() => setShowExport(true)}
            className="text-sm bg-white border border-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-50 flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Logs
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Sender</label>
          <input
            type="text"
            name="sender"
            placeholder="Search name..."
            value={filters.sender}
            onChange={handleFilterChange}
            className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[130px]">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">From Date</label>
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[130px]">
          <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">To Date</label>
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
        </div>
        {showTypeFilter && (
          <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
            <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Event Type</label>
            <select
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
            >
              <option value="">All Types</option>
              <option value="message">Message</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="document">Document</option>
            </select>
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="flex-1 mt-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-4 h-32 flex flex-col gap-3">
                 <div className="flex justify-between w-full"><div className="h-4 bg-gray-200 rounded w-1/4"></div><div className="h-3 bg-gray-200 rounded w-16"></div></div>
                 <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                 <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
             </div>
             <p className="text-gray-600 font-medium">No patrol messages found for this period</p>
             <p className="text-sm text-gray-400 mt-1">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {events.map((evt) => (
              <ChatEventCard key={evt.id} event={evt} role={role as Role} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
         <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* Export Modal */}
      {showExportBtn && showExport && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Export Patrol Logs</h2>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">Format</label>
                <select 
                   value={exportFormat}
                   onChange={e => setExportFormat(e.target.value)}
                   className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 text-gray-900"
                >
                  <option value="csv">CSV (Spreadsheet)</option>
                  <option value="json">JSON (Raw Data)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">From Date (Optional)</label>
                <input 
                   type="date" 
                   value={exportFrom}
                   onChange={e => setExportFrom(e.target.value)}
                   className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 text-gray-900" 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-gray-700">To Date (Optional)</label>
                <input 
                   type="date" 
                   value={exportTo}
                   onChange={e => setExportTo(e.target.value)}
                   className="w-full text-sm border border-gray-300 rounded-md py-2 px-3 text-gray-900" 
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button 
                onClick={() => setShowExport(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {exporting ? 'Exporting...' : 'Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
