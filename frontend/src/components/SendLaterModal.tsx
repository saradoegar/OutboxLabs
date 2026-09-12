import React, { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

interface SendLaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchedule: (formattedTime: string, isoDate?: string) => void;
  currentSchedule?: string;
}

export const SendLaterModal: React.FC<SendLaterModalProps> = ({
  isOpen,
  onClose,
  onSelectSchedule,
  currentSchedule = '',
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string>(currentSchedule || 'Tomorrow');
  const [customDateTime, setCustomDateTime] = useState<string>('');
  const modalRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedPreset(currentSchedule || 'Tomorrow');
  }, [currentSchedule, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleMouseDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presets = [
    'Tomorrow',
    'Tomorrow, 10:00 AM',
    'Tomorrow, 11:00 AM',
    'Tomorrow, 3:00 PM',
  ];

  const handleDone = () => {
    if (customDateTime) {
      const d = new Date(customDateTime);
      const formatted = d.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      onSelectSchedule(formatted, d.toISOString());
    } else if (selectedPreset) {
      onSelectSchedule(selectedPreset);
    }
    onClose();
  };

  const handleCustomDateClick = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  return (
    <div
      ref={modalRef}
      className="absolute right-8 top-16 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-150 p-6 animate-in fade-in zoom-in-95 duration-150"
    >
      {/* Title */}
      <h3 className="text-base font-semibold text-gray-900 mb-4">Send Later</h3>

      {/* Date & Time Picker Row matching Figma */}
      <div
        onClick={handleCustomDateClick}
        className="relative mb-4 pb-2 border-b border-gray-200 flex items-center justify-between cursor-pointer group"
      >
        <div className="flex-1">
          {customDateTime ? (
            <span className="text-sm font-medium text-gray-900">
              {new Date(customDateTime).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          ) : (
            <span className="text-sm text-gray-400 group-hover:text-gray-600 transition-colors">
              Pick date & time
            </span>
          )}
        </div>
        <Calendar className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors shrink-0" />

        {/* Hidden datetime-local input triggered on click */}
        <input
          type="datetime-local"
          ref={dateInputRef}
          value={customDateTime}
          onChange={(e) => {
            setCustomDateTime(e.target.value);
            setSelectedPreset('');
          }}
          className="absolute inset-0 opacity-0 cursor-pointer pointer-events-auto"
        />
      </div>

      {/* Preset List */}
      <div className="space-y-1 mb-6">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => {
              setSelectedPreset(preset);
              setCustomDateTime('');
            }}
            className={`w-full text-left py-2.5 px-3 rounded-lg text-sm transition-colors cursor-pointer ${
              selectedPreset === preset && !customDateTime
                ? 'bg-[#E8F8F0] text-[#008A4D] font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* Footer Buttons matching Figma */}
      <div className="flex items-center justify-end gap-4 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDone}
          className="px-6 py-1.5 border border-[#00A35C] text-[#00A35C] hover:bg-[#E8F8F0] text-sm font-medium rounded-full transition-colors cursor-pointer active:scale-95"
        >
          Done
        </button>
      </div>
    </div>
  );
};
