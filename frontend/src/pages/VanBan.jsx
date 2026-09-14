import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PaginationBar from '../components/PaginationBar';

const staticDocs = [
  { id: 1, reference_number: '18/CV-CĐCS', title: 'Văn bản triển khai vận động ủng hộ đồng bào bị thiệt hại do bão số 3', category: 'tuyen-truyen', issuer: 'Ban Thường Vụ Công Đoàn TDMU', signer: 'TS. Lê Thị Kim Út', issued_date: '2026-09-12', file_size: '1.2 MB', download_count: 156, description: 'Công đoàn cơ sở Trường Đại học Thủ Dầu Một vận động cán bộ, giảng viên, người lao động quyên góp ủng hộ đồng bào các tỉnh miền Bắc bị thiệt hại do bão lũ.' },
  { id: 2, reference_number: '25/KH-CĐCS', title: 'Kế hoạch tổ chức giải Bóng đá truyền thống "Công đoàn trường ĐH Thủ Dầu Một"', category: 'ke-hoach', issuer: 'Công Đoàn Trường ĐH Thủ Dầu Một', signer: 'TS. Lê Thị Kim Út', issued_date: '2026-09-05', file_size: '3.1 MB', download_count: 89, description: 'Kế hoạch tổ chức giải thể thao chào mừng các ngày lễ lớn, tạo sân chơi lành mạnh cho đoàn viên, người lao động.' },
  { id: 3, reference_number: '12/2012/QH13', title: 'Luật Công đoàn 2012', category: 'luat', issuer: 'Quốc hội Nước CHXHCN Việt Nam', signer: 'Chủ tịch Quốc hội', issued_date: '2012-06-20', file_size: '650 KB', download_count: 320, description: 'Luật Công đoàn số 12/2012/QH13 quy định quyền, trách nhiệm của tổ chức Công đoàn, quyền lợi và nghĩa vụ của đoàn viên công đoàn.' },
  { id: 4, reference_number: '82/QĐ-LĐLĐ', title: 'Quyết định thành lập Công đoàn cơ sở Trường Đại học Thủ Dầu Một', category: 'quyet-dinh', issuer: 'LĐLĐ Tỉnh Bình Dương', signer: 'Chủ tịch LĐLĐ Tỉnh Bình Dương', issued_date: '2026-08-30', file_size: '850 KB', download_count: 64, description: 'Thành lập Công đoàn cơ sở Trường Đại học Thủ Dầu Một trực thuộc LĐLĐ tỉnh Bình Dương.' },
  { id: 5, reference_number: '1630/CV-BTG', title: 'Công văn triển khai Cuộc thi tìm hiểu Nghị quyết Đại hội Công đoàn', category: 'tuyen-truyen', issuer: 'Ban Tuyên giáo LĐLĐ Tỉnh Bình Dương', signer: 'Trưởng Ban Tuyên giáo', issued_date: '2026-08-22', file_size: '1.9 MB', download_count: 102, description: 'Triển khai cuộc thi tìm hiểu Nghị quyết Đại hội Công đoàn các cấp nhiệm kỳ 2026 - 2031.' }
];

const catMap = (raw) =>
  ({
    'tuyen-truyen': 'tuyentruyen',
    tuyentruyen: 'tuyentruyen',
    'ke-hoach': 'kehoach',
    kehoach: 'kehoach',
    luat: 'luat',
    'quyet-dinh': 'quyetdinh',
    quyetdinh: 'quyetdinh'
  })[String(raw || '').toLowerCase()] || null;

const strip = (str) =>
  (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[đĐ]/g, 'd').toLowerCase();

function toVIE(dateStr) {
  let d = dateStr ? new Date(String(dateStr).slice(0, 10) + 'T00:00:00') : new Date();
  if (isNaN(d.getTime())) d = new Date();
  const months = ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'];
  return `Bình Dương, ngày ${d.getDate()} ${months[d.getMonth()]} năm ${d.getFullYear()}`;
}

