'use client';

import React, { useState, useCallback } from 'react';
import ImageUploadModal from './ImageUploadModal';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onContentChange: (content: string) => void;
}

export default function MarkdownToolbar({ textareaRef, onContentChange }: MarkdownToolbarProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);

  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    const beforeText = text.substring(0, start);
    const afterText = text.substring(end);

    const newText = `${beforeText}${before}${selectedText}${after}${afterText}`;
    
    // Cập nhật state trong component cha
    onContentChange(newText);

    // Reset cursor position
    textarea.focus();
    const newCursorPos = selectedText ? start + before.length + selectedText.length + after.length : start + before.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
  }, [textareaRef, onContentChange]);

  const handleImageUploaded = useCallback((imageUrl: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Lấy vị trí con trỏ hiện tại
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    // Tạo text mới với ảnh được chèn vào vị trí con trỏ
    const beforeText = text.substring(0, cursorPos);
    const afterText = text.substring(cursorPos);
    const imageMarkdown = `\n![Image](${imageUrl})\n`;
    const newText = beforeText + imageMarkdown + afterText;

    // Cập nhật state trong component cha
    onContentChange(newText);

    // Đóng modal
    setShowImageUpload(false);

    // Di chuyển con trỏ đến sau ảnh vừa chèn
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = cursorPos + imageMarkdown.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [textareaRef, onContentChange]);

  const tools = [
    {
      icon: 'B',
      title: 'Bold',
      action: () => insertText('**', '**'),
    },
    {
      icon: 'I',
      title: 'Italic',
      action: () => insertText('*', '*'),
    },
    {
      icon: '≋',
      title: 'Strikethrough',
      action: () => insertText('~~', '~~'),
    },
    {
      icon: '#',
      title: 'Heading',
      action: () => insertText('### '),
    },
    {
      icon: '•',
      title: 'Bullet List',
      action: () => insertText('- '),
    },
    {
      icon: '1.',
      title: 'Numbered List',
      action: () => insertText('1. '),
    },
    {
      icon: '[]',
      title: 'Checkbox',
      action: () => insertText('- [ ] '),
    },
    {
      icon: '🔗',
      title: 'Link',
      action: () => insertText('[', '](url)'),
    },
    {
      icon: '📷',
      title: 'Upload Image',
      action: () => setShowImageUpload(true),
    },
    {
      icon: '`',
      title: 'Code',
      action: () => insertText('`', '`'),
    },
    {
      icon: '```',
      title: 'Code Block',
      action: () => insertText('```\n', '\n```'),
    },
    {
      icon: '┋',
      title: 'Quote',
      action: () => insertText('> '),
    },
    {
      icon: '━',
      title: 'Horizontal Rule',
      action: () => insertText('\n---\n'),
    },
    {
      icon: '┃',
      title: 'Table',
      action: () => insertText('\n| Header 1 | Header 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |\n'),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap gap-1 p-2 bg-gray-100 rounded-t-md border border-gray-300">
        {tools.map((tool) => (
          <button
            key={tool.title}
            onClick={(e) => {
              e.preventDefault();
              tool.action();
            }}
            title={tool.title}
            className="p-2 hover:bg-gray-200 rounded min-w-[32px] text-center transition-colors"
          >
            {tool.icon}
          </button>
        ))}
      </div>
      {showImageUpload && (
        <ImageUploadModal
          onClose={() => setShowImageUpload(false)}
          onImageUploaded={(url) => handleImageUploaded(url)}
        />
      )}
    </>
  );
} 