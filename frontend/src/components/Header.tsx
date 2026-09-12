import React from 'react';
import { Search, SlidersHorizontal, RotateCw } from 'lucide-react';
import { useEmail } from '../context/EmailContext';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, refreshEmails, isLoading } = useEmail();

  return (
    <div className="h-16 px-8 border-b border-gray-100 flex items-center justify-between gap-4 bg-white shrink-0">
      {/* Search Input Bar */}
      <div className="relative flex-1 max-w-xl">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full pl-10 pr-4 py-2 bg-[#F4F6F5] hover:bg-[#EEF1F0] focus:bg-white text-sm text-gray-800 placeholder-gray-400 rounded-full border border-transparent focus:border-gray-200 focus:outline-none transition-all"
        />
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-2">
        <button
          title="Filter"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
        <button
          title="Refresh"
          onClick={() => refreshEmails()}
          className={`p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer ${
            isLoading ? 'animate-spin text-[#00A35C]' : ''
          }`}
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
