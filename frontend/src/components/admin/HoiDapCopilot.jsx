import React, { useRef, useEffect } from 'react';

export default function CopilotChat({
  chatMessages,
  rollbackNotification,
  attachedFiles,
  eventPhotos,
  activeChannel,
  clearAllAttachments,
  removeAttachedFile,
  updatePhotoCaption,
  insertPhoto,
  triggerAiVision,
  setFeaturedPhoto,
  removePhoto,
  acceptDiff,
  setChatMessages,
  setActiveDiff,
  editingMsgId,
  editPromptText,
  setEditPromptText,
  cancelEditUserPrompt,
  submitEditUserPrompt,
  navigateUserPromptVersion,
  startEditUserPrompt,
  rollbackToTurn,
  regenerateTurn,
  selectedText,
  clearSelection,
  aiInlineLoading,
  handleAiInlineEdit,
  generateFbWithAi,
  insertArticleLinkToChannel,
  insertDocLinksToChannel,
  insertPhotoLinksToChannel,
  generateZaloWithAi,
  runAi,
  aiPrompt,
  setAiPrompt,
  aiLoading,
  autopilotPrompt,
  setAutopilotPrompt,
  autopilotLoading,
  handleAutopilotStream,
  processFiles
}) {
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, aiLoading]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Quick Action Command Bar */}
      <div style={{ padding: '8px 10px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            onClick={() => document.getElementById('dossier-file-input')?.click()}
            style={{ flex: 1, background: '#EFF6FF', color: '#1D4ED8', border: '1.5px solid #93C5FD', borderRadius: '6px', padding: '6px 8px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
            title="Nạp tài liệu Word, Excel, PDF hoặc ảnh sự kiện"
          >
            <i className="fa-solid fa-cloud-arrow-up" /> 📁 Nạp tài liệu &amp; ảnh sự kiện
          </button>
        </div>

        {/* Định hướng bài viết tùy chọn cho Autopilot */}
        <div>
          <textarea
            value={autopilotPrompt}
            onChange={e => setAutopilotPrompt(e.target.value)}
            placeholder="Tùy chọn định hướng cho AI (ví dụ: 'Tập trung vào giải bóng đá nam', 'Nhấn mạnh công tác chăm lo')..."
            rows={2}
            spellCheck={false}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: '1.5px solid #CBD5E1',
              borderRadius: '6px',
              padding: '6px 8px',
              fontSize: '11.5px',
              lineHeight: '1.45',
              outline: 'none',
              resize: 'none',
              background: '#FFFFFF',
              fontFamily: 'inherit'
            }}
          />
        </div>

        {/* NÚT VIẾT TỰ ĐỘNG */}
        <button
          type="button"
          onClick={handleAutopilotStream}
          disabled={autopilotLoading}
          style={{
            width: '100%',
            background: autopilotLoading ? '#94A3B8' : 'linear-gradient(135deg, #002855, #0284C7)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '6px',
            padding: '10px 12px',
            fontSize: '12.5px',
            fontWeight: '900',
            cursor: autopilotLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 3px 8px rgba(0,40,85,0.25)'
          }}
        >
          {autopilotLoading ? (
            <><i className="fa-solid fa-spinner fa-spin" /> Đang tổng hợp &amp; viết bài...</>
          ) : (
            <><i className="fa-solid fa-wand-magic-sparkles text-warning" /> ⚡ TỰ ĐỘNG TỔNG HỢP &amp; VIẾT TOÀN BÀI</>
          )}
        </button>
      </div>

      {/* Chat messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {rollbackNotification && (
          <div style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', textAlign: 'center', boxShadow: '0 2px 6px rgba(37,99,235,0.08)' }}>
            {rollbackNotification}
          </div>
        )}

        {(chatMessages || []).map(msg => {
          // Progress Card
          if (msg.type === 'progress') {
            return (
              <div key={msg.id} style={{ background: '#0F172A', color: 'white', borderRadius: '8px', padding: '10px 12px', fontSize: '11px', lineHeight: '1.6', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#38BDF8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <i className="fa-solid fa-wand-magic-sparkles" />
                  <span>{msg.title || 'Tiến độ xử lý AI'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {(msg.steps || []).map((st, si) => (
                    <div key={si} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      {st.status === 'running' ? (
                        <i className="fa-solid fa-circle-notch fa-spin" style={{ color: '#38BDF8', fontSize: '10px' }} />
                      ) : st.status === 'done' ? (
                        <i className="fa-solid fa-circle-check" style={{ color: '#34D399', fontSize: '10px' }} />
                      ) : (
                        <i className="fa-solid fa-circle-xmark" style={{ color: '#F87171', fontSize: '10px' }} />
                      )}
                      <span style={{ color: st.status === 'running' ? '#38BDF8' : st.status === 'done' ? '#E2E8F0' : '#F87171' }}>
                        {st.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Diff Card
          if (msg.type === 'diff') {
            return (
              <div key={msg.id} style={{ background: '#FFF', border: '1.5px solid #38BDF8', borderRadius: '8px', padding: '10px 12px', boxShadow: '0 4px 12px rgba(56,189,248,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: '800', color: '#0369A1', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <i className="fa-solid fa-code-compare" />
                    <span>So sánh thay đổi ({msg.isSelection ? 'Đoạn bôi đen' : 'Toàn bài'})</span>
                  </div>
                </div>
                <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '11.5px', lineHeight: '1.6', maxHeight: '160px', overflowY: 'auto', marginBottom: '8px' }}>
                  {(msg.diffParts || []).map((part, pi) => {
                    if (part.added) return <ins key={pi} style={{ background: '#DCFCE7', color: '#15803D', textDecoration: 'none', fontWeight: '600', padding: '1px 2px', borderRadius: '2px' }}>{part.value}</ins>;
                    if (part.removed) return <del key={pi} style={{ background: '#FEE2E2', color: '#B91C1C', padding: '1px 2px', borderRadius: '2px' }}>{part.value}</del>;
                    return <span key={pi}>{part.value}</span>;
                  })}
                </div>
                {msg.isAccepted ? (
                  <div style={{ background: '#DCFCE7', color: '#15803D', padding: '6px 10px', borderRadius: '5px', fontSize: '11px', fontWeight: '700' }}>
                    ✓ Đã áp dụng vào bài viết
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => acceptDiff(msg)} style={{ flex: 1, background: '#16A34A', color: 'white', border: 'none', borderRadius: '5px', padding: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>✓ Chấp nhận áp dụng</button>
                    <button type="button" onClick={() => { setChatMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isDiscarded: true } : m)); setActiveDiff(null); }} style={{ background: '#FFF', color: '#64748B', border: '1px solid #CBD5E1', borderRadius: '5px', padding: '6px 10px', fontSize: '11px', cursor: 'pointer' }}>✕ Bỏ qua</button>
                  </div>
                )}
              </div>
            );
          }

          // User message
          if (msg.sender === 'user') {
            return (
              <div key={msg.id} style={{ alignSelf: 'flex-end', maxWidth: '92%', background: '#002855', color: '#FFF', padding: '9px 12px', borderRadius: '12px 12px 2px 12px', fontSize: '11.5px', lineHeight: '1.5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                <div style={{ fontSize: '9.5px', color: '#93C5FD', textAlign: 'right', marginTop: '4px' }}>{msg.ts}</div>
              </div>
            );
          }

          // AI Assistant Message
          return (
            <div key={msg.id} style={{ alignSelf: 'flex-start', maxWidth: '92%', background: '#F1F5F9', color: '#0F172A', padding: '9px 12px', borderRadius: '12px 12px 12px 2px', fontSize: '11.5px', lineHeight: '1.5', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '10.5px', fontWeight: '800', color: '#0284C7', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="fa-solid fa-robot" /> Trợ Lý AI
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
              <div style={{ fontSize: '9.5px', color: '#64748B', textAlign: 'right', marginTop: '4px' }}>{msg.ts}</div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      {/* Selection Context & Prompt Input Area */}
      <div style={{ borderTop: '1px solid #E2E8F0', background: '#FAFAFA', flexShrink: 0 }}>
        {selectedText ? (
          <div style={{ padding: '10px 12px', background: '#F0F9FF', borderBottom: '1px solid #BFDBFE' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ background: '#2563EB', color: 'white', fontWeight: '800', padding: '2px 6px', borderRadius: '4px', fontSize: '9.5px' }}>⚡ GROQ QWEN</span>
                <span style={{ fontSize: '11px', fontWeight: '700', color: '#0369A1' }}>Biên tập nhanh đoạn chọn</span>
              </div>
              <button
                type="button"
                onClick={clearSelection}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                title="Bỏ chọn"
              >✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {[
                { label: '✨ Sửa tự nhiên', prompt: 'Viết lại đoạn văn này tự nhiên, hấp dẫn, giữ nguyên ý nghĩa cốt lõi' },
                { label: '✂️ Rút gọn súc tích', prompt: 'Rút ngắn đoạn này còn 1-2 câu thật súc tích, giữ các số liệu và thông tin quan trọng' },
                { label: '🏛️ Chuẩn trang trọng', prompt: 'Biên tập lại đoạn này theo văn phong báo chí hành chính trang trọng của Công đoàn' },
                { label: '✏️ Sửa chính tả & câu', prompt: 'Sửa toàn bộ lỗi chính tả, ngữ pháp và trau chuốt câu từ mượt mà' }
              ].map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  disabled={aiInlineLoading}
                  onClick={() => handleAiInlineEdit(selectedText, chip.prompt)}
                  style={{
                    background: aiInlineLoading ? '#F1F5F9' : '#FFFFFF',
                    border: '1px solid #93C5FD',
                    borderRadius: '8px',
                    padding: '6px 8px',
                    fontSize: '11px',
                    color: aiInlineLoading ? '#94A3B8' : '#1E40AF',
                    cursor: aiInlineLoading ? 'wait' : 'pointer',
                    fontWeight: '700'
                  }}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ padding: '5px 8px', background: '#F8FAFC', display: 'flex', gap: '4px', overflowX: 'auto', borderBottom: '1px solid #F1F5F9' }}>
            {[
              { label: '⚡ Chuẩn 5W1H', action: () => runAi('Rà soát chuẩn mực báo chí 5W1H và chính tả toàn bài') },
              { label: '📄 Xuất Word', action: () => runAi('Xuất bài ra file Word (.docx)') },
              { label: '📑 Xuất PDF', action: () => runAi('Xuất bài ra file PDF') },
              { label: '📊 Đọc kinh phí', action: () => runAi('Đọc file Excel dự toán kinh phí') }
            ].map(chip => (
              <button key={chip.label} type="button" onClick={chip.action} style={{ background: '#FFF', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '2px 8px', fontSize: '10px', color: '#334155', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}>{chip.label}</button>
            ))}
          </div>
        )}

        {/* Input prompt form */}
        <div style={{ padding: '10px 12px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <textarea
            value={aiPrompt}
            rows={3}
            spellCheck={false}
            onChange={e => setAiPrompt(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                runAi();
              }
            }}
            placeholder="Nhập câu lệnh cho Trợ lý AI (ví dụ: 'Thêm trích dẫn phát biểu của Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một', 'Rút gọn 2 câu cuối')..."
            style={{
              width: '100%',
              minHeight: '70px',
              padding: '10px 12px',
              border: '1.5px solid #CBD5E1',
              borderRadius: '8px',
              fontSize: '12px',
              lineHeight: '1.5',
              outline: 'none',
              background: '#F8FAFC',
              fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: '#94A3B8' }}>
              Nhấn <strong>Enter</strong> để gửi lệnh
            </span>
            <button
              type="button"
              onClick={() => runAi()}
              disabled={aiLoading}
              style={{
                background: aiLoading ? '#94A3B8' : 'linear-gradient(135deg, #002855, #2563EB)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: '800',
                cursor: aiLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {aiLoading ? <i className="fa-solid fa-spinner fa-spin" /> : <i className="fa-solid fa-paper-plane" />}
              <span>{aiLoading ? 'Đang viết...' : 'Gửi Chỉ Đạo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
