import React from 'react';
import { useEmail } from '../context/EmailContext';
import { Header } from '../components/Header';
import { EmailRow } from '../components/EmailRow';
import { Clock, Send } from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { activeTab, scheduledEmails, sentEmails, searchQuery, isLoading, setIsComposing } = useEmail();

  const currentEmails = activeTab === 'scheduled' ? scheduledEmails : sentEmails;

  const filteredEmails = currentEmails.filter((email) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      email.subject.toLowerCase().includes(query) ||
      email.body.toLowerCase().includes(query) ||
      email.to.some((r) => r.toLowerCase().includes(query)) ||
      (email.recipientName && email.recipientName.toLowerCase().includes(query))
    );
  });

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Header */}
      <Header />

      {/* Email List Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          /* Loading Skeleton */
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 py-3 border-b border-gray-50">
                <div className="h-4 bg-gray-200 rounded w-28" />
                <div className="h-5 bg-gray-200 rounded-full w-24" />
                <div className="h-4 bg-gray-200 rounded w-72" />
                <div className="h-4 bg-gray-200 rounded w-48" />
              </div>
            ))}
          </div>
        ) : filteredEmails.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-96 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-3">
              {activeTab === 'scheduled' ? <Clock className="w-6 h-6" /> : <Send className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-semibold text-gray-800 mb-1">
              {activeTab === 'scheduled' ? 'No scheduled emails' : 'No sent emails'}
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mb-4">
              {activeTab === 'scheduled'
                ? 'You do not have any emails scheduled for delivery. Compose a new message to schedule one.'
                : 'Emails that have been successfully dispatched will appear here.'}
            </p>
            {activeTab === 'scheduled' && (
              <button
                onClick={() => setIsComposing(true)}
                className="px-4 py-2 border border-[#00A35C] text-[#00A35C] hover:bg-[#E8F8F0] text-xs font-medium rounded-full transition-colors cursor-pointer"
              >
                Compose Email
              </button>
            )}
          </div>
        ) : (
          /* Email Rows */
          <div>
            {filteredEmails.map((email) => (
              <EmailRow key={email.id} email={email} viewType={activeTab} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
