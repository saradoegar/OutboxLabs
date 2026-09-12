import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, FileText } from 'lucide-react';

interface UploadLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (emails: string[]) => void;
  currentCount: number;
}

export const UploadLeadsModal: React.FC<UploadLeadsModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [detectedEmails, setDetectedEmails] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const parseEmailsFromString = (content: string): string[] => {
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    const matches = content.match(emailRegex) || [];
    return Array.from(new Set(matches.map((e) => e.toLowerCase())));
  };

  const handleTextChange = (text: string) => {
    setPasteText(text);
    const parsed = parseEmailsFromString(text);
    setDetectedEmails(parsed);
  };

  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseEmailsFromString(content);
        setDetectedEmails(parsed);
        setPasteText(parsed.join('\n'));
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const loadSampleLeads = () => {
    const sample = [
      'tame@jmail.com',
      'lame@jmail.com',
      'dame@jmail.com',
      'sarah.connor@domain.io',
      'alex.turner@company.co',
      'elena.rostova@techcorp.org',
      'marcus.vance@reachinbox.ai',
    ];
    setFileName('sample_leads.csv');
    setDetectedEmails(sample);
    setPasteText(sample.join('\n'));
  };

  const handleConfirm = () => {
    if (detectedEmails.length > 0) {
      onImport(detectedEmails);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-150 max-w-lg w-full p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Upload Email Leads</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload a CSV/text file or paste emails to parse automatically.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-4 border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#00A35C] bg-[#E8F8F0]/40'
              : fileName
              ? 'border-emerald-300 bg-emerald-50/30'
              : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.txt"
            onChange={handleFileInput}
            className="hidden"
          />
          <div className="flex flex-col items-center">
            {fileName ? (
              <>
                <FileText className="w-8 h-8 text-[#00A35C] mb-2" />
                <p className="text-sm font-semibold text-gray-900">{fileName}</p>
                <p className="text-xs text-gray-500 mt-0.5">Click to choose another file</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-700">
                  Drop CSV / TXT file here or <span className="text-[#00A35C] font-semibold underline">Browse</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Accepts CSV, TXT with comma or newline emails</p>
              </>
            )}
          </div>
        </div>

        {/* Or Paste Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-gray-700">Or Paste Email List</label>
            <button
              type="button"
              onClick={loadSampleLeads}
              className="text-xs text-[#00A35C] hover:underline font-medium cursor-pointer"
            >
              + Load 7 sample leads
            </button>
          </div>
          <textarea
            rows={4}
            value={pasteText}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder="john@example.com, alice@sample.com&#10;bob@test.org"
            className="w-full text-xs font-mono p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#00A35C] focus:bg-white resize-none"
          />
        </div>

        {/* Counter Badge */}
        <div className="mt-3 flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs">
          <span className="text-gray-600">Detected valid email addresses:</span>
          <span className="font-semibold text-gray-900 bg-white px-2.5 py-0.5 rounded-full border border-gray-200">
            {detectedEmails.length} emails
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-800 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={detectedEmails.length === 0}
            className={`px-5 py-2 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
              detectedEmails.length > 0
                ? 'bg-[#00A35C] hover:bg-[#008F50] text-white shadow-xs'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Import {detectedEmails.length} Leads</span>
          </button>
        </div>
      </div>
    </div>
  );
};
