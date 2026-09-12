import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const CoCauToChuc = () => {
  const [activeTab, setActiveTab] = useState('ban-thuong-vu');
  const [orgData, setOrgData] = useState({ boards: [], units: [], cadres: [], stats: {} });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/org-full-tree').then(r => r.json());
      if (res.success && res.data) {
        setOrgData(res.data);
      }
    } catch (err) {
      console.error('Error loading organization data:', err);
    } finally {
      setLoading(false);
    }
  };

  const cadres = orgData.cadres || [];
  const units = orgData.units || [];

  // Categorize cadres based on roles or board_id
  const btvCadres = cadres.filter(c =>
    (c.role || '').toLowerCase().includes('chủ tịch') ||
    (c.role || '').toLowerCase().includes('phó chủ tịch') ||
    (c.role || '').toLowerCase().includes('thường vụ') ||
    c.board_id === 1
  );

  const bchCadres = cadres.filter(c =>
    (c.role || '').toLowerCase().includes('ủy viên') ||
    (c.role || '').toLowerCase().includes('chấp hành') ||
    c.board_id === 2 ||
    btvCadres.includes(c)
  );

  const ubktCadres = cadres.filter(c =>
    (c.role || '').toLowerCase().includes('kiểm tra') ||
    c.board_id === 3
  );

  return (
    <div className="container my-4">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <Link to="/">Trang chủ</Link> / <span className="text-muted">Cơ cấu tổ chức Công đoàn TDMU</span>
      </div>

      {/* Tabs Chuyên Mục */}
      <div className="content-box mb-4 py-3">
        <div className="d-flex flex-wrap gap-2">
          <button
            className={`btn btn-sm ${activeTab === 'ban-thuong-vu' ? 'btn-warning fw-bold text-dark' : 'btn-light border'}`}
            onClick={() => setActiveTab('ban-thuong-vu')}
          >
            <i className="fa-solid fa-crown me-1 text-warning"></i> Ban Thường Vụ
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'ban-chap-hanh' ? 'btn-primary fw-bold' : 'btn-light border'}`}
            onClick={() => setActiveTab('ban-chap-hanh')}
          >
            <i className="fa-solid fa-users me-1 text-primary"></i> Ban Chấp Hành ({bchCadres.length > 0 ? bchCadres.length : 13} Đ/C)
          </button>
          <button
            className={`btn btn-sm ${activeTab === 'uy-ban-kiem-tra' ? 'btn-success fw-bold' : 'btn-light border'}`}
            onClick={() => setActiveTab('uy-ban-kiem-tra')}
          >
            <i className="fa-solid fa-scale-balanced me-1 text-success"></i> Ủy Ban Kiểm Tra
          </button>
          <button
            className={`btn btn-sm ${activeTab === '16-to-cong-doan' ? 'btn-danger fw-bold' : 'btn-light border'}`}
            onClick={() => setActiveTab('16-to-cong-doan')}
          >
            <i className="fa-solid fa-sitemap me-1 text-danger"></i> 16 Tổ Công Đoàn Cơ Sở
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* CỘT TRÁI: DANH SÁCH NHÂN SỰ / TỔ */}
        <div className="col-lg-9">
          {loading ? (
            <div className="text-center py-5 text-muted">
              <i className="fa-solid fa-circle-notch fa-spin me-2 fs-4"></i>
              <div>Đang tải sơ đồ cơ cấu tổ chức từ SQL Server...</div>
            </div>
          ) : (
            <>
              {/* TAB 1: BAN THƯỜNG VỤ */}
              {activeTab === 'ban-thuong-vu' && (
                <div className="content-box mb-4">
                  <div className="tieudelon mb-2">
                    <i className="fa-solid fa-crown text-warning me-2"></i>
                    BAN THƯỜNG VỤ CÔNG ĐOÀN KHÓA X (NHIỆM KỲ 2023 – 2028)
                  </div>
                  <p className="text-muted small mb-4">
                    Ban Thường vụ là cơ quan lãnh đạo cao nhất giữa hai kỳ họp Ban Chấp hành, trực tiếp chỉ đạo và điều hành mọi hoạt động phong trào đoàn viên.
                  </p>
                  <div className="d-flex flex-column gap-3">
                    {btvCadres.length > 0 ? btvCadres.map(c => (
                      <div key={c.id} className="card border shadow-sm p-3" style={{ borderRadius: '10px' }}>
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold fs-5 shadow-sm"
                              style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #002855, #0284C7)' }}
                            >
                              {c.name ? c.name.split(' ').slice(-1)[0][0] : 'U'}
                            </div>
                            <div>
                              <h6 className="fw-bold mb-1" style={{ color: '#002855', fontSize: '16px' }}>{c.name}</h6>
                              <div className="text-muted small">
                                <span><i className="fa-solid fa-envelope text-primary me-1"></i> {c.email || 'congdoan@tdmu.edu.vn'}</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <span className="badge bg-warning text-dark px-3 py-2 fw-bold" style={{ fontSize: '12px' }}>
                              <i className="fa-solid fa-star me-1"></i> {c.role || 'Ủy viên Ban Thường vụ'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div className="p-3 text-muted">Đang cập nhật danh sách Ban Thường vụ...</div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: BAN CHẤP HÀNH */}
              {activeTab === 'ban-chap-hanh' && (
                <div className="content-box mb-4">
                  <div className="tieudelon mb-2">
                    <i className="fa-solid fa-users text-primary me-2"></i>
                    BAN CHẤP HÀNH CÔNG ĐOÀN CƠ SỞ TRƯỜNG ĐH THỦ DẦU MỘT
                  </div>
                  <p className="text-muted small mb-4">
                    Gồm 13 đồng chí đại diện cho tiếng nói, nguyện vọng của toàn thể cán bộ, giảng viên và người lao động toàn trường.
                  </p>
                  <div className="row g-3">
                    {bchCadres.map(c => (
                      <div className="col-md-6" key={c.id}>
                        <div className="card h-100 border shadow-sm p-3" style={{ borderRadius: '8px' }}>
                          <div className="fw-bold text-primary mb-1">{c.name}</div>
                          <div className="small text-secondary mb-2">{c.role || 'Ủy viên Ban Chấp Hành'}</div>
                          <div className="small text-muted mt-auto"><i className="fa-regular fa-envelope me-1"></i>{c.email || 'N/A'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ỦY BAN KIỂM TRA */}
              {activeTab === 'uy-ban-kiem-tra' && (
                <div className="content-box mb-4">
                  <div className="tieudelon mb-2">
                    <i className="fa-solid fa-scale-balanced text-success me-2"></i>
                    ỦY BAN KIỂM TRA CÔNG ĐOÀN CƠ SỞ TDMU
                  </div>
                  <p className="text-muted small mb-4">
                    Thực hiện giám sát việc chấp hành Điều lệ Công đoàn Việt Nam, quản lý tài chính và giải quyết đơn thư khiếu nại, phản ánh.
                  </p>
                  <div className="d-flex flex-column gap-3">
                    {ubktCadres.length > 0 ? ubktCadres.map(c => (
                      <div key={c.id} className="card border shadow-sm p-3" style={{ borderRadius: '10px' }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="fw-bold mb-1 text-dark">{c.name}</h6>
                            <small className="text-muted"><i className="fa-regular fa-envelope me-1"></i>{c.email}</small>
                          </div>
                          <span className="badge bg-success px-3 py-2">{c.role || 'Ủy viên UBKT'}</span>
                        </div>
                      </div>
                    )) : (
                      <div className="card border shadow-sm p-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <h6 className="fw-bold mb-1 text-dark">ThS. Đặng Thị Kim Quyên</h6>
                            <small className="text-muted">Chủ nhiệm Ủy Ban Kiểm Tra</small>
                          </div>
                          <span className="badge bg-success px-3 py-2">Chủ Nhiệm UBKT</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: 16 TỔ CÔNG ĐOÀN CƠ SỞ */}
              {activeTab === '16-to-cong-doan' && (
                <div className="content-box mb-4">
                  <div className="tieudelon mb-2">
                    <i className="fa-solid fa-sitemap text-danger me-2"></i>
                    DANH SÁCH 16 TỔ CÔNG ĐOÀN BỘ PHẬN TRỰC THUỘC
                  </div>
                  <p className="text-muted small mb-4">
                    16 Tổ công đoàn trực thuộc các Viện, Khoa, Trung tâm và Phòng ban thực hiện nhiệm vụ chăm lo và tuyên truyền sâu sát đến từng đoàn viên.
                  </p>
                  <div className="table-responsive">
                    <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                      <thead className="table-primary">
                        <tr>
                          <th style={{ width: '60px', textAlign: 'center' }}>Mã</th>
                          <th>Tên Tổ Công Đoàn</th>
                          <th>Tổ Trưởng</th>
                          <th>Email Liên Hệ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {units.map((u, i) => (
                          <tr key={u.id || i}>
                            <td className="text-center fw-bold text-primary">{u.code || u.id}</td>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.leader || 'Ban Chấp Hành Tổ'}</td>
                            <td className="text-muted"><i className="fa-regular fa-envelope me-1"></i>{u.email || `tcd${String(i + 1).padStart(2, '0')}@tdmu.edu.vn`}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* CỘT PHẢI: LIÊN KẾT & QUY MÔ */}
        <div className="col-lg-3">
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-sitemap me-2 text-primary"></i>Quy mô tổ chức
            </div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-users text-primary me-2"></i> Tổng đoàn viên: <strong>760 cán bộ</strong></p>
              <p className="mb-2"><i className="fa-solid fa-building text-warning me-2"></i> Tổ công đoàn: <strong>16 đơn vị</strong></p>
              <p className="mb-2"><i className="fa-solid fa-user-tie text-success me-2"></i> Cán bộ BTV/BCH: <strong>13 đồng chí</strong></p>
              <p className="mb-0"><i className="fa-solid fa-calendar-check text-info me-2"></i> Nhiệm kỳ: <strong>2023 - 2028</strong></p>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu">
              <i className="fa-solid fa-link me-2 text-warning"></i>Liên kết website
            </div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một
              </a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ ĐH Thủ Dầu Một
              </a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item">
                <i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoCauToChuc;
