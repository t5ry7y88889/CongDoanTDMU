import React, { useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Heading,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Subscript,
  Superscript,
  BlockQuote,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  Image,
  ImageToolbar,
  ImageCaption,
  ImageStyle,
  ImageResize,
  Link,
  LinkImage,
  List,
  Alignment,
  PasteFromOffice,
  Undo,
  FontFamily,
  FontSize,
  FontColor,
  FontBackgroundColor,
  Highlight,
  HorizontalLine
} from 'ckeditor5';

import 'ckeditor5/ckeditor5.css';

/**
 * CKArticleEditor - Component soạn thảo báo chí chuyên nghiệp TDMU
 * Đóng gói toàn bộ Document Model Engine của CKEditor 5
 */
const CKArticleEditor = forwardRef(({
  value = '',
  onChange,
  onSelectionChange,
  onBlur,
  onFocus,
  placeholder = 'Nội dung bài báo viết văn xuôi chính luận, không gạch đầu dòng...',
  disabled = false
}, ref) => {
  const editorInstanceRef = useRef(null);

  // Expose các API phẫu thuật Document ra bên ngoài cho AI & Controller
  useImperativeHandle(ref, () => ({
    // Getter/Setter innerHTML tương thích 100% với code cũ
    get innerHTML() {
      return editorInstanceRef.current ? editorInstanceRef.current.getData() : '';
    },
    set innerHTML(val) {
      if (editorInstanceRef.current) {
        // Chỉ cập nhật nếu dữ liệu thực sự khác để tránh reset con trỏ
        if (editorInstanceRef.current.getData() !== (val || '')) {
          editorInstanceRef.current.setData(val || '');
        }
      }
    },
    // Getter innerText lấy văn bản thuần sạch
    get innerText() {
      if (!editorInstanceRef.current) return '';
      const data = editorInstanceRef.current.getData();
      const div = document.createElement('div');
      div.innerHTML = data;
      return div.innerText || div.textContent || '';
    },
    // Kiểm tra selection có nằm trong editor
    contains: (node) => {
      if (!editorInstanceRef.current || !node) return false;
      return editorInstanceRef.current.ui?.view?.element?.contains(node) || false;
    },
    // Lấy nội dung HTML chuẩn
    getData: () => {
      return editorInstanceRef.current ? editorInstanceRef.current.getData() : '';
    },
    // Ghi đè toàn bộ nội dung
    setData: (html) => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.setData(html || '');
      }
    },
    // Chèn ảnh vào vị trí con trỏ hoặc cuối bài kèm chú thích chuẩn CKEditor 5
    insertPhoto: (url, caption = '') => {
      if (!editorInstanceRef.current) return;
      const editor = editorInstanceRef.current;
      
      const cleanCap = (caption || 'Hình ảnh sự kiện Công đoàn TDMU').trim();
      try {
        editor.model.change(writer => {
          const imageElement = writer.createElement('imageBlock', {
            src: url,
            alt: cleanCap
          });
          if (cleanCap) {
            const captionElement = writer.createElement('caption');
            writer.insertText(cleanCap, captionElement);
            writer.append(captionElement, imageElement);
          }
          editor.model.insertObject(imageElement, null, null, { setSelection: 'after' });
        });
      } catch (err) {
        // Fallback through view/model fragment conversion
        try {
          const viewFragment = editor.data.processor.toView(
            `<figure class="image"><img src="${url}" alt="${cleanCap}"><figcaption>${cleanCap}</figcaption></figure>`
          );
          const modelFragment = editor.data.toModel(viewFragment);
          editor.model.insertContent(modelFragment);
        } catch (e2) {
          editor.execute('insertImage', { source: url, alt: cleanCap });
        }
      }
    },
    // Thay thế đoạn bôi đen hoặc toàn bộ
    replaceSelection: (newText) => {
      if (!editorInstanceRef.current) return;
      const editor = editorInstanceRef.current;
      editor.model.change(writer => {
        const selection = editor.model.document.selection;
        if (!selection.isCollapsed) {
          const range = selection.getFirstRange();
          writer.remove(range);
          writer.insertText(newText, range.start);
        }
      });
    },
    // Lấy text đang được bôi đen
    getSelectedText: () => {
      if (!editorInstanceRef.current) return '';
      const selection = editorInstanceRef.current.model.document.selection;
      if (selection.isCollapsed) return '';
      const range = selection.getFirstRange();
      let text = '';
      for (const item of range.getItems()) {
        if (item.is('$text') || item.is('$textProxy')) {
          text += item.data;
        }
      }
      return text.trim();
    },
    // Focus vào editor
    focus: () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.focus();
      }
    },
    // Truy cập trực tiếp instance của CKEditor
    getEditor: () => editorInstanceRef.current
  }));

  // Cấu hình Toolbar & Plugins chuẩn tòa soạn báo chí
  const editorConfig = {
    licenseKey: 'GPL', // Sử dụng mã nguồn mở GPL v2+
    placeholder: placeholder,
    toolbar: {
      items: [
        'undo', 'redo',
        '|',
        'heading',
        '|',
        'fontFamily', 'fontSize',
        '|',
        'fontColor', 'fontBackgroundColor', 'highlight',
        '|',
        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript',
        '|',
        'alignment',
        '|',
        'bulletedList', 'numberedList',
        '|',
        'blockQuote', 'insertTable', 'horizontalLine',
        '|',
        'link'
      ],
      shouldNotGroupWhenFull: true
    },
    plugins: [
      Essentials,
      Paragraph,
      Heading,
      Bold,
      Italic,
      Underline,
      Strikethrough,
      Subscript,
      Superscript,
      BlockQuote,
      Table,
      TableToolbar,
      TableProperties,
      TableCellProperties,
      Image,
      ImageToolbar,
      ImageCaption,
      ImageStyle,
      ImageResize,
      Link,
      LinkImage,
      List,
      Alignment,
      PasteFromOffice,
      Undo,
      FontFamily,
      FontSize,
      FontColor,
      FontBackgroundColor,
      Highlight,
      HorizontalLine
    ],
    heading: {
      options: [
        { model: 'paragraph', title: 'Đoạn văn', class: 'ck-heading_paragraph' },
        { model: 'heading1', view: 'h1', title: 'Tiêu đề chính (H1)', class: 'ck-heading_heading1' },
        { model: 'heading2', view: 'h2', title: 'Tiêu đề mục (H2)', class: 'ck-heading_heading2' },
        { model: 'heading3', view: 'h3', title: 'Tiêu đề phụ (H3)', class: 'ck-heading_heading3' },
        { model: 'heading4', view: 'h4', title: 'Tiểu mục (H4)', class: 'ck-heading_heading4' }
      ]
    },
    fontFamily: {
      options: [
        'default',
        'Times New Roman, Times, serif',
        'Arial, Helvetica, sans-serif',
        'Roboto, sans-serif',
        'Inter, sans-serif',
        'Georgia, serif',
        'Merriweather, serif'
      ],
      supportAllValues: true
    },
    fontSize: {
      options: [
        12, 13, 14, 'default', 18, 20, 24, 28, 32
      ],
      supportAllValues: true
    },
    fontColor: {
      columns: 4,
      colors: [
        { color: '#002855', label: 'Xanh TDMU' },
        { color: '#0284C7', label: 'Xanh Lam' },
        { color: '#16A34A', label: 'Xanh Lá' },
        { color: '#DC2626', label: 'Đỏ Đậm' },
        { color: '#EA580C', label: 'Cam' },
        { color: '#7C3AED', label: 'Tím' },
        { color: '#0F172A', label: 'Đen Đậm' },
        { color: '#64748B', label: 'Xám Ghi' }
      ]
    },
    fontBackgroundColor: {
      columns: 4,
      colors: [
        { color: '#FEF08A', label: 'Vàng Nhạt' },
        { color: '#BAE6FD', label: 'Lam Nhạt' },
        { color: '#BBF7D0', label: 'Lá Nhạt' },
        { color: '#FECDD3', label: 'Hồng Nhạt' },
        { color: '#E9D5FF', label: 'Tím Nhạt' },
        { color: '#F1F5F9', label: 'Xám Nhạt' }
      ]
    },
    highlight: {
      options: [
        { model: 'yellowMarker', class: 'marker-yellow', title: 'Bút dạ vàng', color: '#FEF08A', type: 'marker' },
        { model: 'greenMarker', class: 'marker-green', title: 'Bút dạ xanh lá', color: '#BBF7D0', type: 'marker' },
        { model: 'pinkMarker', class: 'marker-pink', title: 'Bút dạ hồng', color: '#FECDD3', type: 'marker' },
        { model: 'blueMarker', class: 'marker-blue', title: 'Bút dạ xanh biển', color: '#BAE6FD', type: 'marker' }
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn', 'tableRow', 'mergeTableCells',
        'tableProperties', 'tableCellProperties'
      ]
    },
    image: {
      toolbar: [
        'imageStyle:inline', 'imageStyle:block', 'imageStyle:side',
        '|',
        'toggleImageCaption', 'imageTextAlternative',
        '|',
        'linkImage'
      ]
    }
  };

  const handleReady = useCallback((editor) => {
    editorInstanceRef.current = editor;
    if (value && editor.getData() !== value) {
      editor.setData(value);
    }
    // Lắng nghe sự kiện bôi đen (selection) trên Document Model
    editor.model.document.selection.on('change:range', () => {
      if (!onSelectionChange) return;
      const selection = editor.model.document.selection;
      if (selection.isCollapsed) {
        onSelectionChange('');
        return;
      }
      const range = selection.getFirstRange();
      let text = '';
      for (const item of range.getItems()) {
        if (item.is('$text') || item.is('$textProxy')) {
          text += item.data;
        }
      }
      onSelectionChange(text.trim());
    });
  }, [value, onSelectionChange]);

  // Đồng bộ thông minh khi value từ cha thay đổi (VD: nạp bản thảo mới, AI stream)
  // Chỉ cập nhật nếu dữ liệu thực sự khác editor.getData() để không làm giật con trỏ khi đang gõ
  React.useEffect(() => {
    if (editorInstanceRef.current && value !== undefined) {
      if (editorInstanceRef.current.getData() !== value) {
        editorInstanceRef.current.setData(value || '');
      }
    }
  }, [value]);

  const handleChange = useCallback((event, editor) => {
    if (onChange) {
      const data = editor.getData();
      onChange(data);
    }
  }, [onChange]);

  return (
    <div className="ckeditor-tdmu-wrapper" style={{ width: '100%', minHeight: '420px', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        /* Tối ưu typography chuẩn báo chí TDMU */
        .ckeditor-tdmu-wrapper .ck-editor {
          display: flex;
          flex-direction: column;
          flex: 1;
          width: 100%;
          border: 1px solid #E2E8F0 !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          background: #FFFFFF !important;
        }
        .ckeditor-tdmu-wrapper .ck-editor__top {
          position: static !important;
        }
        .ckeditor-tdmu-wrapper .ck-toolbar {
          background: #F8FAFC !important;
          border: none !important;
          border-bottom: 1px solid #E2E8F0 !important;
          border-radius: 8px 8px 0 0 !important;
          padding: 6px 10px !important;
        }
        .ckeditor-tdmu-wrapper .ck-editor__main {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        .ckeditor-tdmu-wrapper .ck-content {
          min-height: 400px !important;
          padding: 20px 24px !important;
          font-family: inherit !important;
          font-size: 15.5px !important;
          line-height: 1.85 !important;
          color: #0F172A !important;
          border: 1px solid #E2E8F0 !important;
          border-top: none !important;
          border-radius: 0 0 6px 6px !important;
          background: #FFFFFF !important;
          box-shadow: none !important;
          text-align: justify;
        }
        .ckeditor-tdmu-wrapper .ck-content:focus {
          border-color: #93C5FD !important;
          outline: none !important;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.08) !important;
        }
        .ckeditor-tdmu-wrapper .ck-content h1,
        .ckeditor-tdmu-wrapper .ck-content h1.article-title {
          font-size: 24px !important;
          font-weight: 800 !important;
          color: #002855 !important;
          margin-top: 8px !important;
          margin-bottom: 16px !important;
          line-height: 1.35 !important;
        }
        .ckeditor-tdmu-wrapper .ck-content p.sapo,
        .ckeditor-tdmu-wrapper .ck-content .article-lead {
          font-size: 15px !important;
          line-height: 1.7 !important;
          color: #1E293B !important;
          background: #F8FAFC !important;
          border-left: 4px solid #2563EB !important;
          padding: 12px 16px !important;
          border-radius: 4px 8px 8px 4px !important;
          margin-bottom: 20px !important;
        }
        .ckeditor-tdmu-wrapper .ck-content h2 {
          font-size: 20px !important;
          font-weight: 800 !important;
          color: #002855 !important;
          margin-top: 24px !important;
          margin-bottom: 12px !important;
          line-height: 1.4 !important;
        }
        .ckeditor-tdmu-wrapper .ck-content h3 {
          font-size: 17px !important;
          font-weight: 700 !important;
          color: #0369A1 !important;
          margin-top: 18px !important;
          margin-bottom: 10px !important;
        }
        .ckeditor-tdmu-wrapper .ck-content p {
          margin-bottom: 16px !important;
          text-align: justify !important;
        }
        .ckeditor-tdmu-wrapper .ck-content blockquote {
          border-left: 4px solid #2563EB !important;
          background: #F0F7FF !important;
          padding: 12px 18px !important;
          border-radius: 0 8px 8px 0 !important;
          font-style: italic !important;
          color: #1E3A8A !important;
          margin: 20px 0 !important;
        }
        .ckeditor-tdmu-wrapper .ck-content figure.image {
          margin: 24px auto !important;
          text-align: center !important;
        }
        .ckeditor-tdmu-wrapper .ck-content figure.image img {
          border-radius: 8px !important;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08) !important;
          max-width: 100% !important;
        }
        .ckeditor-tdmu-wrapper .ck-content figure.image figcaption {
          font-size: 13px !important;
          font-style: italic !important;
          color: #64748B !important;
          margin-top: 8px !important;
          text-align: center !important;
        }
        .ckeditor-tdmu-wrapper .ck-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 20px 0 !important;
        }
        .ckeditor-tdmu-wrapper .ck-content table td,
        .ckeditor-tdmu-wrapper .ck-content table th {
          border: 1px solid #CBD5E1 !important;
          padding: 8px 12px !important;
        }
        .ckeditor-tdmu-wrapper .ck-content table th {
          background: #002855 !important;
          color: #FFFFFF !important;
          font-weight: 700 !important;
        }
      `}</style>
      <CKEditor
        editor={ClassicEditor}
        config={editorConfig}
        data={value}
        onReady={handleReady}
        onChange={handleChange}
        onBlur={onBlur}
        onFocus={onFocus}
        disabled={disabled}
      />
    </div>
  );
});

export default CKArticleEditor;
