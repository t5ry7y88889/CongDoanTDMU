import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSavedIds, isSaved } from '../lib/bookmarks';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'Tất cả tin tức', icon: 'fa-newspaper', color: 'text-primary' },
  { key: 'Hoạt động công đoàn', label: 'Hoạt động CĐ', icon: 'fa-users', color: 'text-primary' },
  { key: 'Phong trào thi đua', label: 'Phong trào thi đua', icon: 'fa-trophy', color: 'text-warning' },
  { key: 'Chăm lo đời sống', label: 'Chăm lo đời sống', icon: 'fa-heart-pulse', color: 'text-danger' },
  { key: 'Văn hóa - Thể thao', label: 'Văn hóa - Thể thao', icon: 'fa-futbol', color: 'text-success' },
  { key: 'saved', label: 'Đã lưu', icon: 'fa-bookmark', color: 'text-danger' }
];

const TRENDING_TAGS = [
  ['#DinhDuongGiaDinh', 'Hoạt động công đoàn'],
  ['#DaiHoiXIVCongDoan', 'Phong trào thi đua'],
  ['#HocTapTheoBac', 'Phong trào thi đua'],
  ['#GiaiBongDaTDMU', 'Văn hóa - Thể thao'],
  ['#TetTrungThu2026', 'Chăm lo đời sống']
];

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500';

