import React, { useEffect, useMemo, useRef, useState } from 'react';
import Sidebar from '../components/Sidebar';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả', icon: 'fa-list', cls: '' },
  { key: 'tuyentruyen', label: 'Tuyên truyền', icon: 'fa-bullhorn', cls: 'text-warning' },
  { key: 'kehoach', label: 'Kế hoạch', icon: 'fa-calendar-check', cls: 'text-success' },
  { key: 'luat', label: 'Văn bản luật', icon: 'fa-scale-balanced', cls: 'text-primary' },
  { key: 'quyetdinh', label: 'Quyết định', icon: 'fa-stamp', cls: 'text-danger' }
];

const HASH_MAP = {
  'tuyen-truyen': 'tuyentruyen', 'tuyentruyen': 'tuyentruyen',
  'ke-hoach': 'kehoach', 'kehoach': 'kehoach',
  'luat': 'luat',
  'quyet-dinh': 'quyetdinh', 'quyetdinh': 'quyetdinh'
};

const fmtDate = (date) => {
  const parts = String(date || '').split('-');
  if (parts.length === 3) return `Bình Dương, ngày ${parts[2]} tháng ${parts[1]} năm ${parts[0]}`;
  return `Bình Dương, ${date || '2026-08-15'}`;
};

const VanBan = () => {
  const [docs, setDocs] = useState([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('loading');
  const modalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/documents?category=all');
        const json = await res.json();
        if (!cancelled) {
          if (json.success && Array.isArray(json.data)) {
            setDocs(json.data);
            setStatus('ready');
          } else {
            setStatus('error');
          }
        }
      } catch (err) {
        if (!cancelled) setStatus('error');
      }
    })();

    const rawHash = window.location.hash.replace('#', '').toLowerCase();
    if (HASH_MAP[rawHash]) setCategory(HASH_MAP[rawHash]);

    const onHashChange = () => {
      const h = window.location.hash.replace('#', '').toLowerCase();
      if (HASH_MAP[h]) setCategory(HASH_MAP[h]);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => { cancelled = true; window.removeEventListener('hashchange', onHashChange); };
  }, []);

  useEffect(() => {
    if (selected && modalRef.current) {
      const modal = bootstrap.Modal.getOrCreateInstance(modalRef.current);
      modal.show();
    }
  }, [selected]);

  const counts = useMemo(() => {
    const c = { all: docs.length };
    CATEGORIES.slice(1).forEach(({ key }) => {
      c[key] = docs.filter(d => (d.category || '').toLowerCase() === key).length;
    });
    return c;
  }, [docs]);

  const visible = useMemo(() => {
    let filtered = docs;
    if (category !== 'all') {
      filtered = filtered.filter(d => (d.category || '').toLowerCase() === category);
    }
    const q = query.trim().toLowerCase();
    if (q) {
      filtered = filtered.filter(d =>
        [d.reference_number, d.title, d.issuer, d.category_name, d.signer]
          .filter(Boolean).join(' ').toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [docs, category, query]);

  const pick = (d) => ({ ...d, category: d.category || 'all' });

  return (
    <div className="container my-3">
      <div className="breadcrumb-box"><a href="/">Trang chủ</a> / <span className="text-muted">Văn bản chỉ đạo</span></div>
      <div className="row g-4">
        <div className="col-lg-9">
          <div className="content-box">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <div className="tieudelon m-0"><i className="fa-solid fa-folder-open me-2 text-danger"></i>VĂN BẢN CHỈ ĐẠO &amp; ĐIỀU HÀNH</div>
              <div className="input-group" style={{ maxWidth: '320px' }}>
                <span className="input-group-text bg-white border-end-0 text-muted"><i className="fa-solid fa-magnifying-glass"></i></span>
                <input type="text" className="form-control border-start-0 ps-0" placeholder="Tìm số hiệu, trích yếu..." value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>

            <div className="doc-filter-bar">
              {CATEGORIES.map((c) => (
                <button key={c.key} className={`doc-tab-btn${category === c.key ? ' active' : ''}`} onClick={() => setCategory(c.key)}>
                  <i className={`fa-solid ${c.icon} ${c.cls}`}></i> {c.label} ({counts[c.key] || 0})
                </button>
              ))}
            </div>

            {status === 'loading' && (
              <div className="text-center p-4"><i className="fa-solid fa-spinner fa-spin me-2 text-primary"></i> Đang nạp danh mục văn bản chỉ đạo...</div>
            )}
            {status === 'error' && (
              <div className="alert alert-danger m-3"><i className="fa-solid fa-triangle-exclamation me-2"></i> Không thể kết nối cơ sở dữ liệu văn bản!</div>
            )}

            {status === 'ready' && visible.length === 0 && (
              <div className="text-center p-5 text-muted">
                <i className="fa-solid fa-folder-open fa-3x mb-3 text-secondary opacity-50"></i>
                <h6 className="fw-bold">Không tìm thấy văn bản nào phù hợp</h6>
                <small>Vui lòng thử chọn danh mục khác hoặc xóa từ khóa tìm kiếm</small>
              </div>
            )}

            {status === 'ready' && visible.map((d) => {
              const title = d.title || 'Văn bản chỉ đạo';
              const soHieu = d.reference_number || (d.id ? `${d.id}/CĐCS` : 'Văn bản');
              const coQuan = d.issuer || 'Ban Thường Vụ Công Đoàn TDMU';
              const ngay = d.issued_date || '2026-08-15';
              const dungLuong = d.file_size || '1.5 MB';
              const fileUrl = d.file_url || '#';
              const luotTai = d.download_count || 0;
              const moTa = d.category_name || '';
              return (
                <div className="doc-card-item" key={d.id ?? title}>
                  <div className="d-flex align-items-center gap-3 flex-grow-1 me-3">
                    <i className="fa-regular fa-file-pdf text-danger fa-2x flex-shrink-0"></i>
                    <div>
                      <div className="doc-card-title" style={{ cursor: 'pointer' }} onClick={() => setSelected(pick(d))}>
                        <span className="badge bg-primary-subtle text-primary border me-1">{soHieu}</span> {title}
                      </div>
                      <div className="doc-card-meta">
                        <i className="fa-regular fa-building me-1"></i> {coQuan} &nbsp;|&nbsp;
                        <i className="fa-regular fa-calendar me-1"></i> {ngay} &nbsp;|&nbsp;
                        <i className="fa-solid fa-download me-1 text-muted"></i> {luotTai} lượt tải
                      </div>
                      {moTa && <div className="small text-muted mt-1" style={{ fontSize: '12px', lineHeight: 1.4 }}>{moTa}</div>}
                    </div>
                  </div>
                  <div className="d-flex gap-2 align-items-center flex-shrink-0">
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSelected(pick(d))} title="Xem chi tiết nội dung văn bản">
                      <i className="fa-solid fa-eye me-1"></i> Xem
                    </button>
                    <a href={fileUrl} download className="btn-doc-download" title="Tải văn bản PDF">
                      <i className="fa-solid fa-download me-1"></i> Tải về ({dungLuong})
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <Sidebar />
      </div>

      {selected && (
        <div className="modal fade" ref={modalRef} tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header text-white" style={{ background: '#002855' }}>
                <h5 className="modal-title fs-6 fw-bold">
                  <i className="fa-solid fa-file-lines text-warning me-2"></i>[{selected.reference_number || 'Số: ...'}] {selected.title || 'Văn bản chỉ đạo'}
                </h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="bg-white p-4 border rounded shadow-sm" style={{ minHeight: '380px' }}>
                  <div className="row text-center mb-4 pb-3 border-bottom">
                    <div className="col-6">
                      <div className="fw-bold text-uppercase" style={{ fontSize: '13px', color: '#002855' }}>{selected.issuer || 'BAN THƯỜNG VỤ CÔNG ĐOÀN TDMU'}</div>
                      <div className="text-danger fw-semibold mt-1" style={{ fontSize: '13px' }}>Số: {selected.reference_number || '18/CV-CĐCS'}</div>
                    </div>
                    <div className="col-6">
                      <div className="fw-bold text-uppercase" style={{ fontSize: '13px' }}>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
                      <div className="fw-bold text-decoration-underline" style={{ fontSize: '12px' }}>Độc lập - Tự do - Hạnh phúc</div>
                      <div className="fst-italic text-muted mt-1" style={{ fontSize: '12px' }}>{fmtDate(selected.issued_date)}</div>
                    </div>
                  </div>
                  <h5 className="text-center fw-bold my-3 text-primary" style={{ lineHeight: 1.4 }}>{selected.title || 'Văn bản chỉ đạo'}</h5>
                  <div className="mt-4 p-3 bg-light rounded border">
                    <h6 className="fw-bold text-secondary mb-2" style={{ fontSize: '13px' }}><i className="fa-solid fa-circle-info me-1"></i> Trích yếu nội dung:</h6>
                    <div style={{ fontSize: '14px', lineHeight: 1.7, color: '#334155' }}>{selected.category_name || 'Nội dung văn bản...'}</div>
                  </div>
                  <div className="row mt-4 pt-3">
                    <div className="col-6">
                      <div className="small fw-bold text-muted">Nơi nhận:</div>
                      <ul className="small text-muted ps-3 mb-0" style={{ fontSize: '12px' }}>
                        <li>Đảng ủy Trường (để b/c);</li>
                        <li>Ban Giám hiệu (để phối hợp);</li>
                        <li>16 Tổ Công đoàn bộ phận;</li>
                        <li>Lưu: VT, CĐCS.</li>
                      </ul>
                    </div>
                    <div className="col-6 text-center">
                      <div className="fw-bold text-uppercase" style={{ fontSize: '13px' }}>TM. BAN THƯỜNG VỤ</div>
                      <div className="fw-semibold text-primary mt-1" style={{ fontSize: '12px' }}>CHỦ TỊCH</div>
                      <div style={{ height: '50px' }}></div>
                      <div className="fw-bold" style={{ color: '#002855' }}>{selected.signer || 'TS. Lê Thị Kim Út'}</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-white">
                <button type="button" className="btn btn-secondary btn-sm px-3" data-bs-dismiss="modal">Đóng</button>
                <a href={selected.file_url || '#'} download className="btn btn-primary btn-sm px-4 fw-bold">
                  <i className="fa-solid fa-file-pdf me-1 text-warning"></i> Tải File Văn Bản (.PDF)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VanBan;