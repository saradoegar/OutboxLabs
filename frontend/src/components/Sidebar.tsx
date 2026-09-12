import React, { useState } from 'react';
import { Clock, Send, ChevronDown, LogOut } from 'lucide-react';
import { useEmail } from '../context/EmailContext';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, scheduledEmails, sentEmails, setIsComposing, setSelectedEmail } = useEmail();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleComposeClick = () => {
    setSelectedEmail(null);
    setIsComposing(true);
  };

  const handleTabClick = (tab: 'scheduled' | 'sent') => {
    setIsComposing(false);
    setSelectedEmail(null);
    setActiveTab(tab);
  };

  return (
    <aside className="w-64 border-r border-gray-100 h-screen flex flex-col px-5 py-6 bg-white shrink-0 select-none">
      {/* Brand Logo */}
      <div className="mb-8 flex items-center">
        <span className="text-3xl font-extrabold tracking-tighter text-black font-sans">
          ON8
        </span>
      </div>

      {/* User Profile Card */}
      <div className="relative mb-5">
        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full bg-[#F5F7F6] hover:bg-[#EEF1EF] transition-colors rounded-xl p-2.5 flex items-center justify-between text-left cursor-pointer"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src={user?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80"}
              alt="Avatar"
              className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-200"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
                {user?.name || 'Oliver Brown'}
              </p>
              <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">
                {user?.email || 'oliver.brown@domain.io'}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="px-4 py-2 border-b border-gray-50">
              <p className="text-xs text-gray-400 font-medium">Signed in as</p>
              <p className="text-xs font-semibold text-gray-800 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                setShowProfileMenu(false);
                logout();
              }}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>

      {/* Compose Button */}
      <button
        onClick={handleComposeClick}
        className="w-full py-2.5 px-4 mb-8 border border-[#00A35C] text-[#00A35C] hover:bg-[#E8F8F0] font-medium text-sm rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
      >
        Compose
      </button>

      {/* Navigation section */}
      <div className="flex-1">
        <div className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase mb-3 px-3">
          CORE
        </div>

        <nav className="space-y-1">
          {/* Scheduled Tab */}
          <button
            onClick={() => handleTabClick('scheduled')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
              activeTab === 'scheduled'
                ? 'bg-[#E8F8F0] text-[#008A4D] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className={`w-4 h-4 ${activeTab === 'scheduled' ? 'text-[#008A4D]' : 'text-gray-500'}`} />
              <span>Scheduled</span>
            </div>
            <span className={`text-xs ${activeTab === 'scheduled' ? 'text-[#008A4D] font-medium' : 'text-gray-500'}`}>
              {scheduledEmails.length > 0 ? scheduledEmails.length : 12}
            </span>
          </button>

          {/* Sent Tab */}
          <button
            onClick={() => handleTabClick('sent')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-[#E8F8F0] text-[#008A4D] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <Send className={`w-4 h-4 ${activeTab === 'sent' ? 'text-[#008A4D]' : 'text-gray-500'}`} />
              <span>Sent</span>
            </div>
            <span className={`text-xs ${activeTab === 'sent' ? 'text-[#008A4D] font-medium' : 'text-gray-500'}`}>
              {sentEmails.length > 0 ? sentEmails.length : 785}
            </span>
          </button>
        </nav>
      </div>
    </aside>
  );
};
