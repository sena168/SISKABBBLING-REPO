'use client';

import { useState } from 'react';
import { ChatEvent, Role, EventHistory } from '@/lib/types';

export default function ChatEventCard({
  event,
  role
}: {
  event: ChatEvent;
  role: Role;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [historyDocs, setHistoryDocs] = useState<EventHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showExpandedMedia, setShowExpandedMedia] = useState(false);

  // Helper to format timestamps to local time
  const formatTime = (ts: string) => {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  const isStakeholder = role === 'stakeholder';

  // 1. Stakeholders never see deleted messages 
  if (isStakeholder && event.is_deleted) {
    return null;
  }

  // Handle fetching history only when clicked
  const handleToggleHistory = async () => {
    if (showHistory) {
      setShowHistory(false);
      return;
    }
    
    setShowHistory(true);
    if (historyDocs.length > 0) return; // already loaded

    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/events/${event.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryDocs(data.history || []);
      }
    } catch (e) {
      console.error('Failed to load history', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  // 2. Deleted Message View (Admins/Leaders/Members)
  if (event.is_deleted) {
    return (
      <div className="flex flex-col gap-1 p-3 border-l-4 border-red-300 bg-red-50/50 rounded-r-lg mb-3">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-gray-700">{event.sender_name || 'Unknown'}</span>
          <span className="text-xs text-gray-500">{formatTime(event.timestamp_wa)}</span>
        </div>
        <div className="text-sm text-red-400 flex items-center gap-1 font-medium italic mt-1 pb-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Message deleted
        </div>
        {(event.body || event.media_url) && (
           <div className="mt-1 flex flex-col gap-2 opacity-60">
             {event.body && <p className="text-gray-600 text-[15px] italic">"{event.body}"</p>}
             {event.media_url && <span className="text-xs text-gray-500 underline">[Media attached previously]</span>}
           </div>
        )}
      </div>
    );
  }

  // 3. Normal / Edited Message View
  const isImage = event.media_type?.startsWith('image/');
  const isVideo = event.media_type?.startsWith('video/');

  return (
    <>
      <div className="flex flex-col p-4 bg-white border border-gray-100 rounded-xl shadow-sm mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{event.sender_name || 'Unknown'}</span>
            {!isStakeholder && event.is_edited && (
              <button 
                onClick={handleToggleHistory}
                className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center gap-1 hover:bg-amber-200 transition"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Edited
              </button>
            )}
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-4">{formatTime(event.timestamp_wa)}</span>
        </div>

        {/* Media Block */}
        {event.media_url && (
          <div className="mb-3 mt-1 cursor-pointer" onClick={() => (isImage || isVideo) && setShowExpandedMedia(true)}>
            {isImage ? (
              <img src={event.media_url} alt="Media" className="max-h-48 rounded-lg object-cover border border-gray-200" />
            ) : isVideo ? (
              <div className="relative max-w-sm rounded-lg bg-gray-900 flex items-center justify-center h-48">
                 <svg className="w-12 h-12 text-white/80" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                 </svg>
              </div>
            ) : (
              <a href={event.media_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-blue-600 p-3 bg-blue-50 rounded-lg max-w-sm border border-blue-100" onClick={e => e.stopPropagation()}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-medium underline truncate">Document Attachment</span>
              </a>
            )}
          </div>
        )}

        {/* Body Block */}
        {event.body && (
          <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
            {event.body}
          </p>
        )}

        {/* Edit History Expansion */}
        {showHistory && !isStakeholder && (
          <div className="mt-4 pt-3 border-t border-gray-100 bg-gray-50 -mx-4 -mb-4 p-4 rounded-b-xl">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Edit History</p>
            {loadingHistory ? (
              <div className="text-xs text-gray-500 animate-pulse">Loading history...</div>
            ) : historyDocs.length > 0 ? (
              <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-2">
                {historyDocs.filter(h => h.change_type === 'edit').map(doc => (
                  <div key={doc.id} className="text-sm bg-white p-3 rounded border border-gray-200 shadow-sm relative pl-6">
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gray-200 rounded"></div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] text-gray-500">{formatTime(doc.timestamp_log)}</span>
                    </div>
                    <p className="text-gray-600 line-through decoration-gray-400">{doc.old_body || '[No text]'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-gray-500">No edit history available.</div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Media Modal */}
      {showExpandedMedia && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setShowExpandedMedia(false)}>
            <div className="absolute top-4 right-4 text-white p-2 cursor-pointer bg-white/10 rounded-full hover:bg-white/20 transition">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            {isImage ? (
               <img src={event.media_url!} alt="Expanded media" className="max-w-full max-h-[90vh] object-contain rounded" onClick={e => e.stopPropagation()}/>
            ) : isVideo ? (
               <video src={event.media_url!} controls autoPlay className="max-w-full max-h-[90vh] rounded outline-none" onClick={e => e.stopPropagation()}/>
            ) : null}
        </div>
      )}
    </>
  );
}
