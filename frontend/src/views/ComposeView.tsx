import React, { useState, useRef } from 'react';
import { ArrowLeft, Paperclip, Clock, Upload, X, ChevronDown, Check } from 'lucide-react';
import { useEmail } from '../context/EmailContext';
import { useAuth } from '../context/AuthContext';
import { RichTextToolbar } from '../components/RichTextToolbar';
import { SendLaterModal } from '../components/SendLaterModal';
import { UploadLeadsModal } from '../components/UploadLeadsModal';
import type { EmailAttachment } from '../types/email';

export const ComposeView: React.FC = () => {
  const { setIsComposing, scheduleEmail } = useEmail();
  const { user } = useAuth();

  const [toInput, setToInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [delayBetweenEmails, setDelayBetweenEmails] = useState<number | string>('00');
  const [hourlyLimit, setHourlyLimit] = useState<number | string>('00');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [showSendLater, setShowSendLater] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<EmailAttachment[]>([]);

  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handle email leads imported from UploadLeadsModal
  const handleLeadsImport = (importedEmails: string[]) => {
    setRecipients((prev) => Array.from(new Set([...prev, ...importedEmails])));
    showToast(`Successfully imported ${importedEmails.length} email leads!`);
  };

  // Add individual email from text input on Enter or comma
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = toInput.trim().replace(',', '');
      if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
        if (!recipients.includes(val)) {
          setRecipients([...recipients, val]);
        }
        setToInput('');
      }
    }
  };

  const removeRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  // Handle rich text formatting
  const handleFormat = (command: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = body.substring(start, end);

    let replacement = '';
    switch (command) {
      case 'bold':
        replacement = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selectedText || 'italic text'}*`;
        break;
      case 'underline':
        replacement = `<u>${selectedText || 'underlined text'}</u>`;
        break;
      case 'quote':
        replacement = `\n> ${selectedText || 'quoted text'}\n`;
        break;
      case 'list-bullet':
        replacement = `\n- ${selectedText || 'list item'}\n`;
        break;
      case 'list-number':
        replacement = `\n1. ${selectedText || 'list item'}\n`;
        break;
      case 'heading':
        replacement = `\n### ${selectedText || 'Heading'}\n`;
        break;
      case 'strikethrough':
        replacement = `~~${selectedText || 'strikethrough text'}~~`;
        break;
      case 'undo':
      case 'redo':
      default:
        textarea.focus();
        return;
    }

    const newBody = body.substring(0, start) + replacement + body.substring(end);
    setBody(newBody);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const handleSend = async () => {
    const finalRecipients =
      recipients.length > 0
        ? recipients
        : toInput.trim()
        ? [toInput.trim()]
        : [];

    if (finalRecipients.length === 0) {
      alert('Please add at least one recipient email.');
      return;
    }

    await scheduleEmail({
      from: user?.email || 'oliver.brown@domain.io',
      recipients: finalRecipients,
      subject: subject || '(No Subject)',
      body:
        body ||
        'Hello,\n\nThis is a scheduled message dispatched via the ReachInbox Scheduler service.',
      delayBetweenEmails: Number(delayBetweenEmails) || 0,
      hourlyLimit: Number(hourlyLimit) || 0,
      scheduledAt: scheduledTime || undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    setIsComposing(false);
  };

  // Render visible recipient chips
  const visibleRecipients = recipients.slice(0, 3);
  const overflowCount = recipients.length - 3;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#00A35C] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top-2 duration-200">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header matching Figma */}
      <div className="h-16 px-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0 relative">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsComposing(false)}
            className="p-1 text-gray-700 hover:text-black rounded transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Compose New Email</h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Attachment Icon */}
          <div className="relative">
            <button
              onClick={() => attachmentInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-emerald-700 hover:bg-gray-100 rounded-full flex items-center gap-1 cursor-pointer transition-colors"
              title="Add attachment"
            >
              <Paperclip className="w-4 h-4" />
              {attachments.length > 0 && (
                <span className="text-xs font-semibold text-emerald-700">
                  {attachments.length}
                </span>
              )}
            </button>
            <input
              type="file"
              ref={attachmentInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setAttachments((prev) => [
                    ...prev,
                    {
                      id: `att-${Date.now()}`,
                      name: file.name,
                      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                      url: URL.createObjectURL(file),
                      type: file.type.startsWith('image') ? 'image' : 'file',
                    },
                  ]);
                  showToast(`Attached ${file.name}`);
                }
              }}
              className="hidden"
            />
          </div>

          {/* Schedule Clock Button (Opens Send Later options) */}
          <button
            onClick={() => setShowSendLater((prev) => !prev)}
            className={`p-2 rounded-full transition-colors cursor-pointer ${
              showSendLater || scheduledTime
                ? 'text-[#00A35C] bg-[#E8F8F0]'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Send Later options"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Active Schedule Tag if chosen */}
          {scheduledTime && (
            <div className="hidden sm:flex items-center gap-1.5 bg-[#FEF0E6] text-[#D9531E] px-3 py-1 rounded-full text-xs font-medium border border-[#FED7C2]">
              <span>🕒 {scheduledTime}</span>
              <button
                type="button"
                onClick={() => setScheduledTime('')}
                className="hover:text-red-600 transition-colors ml-1 cursor-pointer"
                title="Remove schedule (send immediately)"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Primary Action Button (Send or Send Later) */}
          <button
            onClick={handleSend}
            className="px-6 py-1.5 border border-[#00A35C] text-[#00A35C] hover:bg-[#E8F8F0] active:scale-[0.98] font-medium text-sm rounded-full transition-all cursor-pointer"
          >
            {scheduledTime ? 'Send Later' : 'Send'}
          </button>

          {/* Send Later Popover Modal matching Figma */}
          <SendLaterModal
            isOpen={showSendLater}
            onClose={() => setShowSendLater(false)}
            onSelectSchedule={(time) => {
              setScheduledTime(time);
              setShowSendLater(false);
              showToast(`Scheduled for ${time}`);
            }}
            currentSchedule={scheduledTime}
          />
        </div>
      </div>

      {/* Form Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 max-w-4xl w-full">
        {/* From Field */}
        <div className="flex items-center py-2.5 border-b border-gray-100">
          <span className="w-20 text-sm text-gray-500 font-medium">From</span>
          <div className="bg-[#F1F3F5] px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 flex items-center gap-2 cursor-pointer hover:bg-gray-200/80 transition-colors">
            <span>{user?.email || 'oliver.brown@domain.io'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </div>
        </div>

        {/* To Field with CSV upload and tags */}
        <div className="flex items-center py-2.5 border-b border-gray-100">
          <span className="w-20 text-sm text-gray-500 font-medium shrink-0">To</span>
          <div className="flex-1 flex flex-wrap items-center gap-2">
            {visibleRecipients.map((rec) => (
              <span
                key={rec}
                className="bg-[#E8F8F0] text-[#008A4D] px-3 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 border border-[#BDEBD3]"
              >
                {rec}
                <button
                  type="button"
                  onClick={() => removeRecipient(rec)}
                  className="hover:text-red-600 transition-colors ml-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {overflowCount > 0 && (
              <span className="bg-[#E8F8F0] text-[#008A4D] px-2.5 py-0.5 rounded-full text-xs font-semibold border border-[#BDEBD3]">
                +{overflowCount}
              </span>
            )}
            <input
              type="text"
              value={toInput}
              onChange={(e) => setToInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={recipients.length === 0 ? 'recipient@example.com' : 'Add email...'}
              className="text-sm text-gray-800 placeholder-gray-400 focus:outline-none flex-1 min-w-[160px] py-0.5"
            />
          </div>

          {/* Upload List Button */}
          <div className="shrink-0 ml-3">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="text-[#00A35C] hover:text-[#008A4D] text-xs font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload List</span>
            </button>
          </div>
        </div>

        {/* Subject Field */}
        <div className="flex items-center py-2.5 border-b border-gray-100">
          <span className="w-20 text-sm text-gray-500 font-medium">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="flex-1 text-sm text-gray-800 placeholder-gray-400 focus:outline-none py-0.5"
          />
        </div>

        {/* Throttling / Rate Limits matching Figma */}
        <div className="flex items-center gap-8 py-3 border-b border-gray-100 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">Delay between 2 emails</span>
            <input
              type="text"
              value={delayBetweenEmails}
              onChange={(e) => setDelayBetweenEmails(e.target.value)}
              className="w-14 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center text-xs text-gray-800 focus:outline-none focus:border-[#00A35C]"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-600 font-medium">Hourly Limit</span>
            <input
              type="text"
              value={hourlyLimit}
              onChange={(e) => setHourlyLimit(e.target.value)}
              className="w-14 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center text-xs text-gray-800 focus:outline-none focus:border-[#00A35C]"
            />
          </div>
        </div>

        {/* Editor Container matching Figma media_1789115864882.png */}
        <div
          onClick={() => textareaRef.current?.focus()}
          className="mt-4 rounded-2xl bg-[#F8F9FA] p-5 min-h-[360px] flex flex-col cursor-text border border-transparent hover:border-gray-200 focus-within:border-gray-300 transition-all"
        >
          {/* Floating White Formatting Toolbar */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl border border-gray-200/80 shadow-xs mb-3 self-start cursor-default"
          >
            <RichTextToolbar onFormat={handleFormat} />
          </div>

          {/* Text Area with Prompt / Reply text */}
          <textarea
            ref={textareaRef}
            rows={12}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type Your Reply..."
            className="w-full flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none resize-none leading-relaxed font-sans"
          />

          {/* Attached Previews if added */}
          {attachments.length > 0 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="pt-3 border-t border-gray-200/50 flex flex-wrap gap-3 cursor-default"
            >
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative group w-44 rounded-lg overflow-hidden border border-gray-200 bg-white shadow-xs"
                >
                  <img src={att.url} alt={att.name} className="w-full h-24 object-cover" />
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-800 truncate">{att.name}</p>
                    <p className="text-[10px] text-gray-400">{att.size}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((a) => a.id !== att.id))}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upload Leads Modal */}
      <UploadLeadsModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onImport={handleLeadsImport}
        currentCount={recipients.length}
      />
    </div>
  );
};
