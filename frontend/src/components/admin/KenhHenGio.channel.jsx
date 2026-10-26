import React from 'react';

export default function ScheduleChannel({
  scheduleChannels,
  setScheduleChannels,
  scheduledAt,
  setScheduledAt,
  handleConfirmSchedule,
  schedulesList,
  fetchSchedulesList,
  handleCancelSchedule
}) {
  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Left: Schedule Form */}
        <div style={{ background: '#FFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="fa-solid fa-calendar-plus" style={{ color: '#8B5CF6' }} /> Hẹn Lịch Xuất Bản Tự Động
          </div>
          <div style={{ fontSize: '12px', color: '#64748B' }}>Hệ thống Dispatcher sẽ tự động quét và phát hành đúng thời gian đã chọn:</div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#002855', display: 'block', marginBottom: '6px' }}>Chọn các kênh đăng:</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[['web','📰 Website'],['fb','📘 Facebook'],['zalo','💬 Zalo OA']].map(([ch, label]) => (
                <label key={ch} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={scheduleChannels[ch]}
                    onChange={e => setScheduleChannels(p => ({...p, [ch]: e.target.checked}))}
                    style={{ width: '15px', height: '15px' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: '#002855', display: 'block', marginBottom: '6px' }}>Thời gian xuất bản:</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #CBD5E1', borderRadius: '6px', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="button"
            onClick={handleConfirmSchedule}
            className="action-btn"
            style={{ background: 'linear-gradient(135deg,#7C3AED,#6D28D9)', color: 'white', justifyContent: 'center', fontWeight: '700', padding: '10px 16px', marginTop: '6px' }}
          >
            <i className="fa-solid fa-clock" /> Xác Nhận Lập Lịch Tự Động
          </button>
        </div>

        {/* Right: Scheduled Queue */}
        <div style={{ background: '#FFF', padding: '20px', borderRadius: '10px', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '14px', fontWeight: '800', color: '#002855', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="fa-solid fa-list-check" style={{ color: '#0284C7' }} /> Hàng Đợi Lập Lịch ({(schedulesList || []).length})
            </div>
            <button
              type="button"
              onClick={fetchSchedulesList}
              style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: '12px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <i className="fa-solid fa-rotate-right" /> Làm mới
            </button>
          </div>

          {(schedulesList || []).length === 0 ? (
            <div style={{ padding: '40px 10px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              <i className="fa-regular fa-calendar-xmark" style={{ fontSize: '28px', marginBottom: '8px', display: 'block', color: '#CBD5E1' }} />
              Chưa có lịch hẹn phát hành nào trong hàng đợi.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
              {(schedulesList || []).map(sch => (
                <div key={sch.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12.5px' }}>
                  <div>
                    <div style={{ fontWeight: '700', color: '#0F172A', marginBottom: '3px' }}>{sch.title || ('Bài viết ID #' + sch.articleId)}</div>
                    <div style={{ color: '#64748B', fontSize: '11px', display: 'flex', gap: '12px' }}>
                      <span>⏰ {new Date(sch.scheduledAt).toLocaleString('vi-VN')}</span>
                      <span>📡 Kênh: {(sch.channels || [sch.channel]).join(', ').toUpperCase()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10.5px', fontWeight: '700', background: sch.status === 'done' ? '#DCFCE7' : sch.status === 'failed' ? '#FEE2E2' : '#FEF3C7', color: sch.status === 'done' ? '#166534' : sch.status === 'failed' ? '#991B1B' : '#92400E' }}>
                      {sch.status === 'done' ? '✓ ĐÃ PHÁT HÀNH' : sch.status === 'failed' ? '⚠ LỖI' : '⏳ CHỜ ĐẾN GIỜ'}
                    </span>
                    {sch.status === 'pending' && (
                      <button type="button" onClick={() => handleCancelSchedule(sch.id)} style={{ background: '#FEE2E2', border: 'none', color: '#DC2626', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700' }} title="Hủy lịch hẹn">Hủy</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
