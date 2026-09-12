import React from 'react';
import {
  Undo2,
  Redo2,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  ChevronsUpDown,
  ListOrdered,
  List,
  Indent,
  Outdent,
  Quote,
  Bookmark,
  Strikethrough,
} from 'lucide-react';

interface RichTextToolbarProps {
  onFormat?: (command: string) => void;
}

export const RichTextToolbar: React.FC<RichTextToolbarProps> = ({ onFormat }) => {
  const trigger = (cmd: string) => {
    if (onFormat) onFormat(cmd);
  };

  return (
    <div className="flex items-center gap-1.5 px-4 py-2 text-gray-500 bg-white select-none overflow-x-auto rounded-xl">
      {/* Undo / Redo */}
      <button
        type="button"
        onClick={() => trigger('undo')}
        title="Undo"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('redo')}
        title="Redo"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Typography */}
      <button
        type="button"
        onClick={() => trigger('heading')}
        title="Font style"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors flex items-center cursor-pointer"
      >
        <Type className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Bold, Italic, Underline */}
      <button
        type="button"
        onClick={() => trigger('bold')}
        title="Bold"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded font-bold transition-colors cursor-pointer"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('italic')}
        title="Italic"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded italic transition-colors cursor-pointer"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('underline')}
        title="Underline"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded underline transition-colors cursor-pointer"
      >
        <Underline className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Alignment */}
      <button
        type="button"
        onClick={() => trigger('align')}
        title="Align"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('lineheight')}
        title="Line Height"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <ChevronsUpDown className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-gray-200 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={() => trigger('list-number')}
        title="Numbered List"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('list-bullet')}
        title="Bullet List"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('outdent')}
        title="Decrease Indent"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <Outdent className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('indent')}
        title="Increase Indent"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <Indent className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('quote')}
        title="Quote"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <Quote className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('link')}
        title="Bookmark / Link"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <Bookmark className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => trigger('strikethrough')}
        title="Strikethrough"
        className="p-1 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors cursor-pointer"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
    </div>
  );
};
