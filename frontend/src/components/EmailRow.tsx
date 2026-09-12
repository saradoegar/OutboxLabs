import React from 'react';
import { Clock, Star } from 'lucide-react';
import type { EmailItem } from '../types/email';
import { useEmail } from '../context/EmailContext';

interface EmailRowProps {
  email: EmailItem;
  viewType: 'scheduled' | 'sent';
}

export const EmailRow: React.FC<EmailRowProps> = ({ email, viewType }) => {
  const { setSelectedEmail, toggleStar } = useEmail();

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleStar(email.id);
  };

  const recipientDisplay = email.recipientName || email.to[0] || 'Unknown';

  return (
    <div
      onClick={() => setSelectedEmail(email)}
      className="group flex items-center justify-between px-8 py-3.5 border-b border-gray-100 hover:bg-gray-50/80 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1 pr-4">
        {/* Recipient */}
        <div className="w-40 shrink-0">
          <span className="text-sm font-semibold text-gray-900 truncate block">
            To: {recipientDisplay}
          </span>
        </div>

        {/* Status / Scheduled Time Badge */}
        {viewType === 'scheduled' ? (
          <div className="shrink-0 bg-[#FFF2EA] text-[#E05318] px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border border-[#FED7C2]/60">
            <Clock className="w-3.5 h-3.5 text-[#E05318]" />
            <span>{email.scheduledAt || 'Scheduled'}</span>
          </div>
        ) : (
          <div className="shrink-0 bg-[#F1F3F5] text-gray-600 px-3 py-0.5 rounded-full text-xs font-medium">
            Sent
          </div>
        )}

        {/* Subject & Preview Snippet */}
        <div className="flex items-baseline gap-1 text-sm truncate min-w-0 flex-1">
          <span className="font-semibold text-gray-900 shrink-0">
            {email.subject}
          </span>
          <span className="text-gray-400 truncate">
            {' - '}
            {email.body.replace(/<[^>]*>?/gm, '')}
          </span>
        </div>
      </div>

      {/* Star Action */}
      <button
        onClick={handleStarClick}
        className="p-1 text-gray-300 hover:text-amber-400 group-hover:opacity-100 transition-colors cursor-pointer shrink-0"
        title={email.isStarred ? 'Unstar' : 'Star'}
      >
        <Star
          className={`w-4 h-4 ${
            email.isStarred ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
          }`}
        />
      </button>
    </div>
  );
};
