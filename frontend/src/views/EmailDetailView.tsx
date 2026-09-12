import React from 'react';
import { ArrowLeft, Star, Archive, Trash2, ChevronDown, Zap } from 'lucide-react';
import { useEmail } from '../context/EmailContext';
import { useAuth } from '../context/AuthContext';

export const EmailDetailView: React.FC = () => {
  const { selectedEmail, setSelectedEmail, toggleStar } = useEmail();
  const { user } = useAuth();

  if (!selectedEmail) return null;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Header */}
      <div className="h-16 px-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => setSelectedEmail(null)}
            className="p-1 text-gray-600 hover:text-gray-900 rounded transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-semibold text-gray-900 truncate">
            {selectedEmail.subject} {selectedEmail.referenceId ? `| ${selectedEmail.referenceId}` : ''}
          </h2>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => toggleStar(selectedEmail.id)}
            className="p-1.5 text-gray-400 hover:text-amber-400 rounded-full transition-colors cursor-pointer"
          >
            <Star
              className={`w-4 h-4 ${
                selectedEmail.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
              }`}
            />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full transition-colors cursor-pointer">
            <Archive className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-full transition-colors cursor-pointer">
            <Trash2 className="w-4 h-4" />
          </button>
          <img
            src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80"}
            alt="User avatar"
            className="w-8 h-8 rounded-full ml-2 object-cover border border-gray-200"
          />
        </div>
      </div>

      {/* Main Email Body Content */}
      <div className="flex-1 overflow-y-auto px-10 py-8 max-w-4xl">
        {/* Sender Info Row */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-3">
            {/* Green Avatar Circle */}
            <div className="w-10 h-10 rounded-full bg-[#00A35C] text-white flex items-center justify-center font-semibold text-base">
              {(selectedEmail.recipientName || selectedEmail.from || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-gray-900">
                  {selectedEmail.recipientName || selectedEmail.to?.[0] || 'Recipient'}
                </span>
                <span className="text-xs text-gray-500">
                  &lt;{selectedEmail.from || ''}&gt;
                </span>
              </div>
              <button className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700 cursor-pointer mt-0.5">
                <span>to {selectedEmail.to && selectedEmail.to.length > 0 ? selectedEmail.to.join(', ') : 'me'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <span className="text-xs text-gray-400">
            {selectedEmail.sentAt || selectedEmail.scheduledAt || ''}
          </span>
        </div>

        {/* Message Content */}
        <div className="text-sm text-gray-800 leading-relaxed space-y-4">
          <div className="whitespace-pre-wrap">{selectedEmail.body}</div>

          {/* Ethereal Preview Callout Box */}
          {selectedEmail.etherealPreviewUrl && (
            <div className="my-6 p-4 rounded-md bg-[#FFFDF0] border-l-4 border-[#F59E0B] text-gray-900 text-xs leading-relaxed space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-gray-900">
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                  <span>SMTP Sandbox Delivery (Ethereal Email)</span>
                </div>
                <a
                  href={selectedEmail.etherealPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#00A35C] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Open Preview &rarr;
                </a>
              </div>
              <div className="text-gray-700 truncate">
                <span>Inspect real MIME headers, HTML body, and SMTP transmission receipt.</span>
              </div>
            </div>
          )}
        </div>

        {/* Attachments Section */}
        {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <div className="flex gap-4 flex-wrap">
              {selectedEmail.attachments.map((att) => (
                <div
                  key={att.id}
                  className="w-48 border border-gray-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                >
                  {att.type === 'image' && att.url ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-28 object-cover"
                    />
                  ) : (
                    <div className="w-full h-28 bg-gray-50 flex items-center justify-center text-gray-400 text-xs">
                      {att.name.split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                  )}
                  <div className="p-2.5 bg-white">
                    <p className="text-xs font-medium text-gray-900 truncate">{att.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{att.size}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
