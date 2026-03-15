'use client';

import { useState, useEffect, useCallback } from 'react';
import ChatEventCard from '@/components/ChatEventCard';
import Pagination from '@/components/Pagination';
import { ChatEvent } from '@/lib/types';
import { auth } from '@/lib/firebase-client';

export default function StakeholderPage() {
  const [events, setEvents] = useState<ChatEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    from: '',
    to: '',
  });

  const fetchEvents = useCallback(async (showSkeleton = true) => {
    if (showSkeleton) setLoading(true);
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      
      const token = await user.getIdToken();
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '50');
      
      if (filters.from) params.append('from', new Date(filters.from).toISOString());
      if (filters.to) {
        const toDate = new Date(filters.to);
        toDate.setHours(23, 59, 59, 999);
        params.append('to', toDate.toISOString());
      }

      const res = await fetch(`/api/events?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('API error');
      
      const data = await res.json();
      setEvents(data.events || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setError('');
    } catch (err) {
      setError('Unable to load patrol data.');
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchEvents(true);
  }, [fetchEvents]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setPage(1);
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      
      {/* Date Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</label>
          <input
            type="date"
            name="from"
            value={filters.from}
            onChange={handleFilterChange}
            className="w-full text-sm border border-gray-300 rounded-md py-2.5 px-3 focus:ring-slate-500 focus:border-slate-500 text-gray-900"
          />
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</label>
          <input
            type="date"
            name="to"
            value={filters.to}
            onChange={handleFilterChange}
            className="w-full text-sm border border-gray-300 rounded-md py-2.5 px-3 focus:ring-slate-500 focus:border-slate-500 text-gray-900"
          />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm">
          {error}
        </div>
      )}

      {/* Events List */}
      <div className="flex-1 mt-2">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-32 flex flex-col gap-3">
                 <div className="flex justify-between w-full"><div className="h-4 bg-gray-200 rounded w-1/4"></div><div className="h-3 bg-gray-200 rounded w-16"></div></div>
                 <div className="h-4 bg-gray-200 rounded w-3/4 mt-2"></div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
             </div>
             <p className="text-gray-600 font-medium text-lg">No records available</p>
             <p className="text-sm text-gray-400 mt-1 max-w-sm">No official patrol records match the selected date range.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((evt) => (
              <ChatEventCard key={evt.id} event={evt} role="stakeholder" />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
         <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