const TinTuc = () => {
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [savedVersion, setSavedVersion] = useState(0);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/articles?status=published');
        const json = await res.json();
        if (!cancelled) {
          if (json.success && Array.isArray(json.data)) {
            setArticles(json.data);
            setStatus('ready');
          } else {
            setStatus('empty');
          }
        }
      } catch (err) {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const refresh = () => setSavedVersion(v => v + 1);
    window.addEventListener('bookmarks:changed', refresh);
    return () => window.removeEventListener('bookmarks:changed', refresh);
  }, []);

  const savedCount = useMemo(() => getSavedIds().length, [savedVersion]);

  const hero = articles[0];

  const list = useMemo(() => {
    let filtered = articles;
    if (category === 'saved') {
      filtered = filtered.filter(a => isSaved(a.id));
    } else if (category !== 'all') {
      filtered = filtered.filter(a => (a.categoryName || a.ChuyenMuc) === category);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      filtered = filtered.filter(a => (a.title || '').toLowerCase().includes(q) || (a.summary || '').toLowerCase().includes(q));
    } else if (category === 'all' && filtered.length > 1) {
      filtered = filtered.slice(1);
    }
    return filtered;
  }, [articles, category, query, savedVersion]);

  return (
    <div className="container my-3">
      <div className="breadcrumb-box"><a href="/">Trang chủ</a> / <span className="text-muted">Tạp chí Tin tức &amp; Sự kiện</span></div>

      <div className="content-box mb-4 py-3">
        <div className="row g-3 align-items-center">
          <div className="col-lg-8">
            <div className="doc-filter-bar mb-0 border-0 pb-0">
              {CATEGORY_FILTERS.map((f) => (
                <button key={f.key} className={`doc-tab-btn${category === f.key ? ' active' : ''}`} onClick={() => setCategory(f.key)}>
                  <i className={`fa-solid ${f.icon} ${f.color}`}></i> {f.label}
                  {f.key === 'saved' && ` (${savedCount})`}
                </button>
              ))}
            </div>
          </div>
          <div className="col-lg-4">
            <div className="position-relative">
              <i className="fa-solid fa-magnifying-glass position-absolute text-muted" style={{ left: '14px', top: '12px' }}></i>
              <input
                type="text"
                className="form-control"
                style={{ borderRadius: '20px', paddingLeft: '38px', fontSize: '13px', border: '1px solid #CBD5E1' }}
                placeholder="Tìm kiếm bài viết, tác giả..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-9">
          {status === 'loading' && (
            <div className="text-center p-4">
              <i className="fa-solid fa-spinner fa-spin fa-2x text-primary"></i>
              <p className="mt-2 text-muted">Đang nạp dữ liệu tạp chí từ CSDL...</p>
            </div>
          )}

          {status === 'ready' && hero && category === 'all' && !query.trim() && (
            <Link to={`/bai-viet?id=${hero.id}`} className="news-hero-headline" style={{ textDecoration: 'none' }} title="Bấm vào để đọc toàn văn bài viết">
              <div className="row g-0">
                <div className="col-md-7">
                  <div className="hero-img-wrap position-relative">
                    <img src={hero.image || DEFAULT_IMG} className="hero-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={hero.title} />
                    <div className="live-reader-badge">
                      <span className="live-dot"></span> <span>{(hero.readingTime || '3 phút')} đọc</span>
                    </div>
                  </div>
                </div>
                <div className="col-md-5 p-4 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge" style={{ background: '#002855', color: '#FEF08A', fontWeight: 700, fontSize: '11px' }}>TIÊU ĐIỂM HÔM NAY</span>
                      <span className="text-muted small"><i className="fa-regular fa-clock me-1"></i> {(hero.readingTime || '3 phút')} đọc</span>
                    </div>
                    <h3 className="fw-bold mt-1" style={{ fontSize: '18px', lineHeight: 1.45, color: '#002855' }}>{hero.title}</h3>
                    <div className="ai-takeaway-box">
                      <div className="ai-takeaway-title"><i className="fa-solid fa-bolt text-warning"></i> Điểm Nhấn Bản Tin (30 Giây)</div>
                      <ul className="ai-takeaway-list mb-0">
                        {(hero.ai_takeaways && hero.ai_takeaways.length ? hero.ai_takeaways : [hero.summary].filter(Boolean)).map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <div className="d-flex justify-content-between align-items-center text-muted small mb-3 border-top pt-2">
                      <div className="d-flex align-items-center gap-3">
                        <span><i className="fa-regular fa-calendar me-1 text-primary"></i> {(hero.createdAt || '').split(' ')[0] || '2026-09-08'}</span>
                        <span><i className="fa-regular fa-eye text-success me-1"></i> <strong>{hero.viewsCount || 450}</strong></span>
                        <span><i className="fa-regular fa-comment-dots text-primary me-1"></i> <strong>{hero.commentsCount || 14}</strong> bình luận</span>
                      </div>
                      <span className="text-primary fw-bold">{hero.author || 'Ban Thường vụ'}</span>
                    </div>
                    <button className="btn btn-sm btn-primary w-100 fw-bold py-2" style={{ background: '#002855', borderColor: '#002855', borderRadius: '6px' }}>
                      <i className="fa-solid fa-book-open-reader me-2 text-warning"></i> ĐỌC TOÀN VĂN BÀI VIẾT
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          )}

          <div className="row g-3">
            {status === 'ready' && list.length === 0 && (
              <div className="col-12 text-center p-5 text-muted">
                <i className="fa-solid fa-inbox fa-3x mb-3 text-secondary"></i>
                <p>Không tìm thấy bài viết nào trong chuyên mục này.</p>
              </div>
            )}
            {status === 'ready' && list.map((a) => (
              <div className="col-md-6" key={a.id}>
                <Link to={`/bai-viet?id=${a.id}`} className="magazine-card" style={{ textDecoration: 'none' }} title="Bấm vào để đọc toàn văn bài viết">
                  <div className="magazine-thumb-wrap position-relative">
                    <img src={a.image || DEFAULT_IMG} className="magazine-thumb" alt={a.title} />
                    <div className="position-absolute bottom-0 start-0 m-2">
                      <span className="badge" style={{ background: 'rgba(0,40,85,0.88)', color: '#FEF08A', fontWeight: 700, fontSize: '11px' }}>
                        {a.categoryName || a.ChuyenMuc || 'Tin tức'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 d-flex flex-column justify-content-between flex-grow-1">
                    <div>
                      <h4 className="fw-bold" style={{ fontSize: '15px', lineHeight: 1.45, color: '#002855', marginBottom: 8 }}>{a.title}</h4>
                      <p className="text-muted small mb-3" style={{ lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{a.summary || ''}</p>
                    </div>
                    <div className="d-flex justify-content-between align-items-center text-muted small border-top pt-2 mt-auto">
                      <div className="d-flex align-items-center gap-3">
                        <span title="Ngày đăng"><i className="fa-regular fa-calendar text-primary me-1"></i> {(a.createdAt || '26/08/2026').split(' ')[0]}</span>
                        <span title="Lượt xem"><i className="fa-regular fa-eye text-success me-1"></i> {a.viewsCount || 160}</span>
                        <span title="Bình luận"><i className="fa-regular fa-comment-dots text-primary me-1"></i> {a.commentsCount || 8}</span>
                      </div>
                      <span className="text-primary fw-bold" style={{ fontSize: '12px' }}>{a.author || 'Ban Thường vụ'}</span>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {status === 'error' && (
            <div className="alert alert-warning text-center">Không thể kết nối danh mục bài viết từ máy chủ.</div>
          )}
        </div>

        <div className="col-lg-3">
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-fire me-2 text-danger"></i>Chủ đề thịnh hành</div>
            <div className="p-3 d-flex flex-wrap gap-2">
              {TRENDING_TAGS.map(([tag, cat]) => (
                <span key={tag} className="badge bg-light text-primary border" style={{ cursor: 'pointer' }} onClick={() => { setCategory(cat); window.scrollTo({ top: 0 }); }}>{tag}</span>
              ))}
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
            <div className="list-group-tdmu">
              <a href="https://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
              <a href="https://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học TDMU</a>
              <a href="https://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam</a>
              <a href="https://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
              <a href="https://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH TDMU</a>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê tương tác</div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-heart text-danger me-2"></i> Lượt thả tim: <strong>3,890</strong></p>
              <p className="mb-0"><i className="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>811,221</strong></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TinTuc;