const VanBan = () => {
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    const cat = catMap(location.hash.replace('#', ''));
    if (cat) setSelectedCategory(cat);
  }, [location.hash]);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await fetch('/api/documents').then((r) => r.json());
        if (res.success && Array.isArray(res.data)) {
          setDocuments(res.data);
        }
      } catch (err) {
        console.error('Error fetching documents:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocuments();
  }, []);

  const docs = documents.length > 0 ? documents : staticDocs;

  const filteredDocs = docs.filter((d) => {
    const cat = d.category || d.DocumentType || '';
    const matchCat = selectedCategory === 'all' || cat === selectedCategory;
    const q = strip(searchQuery.trim());
    const matchSearch =
      !q ||
      strip(d.reference_number).includes(q) ||
      strip(d.title).includes(q) ||
      strip(d.issuer).includes(q) ||
      strip(d.description || '').includes(q);
    return matchCat && matchSearch;
  });

  const getCount = (cat) => {
    if (cat === 'all') return docs.length;
    return docs.filter((d) => (d.category || d.DocumentType || '') === cat).length;
  };

  const changeFilter = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * pageSize;
  const currentDocs = filteredDocs.slice(startIndex, startIndex + pageSize);

  const tabs = [
    { id: 'all', label: 'Tất cả', icon: 'fa-list', iconColor: '' },
    { id: 'tuyentruyen', label: 'Tuyên truyền', icon: 'fa-bullhorn', iconColor: 'text-warning' },
    { id: 'kehoach', label: 'Kế hoạch', icon: 'fa-calendar-check', iconColor: 'text-success' },
    { id: 'luat', label: 'Văn bản luật', icon: 'fa-scale-balanced', iconColor: 'text-primary' },
    { id: 'quyetdinh', label: 'Quyết định', icon: 'fa-stamp', iconColor: 'text-danger' }
  ];

  return (
    <div className="container my-3">
      <div className="breadcrumb-box">
        <a href="/">Trang chủ</a> / <span className="text-muted">Văn bản chỉ đạo</span>
      </div>

      <div className="row g-4">
        <div className="col-lg-9">
          <div className="content-box">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
              <div className="tieudelon m-0">
                <i className="fa-solid fa-folder-open me-2 text-danger"></i>VĂN BẢN CHỈ ĐẠO &amp; ĐIỀU HÀNH
              </div>
              <div className="input-group" style={{ maxWidth: '320px' }}>
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <i className="fa-solid fa-magnifying-glass"></i>
                </span>
                <input
                  type="text"
                  id="docSearchInput"
                  className="form-control border-start-0 ps-0"
                  placeholder="Tìm số hiệu, trích yếu..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="doc-filter-bar" id="docCategoryTabs">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  className={`doc-tab-btn ${selectedCategory === t.id ? 'active' : ''}`}
                  onClick={() => changeFilter(t.id)}
                >
                  <i className={`fa-solid ${t.icon} ${t.iconColor}`}></i> {t.label}{' '}
                  (<span id={`count_${t.id}`}>{getCount(t.id)}</span>)
                </button>
              ))}
            </div>

            <div id="document_list_container">
              {loading ? (
                <div className="text-center p-4">
                  <i className="fa-solid fa-spinner fa-spin me-2 text-primary"></i> Đang nạp danh mục văn bản chỉ đạo...
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center p-5 text-muted">
                  <i className="fa-solid fa-folder-open fa-3x mb-3 text-secondary opacity-50"></i>
                  <h6 className="fw-bold">Không tìm thấy văn bản nào phù hợp</h6>
                  <small>Vui lòng thử chọn danh mục khác hoặc xóa từ khóa tìm kiếm</small>
                </div>
              ) : (
                currentDocs.map((d) => {
                  const soHieu = d.reference_number || (d.id ? `${d.id}/CĐCS` : 'Văn bản');
                  const coQuan = d.issuer || 'Ban Thường Vụ Công Đoàn TDMU';
                  const ngay = d.issued_date || '';
                  const dungLuong = d.file_size || '1.5 MB';
                  const fileUrl = d.file_url || '#';
                  const luotTai = d.download_count || 0;
                  return (
                    <div className="doc-card-item" key={d.id}>
                      <div className="d-flex align-items-center gap-3 flex-grow-1 me-3">
                        <i className="fa-regular fa-file-pdf text-danger fa-2x flex-shrink-0"></i>
                        <div>
                          <div className="doc-card-title" style={{ cursor: 'pointer' }} onClick={() => setPreviewDoc(d)}>
                            <span className="badge bg-primary-subtle text-primary border me-1">{soHieu}</span> {d.title}
                          </div>
                          <div className="doc-card-meta">
                            <i className="fa-regular fa-building me-1"></i> {coQuan} &nbsp;|&nbsp;
                            <i className="fa-regular fa-calendar me-1"></i> {ngay} &nbsp;|&nbsp;
                            <i className="fa-solid fa-download me-1 text-muted"></i> {luotTai} lượt tải
                          </div>
                          {d.description ? (
                            <div className="small text-muted mt-1" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                              {d.description}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <div className="d-flex gap-2 align-items-center flex-shrink-0">
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setPreviewDoc(d)} title="Xem chi tiết nội dung văn bản">
                          <i className="fa-solid fa-eye me-1"></i> Xem
                        </button>
                        <a href={fileUrl} target="_blank" rel="noreferrer" className="btn-doc-download" title="Tải văn bản PDF">
                          <i className="fa-solid fa-download me-1"></i> Tải về ({dungLuong})
                        </a>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {filteredDocs.length > 0 && (
              <div id="doc_pagination" className="mt-3">
                <PaginationBar
                  currentPage={currentPage}
                  totalItems={filteredDocs.length}
                  pageSize={pageSize}
                  pageSizeOptions={[8, 16, 32]}
                  onPageChange={(p) => setCurrentPage(p)}
                  onPageSizeChange={(s) => {
                    setPageSize(s);
                    setCurrentPage(1);
                  }}
                  itemLabel="văn bản"
                />
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-3">
          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website
            </div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
              </a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ Đại học Thủ Dầu Một
              </a>
              <a href="http://www.congdoan.vn" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Tổng LĐLĐ Việt Nam
              </a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
              </a>
              <a href="http://lib.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> TT Học Liệu ĐH Thủ Dầu Một
              </a>
              <a href="http://doanvien.congdoan.vn/VTBWebProject" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Phần mềm quản lý đoàn viên
              </a>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-chart-simple me-2 text-warning"></i>Thống kê truy cập
            </div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2">
                <i className="fa-solid fa-users text-primary me-2"></i> Đang trực tuyến: <strong>12</strong>
              </p>
              <p className="mb-0">
                <i className="fa-solid fa-eye text-success me-2"></i> Tổng lượt xem: <strong>811,221</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XEM TRƯỚC VĂN BẢN */}
      {previewDoc && (
        <div className="modal fade show d-block" id="modalDocPreview" tabIndex="-1" aria-hidden="true" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.45)' }} onClick={(e) => { if (e.target === e.currentTarget) setPreviewDoc(null); }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header text-white" style={{ background: '#002855' }}>
                <h5 className="modal-title fs-6 fw-bold" id="docModalTitle">
                  <i className="fa-solid fa-file-lines text-warning me-2"></i>
                  [{previewDoc.reference_number || 'Số: ...'}] {previewDoc.title}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setPreviewDoc(null)}></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="bg-white p-4 border rounded shadow-sm" style={{ minHeight: '380px' }}>
                  <div className="row text-center mb-4 pb-3 border-bottom">
                    <div className="col-6">
                      <div className="fw-bold text-uppercase" id="docModalOrg" style={{ fontSize: '13px', color: '#002855' }}>
                        {previewDoc.issuer || 'BAN THƯỜNG VỤ CÔNG ĐOÀN TDMU'}
                      </div>
                      <div className="text-danger fw-semibold mt-1" id="docModalNumber" style={{ fontSize: '13px' }}>
                        Số: {previewDoc.reference_number || '18/CV-CĐCS'}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="fw-bold text-uppercase" style={{ fontSize: '13px' }}>
                        CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                      </div>
                      <div className="fw-bold text-decoration-underline" style={{ fontSize: '12px' }}>
                        Độc lập - Tự do - Hạnh phúc
                      </div>
                      <div className="fst-italic text-muted mt-1" id="docModalDate" style={{ fontSize: '12px' }}>
                        {toVIE(previewDoc.issued_date)}
                      </div>
                    </div>
                  </div>

                  <h5 className="text-center fw-bold my-3 text-primary" id="docModalHeading" style={{ lineHeight: '1.4' }}>
                    {previewDoc.title}
                  </h5>

                  <div className="mt-4 p-3 bg-light rounded border">
                    <h6 className="fw-bold text-secondary mb-2" style={{ fontSize: '13px' }}>
                      <i className="fa-solid fa-circle-info me-1"></i> Trích yếu nội dung:
                    </h6>
                    <div id="docModalSummary" style={{ fontSize: '14px', lineHeight: '1.7', color: '#334155' }}>
                      {previewDoc.description || 'Văn bản chỉ đạo và điều hành của Công đoàn cơ sở Trường Đại học Thủ Dầu Một ban hành và triển khai đến các cấp công đoàn bộ phận.'}
                    </div>
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
                      <div className="fw-bold" id="docModalSigner" style={{ color: '#002855' }}>
                        {previewDoc.signer || 'TS. Lê Thị Kim Út'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-white">
                <button type="button" className="btn btn-secondary btn-sm px-3" onClick={() => setPreviewDoc(null)}>Đóng</button>
                <a href={(previewDoc.file_url) || '#'} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm px-4 fw-bold">
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