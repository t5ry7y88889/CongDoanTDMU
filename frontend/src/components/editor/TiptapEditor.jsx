import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import CharacterCount from '@tiptap/extension-character-count';
import './TiptapEditor.css';

/**
 * TiptapEditor — Trình soạn thảo báo chí chuyên nghiệp TDMU
 * Tích hợp AI Bubble Menu: Bôi đen → Sửa tại chỗ qua Groq Qwen3.8-27B
 *
 * Props:
 *   value         (string)   HTML nội dung ban đầu
 *   onChange      (fn)       Callback khi nội dung thay đổi → (html: string)
 *   onAiInlineEdit (fn)      Callback khi AI sửa tại chỗ → (selectedText, instruction)
 *   disabled      (bool)     Chế độ chỉ đọc
 *   placeholder   (string)
 *   aiLoading     (bool)     Hiển thị spinner trên Bubble Menu khi AI đang xử lý
 *
 * Ref API (useImperativeHandle):
 *   getHTML()         → string HTML hiện tại
 *   setHTML(html)     → Set nội dung mới (dùng khi AI trả về & rollback)
 *   getSelectedText() → string text đang bôi đen
 *   focus()
 */
const TiptapEditor = forwardRef(({
  value = '',
  onChange,
  onAiInlineEdit,
  disabled = false,
  placeholder = 'Nội dung bài báo viết văn xuôi chính luận, không gạch đầu dòng...',
  aiLoading = false,
}, ref) => {

  const [bubblePrompt, setBubblePrompt] = useState('');
  const [showPromptInput, setShowPromptInput] = useState(false);
  const promptInputRef = useRef(null);
  const isSettingContent = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      CharacterCount,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      if (isSettingContent.current) return;
      onChange && onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-content',
        spellcheck: 'true',
      },
    },
  });

  // Sync value từ bên ngoài (khi AI rollback hoặc load bài mới từ DB)
  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    if (value !== currentHTML) {
      isSettingContent.current = true;
      editor.commands.setContent(value || '', false);
      // Dùng setTimeout để tránh vòng lặp update
      setTimeout(() => { isSettingContent.current = false; }, 50);
    }
  }, [value, editor]);

  // Sync editable khi disabled thay đổi
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  // Expose API ra ngoài qua ref
  useImperativeHandle(ref, () => ({
    getHTML: () => editor ? editor.getHTML() : '',
    setHTML: (html) => {
      if (!editor) return;
      isSettingContent.current = true;
      editor.commands.setContent(html || '', false);
      setTimeout(() => { isSettingContent.current = false; }, 50);
    },
    getSelectedText: () => {
      if (!editor) return '';
      const { from, to } = editor.state.selection;
      return editor.state.doc.textBetween(from, to, ' ');
    },
    focus: () => editor && editor.commands.focus(),
    // Thay thế selection hiện tại bằng text mới từ AI
    replaceSelection: (newText) => {
      if (!editor) return;
      const { from, to } = editor.state.selection;
      if (from === to) return; // Không có selection
      editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, newText).run();
    },
    // API tương thích với CKEditor cũ (cho các chỗ còn dùng editorRef.current.getData/setData/innerHTML)
    getData: () => editor ? editor.getHTML() : '',
    setData: (html) => {
      if (!editor) return;
      isSettingContent.current = true;
      editor.commands.setContent(html || '', false);
      setTimeout(() => { isSettingContent.current = false; }, 50);
    },
    get innerHTML() { return editor ? editor.getHTML() : ''; },
    set innerHTML(html) {
      if (!editor) return;
      isSettingContent.current = true;
      editor.commands.setContent(html || '', false);
      setTimeout(() => { isSettingContent.current = false; }, 50);
    },
    // Getter innerText lấy văn bản thuần sạch
    get innerText() {
      if (!editor) return '';
      return editor.getText() || '';
    },
    // Kiểm tra node có nằm trong editor
    contains: (node) => {
      if (!editor || !node) return false;
      return editor.view?.dom?.contains(node) || false;
    },
    // Xóa selection
    clearSelection: () => {
      if (!editor) return;
      editor.commands.setTextSelection(editor.state.selection.to);
    },
    // Chèn ảnh có chú thích
    insertPhoto: (url, caption = '') => {
      if (!editor) return;
      const cleanCap = (caption || 'Hình ảnh sự kiện Công đoàn TDMU').trim();
      const figureHtml = `<p><img src="${url}" alt="${cleanCap}" /></p><p><em>${cleanCap}</em></p>`;
      editor.chain().focus().insertContent(figureHtml).run();
    },
  }), [editor]);

  // Xử lý khi bấm nút lệnh tắt trên Bubble Menu
  const handleQuickAction = useCallback((action) => {
    if (!editor || !onAiInlineEdit) return;
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );
    if (!selectedText.trim()) return;

    const instructions = {
      rewrite:  'Viết lại đoạn văn này tự nhiên, hấp dẫn, giữ nguyên ý nghĩa',
      shorten:  'Rút ngắn đoạn này còn 1-2 câu súc tích, giữ thông tin quan trọng',
      formal:   'Viết lại theo văn phong trang trọng, chuẩn mực báo chí Công đoàn',
      grammar:  'Chỉ sửa lỗi chính tả và ngữ pháp, không thay đổi nội dung',
      expand:   'Mở rộng đoạn này thêm chi tiết, ý nghĩa và bối cảnh sự kiện',
    };

    setShowPromptInput(false);
    setBubblePrompt('');
    onAiInlineEdit(selectedText, instructions[action] || action);
  }, [editor, onAiInlineEdit]);

  // Xử lý khi gửi prompt tự do
  const handleCustomPrompt = useCallback((e) => {
    e.preventDefault();
    if (!editor || !onAiInlineEdit || !bubblePrompt.trim()) return;
    const selectedText = editor.state.doc.textBetween(
      editor.state.selection.from,
      editor.state.selection.to,
      ' '
    );
    if (!selectedText.trim()) return;
    onAiInlineEdit(selectedText, bubblePrompt.trim());
    setBubblePrompt('');
    setShowPromptInput(false);
  }, [editor, onAiInlineEdit, bubblePrompt]);

  // Focus vào input khi show prompt
  useEffect(() => {
    if (showPromptInput && promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, [showPromptInput]);

  if (!editor) return null;

  return (
    <div className="tiptap-wrapper" style={{ position: 'relative' }}>
      {/* ── Bubble Menu (Nổi lên khi bôi đen text) ── */}
      <BubbleMenu
        editor={editor}
        tippyOptions={{
          duration: 150,
          placement: 'top',
          maxWidth: 460,
          zIndex: 9999,
        }}
        shouldShow={({ editor, from, to }) => {
          // Chỉ hiện khi có text được bôi đen (không phải node selection)
          return from !== to && editor.state.selection.content().size > 0;
        }}
      >
        <div className="tiptap-bubble-menu" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '10px',
          padding: '8px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          minWidth: '320px',
        }}>
          {/* Hàng nút lệnh tắt */}
          {!showPromptInput && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {[
                { key: 'rewrite', icon: '✨', label: 'Viết lại' },
                { key: 'shorten', icon: '📏', label: 'Rút gọn' },
                { key: 'formal',  icon: '🎯', label: 'Trang trọng' },
                { key: 'grammar', icon: '✏️', label: 'Chính tả' },
                { key: 'expand',  icon: '📖', label: 'Mở rộng' },
              ].map(({ key, icon, label }) => (
                <button
                  key={key}
                  onClick={() => handleQuickAction(key)}
                  disabled={aiLoading}
                  style={{
                    background: aiLoading ? '#334155' : '#0f172a',
                    border: '1px solid #475569',
                    borderRadius: '6px',
                    color: aiLoading ? '#64748b' : '#e2e8f0',
                    cursor: aiLoading ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    padding: '4px 8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '3px',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { if (!aiLoading) e.target.style.background = '#1e40af'; }}
                  onMouseLeave={e => { if (!aiLoading) e.target.style.background = '#0f172a'; }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}

              {/* Nút gõ lệnh tự do */}
              <button
                onClick={() => setShowPromptInput(true)}
                disabled={aiLoading}
                style={{
                  background: '#1d4ed8',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  fontWeight: 500,
                }}
              >
                <span>💬</span>
                <span>Gõ lệnh...</span>
              </button>
            </div>
          )}

          {/* Input gõ lệnh tự do */}
          {showPromptInput && (
            <form onSubmit={handleCustomPrompt} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowPromptInput(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '16px', padding: '0 2px' }}
              >
                ←
              </button>
              <input
                ref={promptInputRef}
                value={bubblePrompt}
                onChange={e => setBubblePrompt(e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape') { setShowPromptInput(false); setBubblePrompt(''); } }}
                placeholder='Gõ lệnh... VD: "Đổi sang giọng hùng hồn, thêm số liệu"'
                style={{
                  flex: 1,
                  background: '#0f172a',
                  border: '1px solid #3b82f6',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                  padding: '5px 8px',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={!bubblePrompt.trim() || aiLoading}
                style={{
                  background: '#1d4ed8',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '5px 10px',
                  fontWeight: 600,
                  opacity: (!bubblePrompt.trim() || aiLoading) ? 0.5 : 1,
                }}
              >
                {aiLoading ? '⏳' : '↵ Gửi'}
              </button>
            </form>
          )}

          {/* Loading indicator */}
          {aiLoading && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#38bdf8',
              fontSize: '11px',
              padding: '2px 4px',
            }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span>
              <span>Qwen AI đang xử lý...</span>
            </div>
          )}

          {/* Label AI source */}
          <div style={{ color: '#475569', fontSize: '10px', textAlign: 'right', paddingRight: '2px' }}>
            ⚡ Groq · qwen3.8-27B
          </div>
        </div>
      </BubbleMenu>

      {/* ── Thanh Toolbar định dạng cơ bản ── */}
      <div className="tiptap-toolbar" style={{
        display: 'flex',
        gap: '2px',
        padding: '6px 8px',
        background: '#0f172a',
        borderBottom: '1px solid #1e293b',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}>
        {/* Bold, Italic, Strike */}
        {[
          { cmd: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), icon: 'B', title: 'Đậm (Ctrl+B)', style: { fontWeight: 'bold' } },
          { cmd: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), icon: 'I', title: 'Nghiêng (Ctrl+I)', style: { fontStyle: 'italic' } },
          { cmd: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive('strike'), icon: 'S̶', title: 'Gạch ngang', style: { textDecoration: 'line-through' } },
        ].map((btn, i) => (
          <button key={i} onClick={btn.cmd} title={btn.title} style={{ ...toolbarBtnStyle(btn.active), ...btn.style }}>
            {btn.icon}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', background: '#334155', margin: '0 4px' }} />

        {/* Headings */}
        {[1, 2, 3].map(level => (
          <button
            key={level}
            onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
            title={`Tiêu đề H${level}`}
            style={toolbarBtnStyle(editor.isActive('heading', { level }))}
          >
            H{level}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', background: '#334155', margin: '0 4px' }} />

        {/* Lists */}
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} title="Danh sách không thứ tự" style={toolbarBtnStyle(editor.isActive('bulletList'))}>
          •≡
        </button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Danh sách có thứ tự" style={toolbarBtnStyle(editor.isActive('orderedList'))}>
          1≡
        </button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Trích dẫn" style={toolbarBtnStyle(editor.isActive('blockquote'))}>
          "
        </button>

        <div style={{ width: '1px', height: '20px', background: '#334155', margin: '0 4px' }} />

        {/* Align */}
        {[
          { align: 'left', icon: '⬛◻◻' },
          { align: 'center', icon: '◻⬛◻' },
          { align: 'right', icon: '◻◻⬛' },
        ].map(({ align, icon }) => (
          <button
            key={align}
            onClick={() => editor.chain().focus().setTextAlign(align).run()}
            title={`Căn ${align}`}
            style={toolbarBtnStyle(editor.isActive({ textAlign: align }))}
          >
            {align === 'left' ? '≡◻' : align === 'center' ? '◻≡◻' : '◻≡'}
          </button>
        ))}

        <div style={{ width: '1px', height: '20px', background: '#334155', margin: '0 4px' }} />

        {/* Undo/Redo */}
        <button onClick={() => editor.chain().focus().undo().run()} title="Hoàn tác (Ctrl+Z)" disabled={!editor.can().undo()} style={toolbarBtnStyle(false, !editor.can().undo())}>↩</button>
        <button onClick={() => editor.chain().focus().redo().run()} title="Làm lại (Ctrl+Y)" disabled={!editor.can().redo()} style={toolbarBtnStyle(false, !editor.can().redo())}>↪</button>

        {/* Word count */}
        <div style={{ marginLeft: 'auto', color: '#475569', fontSize: '11px', padding: '0 8px' }}>
          {editor.storage.characterCount
            ? `${editor.getText().split(/\s+/).filter(Boolean).length} từ`
            : ''}
        </div>
      </div>

      {/* ── Editor Content Area ── */}
      <EditorContent
        editor={editor}
        style={{
          minHeight: '420px',
          maxHeight: '65vh',
          overflowY: 'auto',
        }}
      />
    </div>
  );
});

TiptapEditor.displayName = 'TiptapEditor';

// Helper style cho toolbar buttons
function toolbarBtnStyle(isActive, isDisabled = false) {
  return {
    background: isActive ? '#1d4ed8' : 'transparent',
    border: `1px solid ${isActive ? '#3b82f6' : '#334155'}`,
    borderRadius: '4px',
    color: isDisabled ? '#334155' : (isActive ? '#fff' : '#94a3b8'),
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    fontSize: '12px',
    fontFamily: 'monospace',
    padding: '3px 7px',
    minWidth: '28px',
    textAlign: 'center',
    opacity: isDisabled ? 0.4 : 1,
    transition: 'all 0.1s',
  };
}

export default TiptapEditor;
