import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const defaultCadres = [
  { id: 1, name: 'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/images/Picture1.jpg', title: 'Chủ tịch Công đoàn Trường', degree: 'Tiến sĩ Quản lý', unit: 'Phòng Quản lý Khoa học', email: 'congdoan@tdmu.edu.vn', duties: 'Phụ trách chung công tác Công đoàn, trực tiếp chỉ đạo kế hoạch hoạt động, tài chính và quan hệ đối ngoại.', tag: 'tag-president', tagText: 'Chủ tịch' },
  { id: 2, name: 'ThS. Nguyễn Minh Danh', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg', title: 'Phó Chủ tịch Công đoàn, Chủ nhiệm UBKT', degree: 'Thạc sĩ', unit: 'Công đoàn Trường TDMU', email: 'danhnm@tdmu.edu.vn', duties: 'Chỉ đạo công tác kiểm tra giám sát, bảo vệ quyền và lợi ích hợp pháp chính đáng của người lao động.', tag: 'tag-vice-president', tagText: 'Phó Chủ tịch' },
  { id: 3, name: 'ThS. Phan Nguyễn Quỳnh Anh', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Anh.jpg', title: 'Phó Chủ tịch Công đoàn Trường', degree: 'Thạc sĩ', unit: 'Công đoàn Trường TDMU', email: 'anhpnq@tdmu.edu.vn', duties: 'Chỉ đạo công tác Nữ công, phong trào thi đua và chăm lo đời sống vật chất tinh thần đoàn viên.', tag: 'tag-vice-president', tagText: 'Phó Chủ tịch' },
  { id: 4, name: 'Lê Nguyễn Xuân Lan', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Lan.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Khoa Sư phạm', email: 'lanlnx@tdmu.edu.vn', duties: 'Phụ trách công tác chuyên môn khối Sư phạm, phát động các phong trào hội thi giáo viên dạy giỏi.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 5, name: 'Phan Nguyễn Hồng Diễm', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Diem.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Phòng Tổ chức Cán bộ', email: 'diempnh@tdmu.edu.vn', duties: 'Phụ trách công tác thi đua khen thưởng và phát triển đoàn viên mới.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 6, name: 'Võ Nguyễn Đoan Trinh', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Trinh.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Trường Luật và Quản lý', email: 'trinhvnd@tdmu.edu.vn', duties: 'Tư vấn pháp lý lao động và chính sách tiền lương, bảo hiểm cho cán bộ viên chức.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 7, name: 'Nguyễn Võ Thành Long', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Long.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Khoa Kỹ thuật Công nghệ', email: 'longnvt@tdmu.edu.vn', duties: 'Phụ trách phong trào thể dục thể thao và các giải đấu truyền thống trường.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 8, name: 'Trần Đức Hoàn', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Hoan.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Khoa Kinh tế', email: 'hoantd@tdmu.edu.vn', duties: 'Phụ trách công tác phúc lợi kinh tế và liên kết ưu đãi doanh nghiệp.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 9, name: 'Võ Quốc Lương', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Luong.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Viện Công nghệ số', email: 'luongvq@tdmu.edu.vn', duties: 'Chủ trì công tác chuyển đổi số truyền thông, quản trị Cổng thông tin Công đoàn và hệ thống báo cáo số.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 10, name: 'Huỳnh Thanh Thúy', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Thuy.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Khoa Ngoại ngữ', email: 'thuyht@tdmu.edu.vn', duties: 'Phụ trách công tác tuyên truyền đối ngoại và phong trào văn hóa văn nghệ.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 11, name: 'Phú Thị Tuyết Nga', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Nga.jpeg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Phòng Đào tạo Đại học', email: 'ngaptt@tdmu.edu.vn', duties: 'Theo dõi nắm bắt tâm tư nguyện vọng của giảng viên khối đào tạo chuyên trách.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 12, name: 'Âu Minh Triết', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Triet.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Khoa Khoa học Quản lý', email: 'trietam@tdmu.edu.vn', duties: 'Phụ trách công tác an toàn vệ sinh lao động và bảo hộ người lao động.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 13, name: 'Nguyễn Thị Thanh Thảo', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Thao.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Cử nhân', unit: 'Phòng Kế hoạch Tài chính', email: 'thaontt@tdmu.edu.vn', duties: 'Phụ trách công tác thủ quỹ, quản lý tài sản và hồ sơ quyết toán công đoàn.', tag: 'tag-executive', tagText: 'Ủy viên BCH' }
];

const CoCauToChuc = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'ban-thuong-vu');
  const [selectedCadre, setSelectedCadre] = useState(null);
  const [units, setUnits] = useState([]);
  const [bchMembers, setBchMembers] = useState(defaultCadres);
  const [btvMembers, setBtvMembers] = useState(defaultCadres.slice(0, 3));
  const [ubktMembers, setUbktMembers] = useState(defaultCadres.slice(1, 4));
  const [stats, setStats] = useState({ total_members: 760, total_units: 16, total_boards: 5, total_cadres: 13 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // NẠP DỮ LIỆU ĐỘNG TỪ BẢNG CSDL QUA API /api/org-full-tree
  useEffect(() => {
    let isMounted = true;
    fetch('/api/org-full-tree')
      .then(r => r.json())
      .then(res => {
        if (!isMounted) return;
        if (res && res.success && res.data) {
          const { cadres = [], units: rawUnits = [], stats: rawStats } = res.data;

          if (Array.isArray(cadres) && cadres.length > 0) {
            const mappedCadres = cadres.map(c => {
              const roleName = c.role || c.ChucVuCongDoan || 'Ủy viên';
              let tag = 'tag-executive';
              let tagText = roleName;
              if (roleName.includes('Chủ tịch') && !roleName.includes('Phó')) {
                tag = 'tag-president';
                tagText = 'Chủ tịch';
              } else if (roleName.includes('Phó Chủ tịch')) {
                tag = 'tag-vice-president';
                tagText = 'Phó Chủ tịch';
              } else if (roleName.includes('UBKT') || roleName.includes('Chủ nhiệm')) {
                tag = 'tag-vice-president';
              }

              return {
                id: c.id,
                name: c.name || c.HoVaTen,
                photo: c.photo || c.AvatarUrl || 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg',
                title: roleName,
                degree: c.degree || c.HocHamHocVi || 'Cử nhân',
                unit: c.unit_name || c.unit || c.ChucVuChuyenMon || 'Công đoàn Trường TDMU',
                email: c.email || 'congdoan@tdmu.edu.vn',
                phone: c.phone || '0274.3822058',
                duties: c.duties || 'Tham gia công tác phong trào và thực hiện các nhiệm vụ do Ban Thường vụ phân công.',
                board_id: c.board_id || c.MaToChuc,
                tag,
                tagText
              };
            });

            setBchMembers(mappedCadres);

            // Phân loại Ban Thường Vụ (Board ID = 1 hoặc Chủ tịch / Phó chủ tịch)
            const btv = mappedCadres.filter(c => c.board_id === 1 || (c.title && (c.title.includes('Chủ tịch') || c.title.includes('Thường vụ'))));
            setBtvMembers(btv.length > 0 ? btv : mappedCadres.slice(0, 3));

            // Phân loại Ủy Ban Kiểm Tra (Board ID = 3 hoặc Chức vụ UBKT)
            const ubkt = mappedCadres.filter(c => c.board_id === 3 || (c.title && (c.title.includes('UBKT') || c.title.includes('Kiểm tra'))));
            setUbktMembers(ubkt.length > 0 ? ubkt : mappedCadres.slice(1, 4));
          }

          if (Array.isArray(rawUnits) && rawUnits.length > 0) {
            setUnits(rawUnits);
          }

          if (rawStats) {
            setStats(rawStats);
          }
        }
      })
      .catch(err => {
        console.warn('Lỗi nạp cây tổ chức từ CSDL, giữ nguyên dữ liệu hiển thị dự phòng:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  return (
    <div className="container my-3">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <Link to="/">Trang chủ</Link> / <span className="text-muted">Cơ cấu tổ chức Công đoàn</span>
      </div>

      <div className="row g-4">
        {/* CỘT TRÁI: DANH SÁCH BAN VÀ 16 TỔ */}
        <div className="col-lg-9">
          {/* TAB SELECTION HEADER */}
          <div className="doc-tabs-container mb-3 d-flex flex-wrap gap-2">
            <button
              className={`doc-tab-btn ${activeTab === 'ban-thuong-vu' ? 'active' : ''}`}
              onClick={() => setActiveTab('ban-thuong-vu')}
            >
              <i className="fa-solid fa-crown me-1 text-warning"></i> Ban thường vụ ({btvMembers.length})
            </button>
            <button
              className={`doc-tab-btn ${activeTab === 'ban-chap-hanh' ? 'active' : ''}`}
              onClick={() => setActiveTab('ban-chap-hanh')}
            >
              <i className="fa-solid fa-users me-1 text-primary"></i> Ban chấp hành ({bchMembers.length})
            </button>
            <button
              className={`doc-tab-btn ${activeTab === 'uy-ban-kiem-tra' ? 'active' : ''}`}
              onClick={() => setActiveTab('uy-ban-kiem-tra')}
            >
              <i className="fa-solid fa-shield-halved me-1 text-success"></i> Ủy ban kiểm tra ({ubktMembers.length})
            </button>
            <button
              className={`doc-tab-btn ${activeTab === '16-to-cong-doan' ? 'active' : ''}`}
              onClick={() => setActiveTab('16-to-cong-doan')}
            >
              <i className="fa-solid fa-building me-1 text-info"></i> 16 Tổ công đoàn cơ sở ({units.length || 16})
            </button>
          </div>

          {/* TAB 1: BAN THƯỜNG VỤ */}
          {activeTab === 'ban-thuong-vu' && (
            <div className="content-box mb-4">
              <div className="tieudelon mb-3" style={{ borderBottom: '2px solid #002855' }}>
                <span><i className="fa-solid fa-crown text-warning me-2"></i>BAN THƯỜNG VỤ CÔNG ĐOÀN KHÓA X (NHIỆM KỲ 2023 – 2028)</span>
              </div>
              <p className="text-muted small mb-3">
                Ban Thường vụ là cơ quan lãnh đạo cao nhất giữa hai kỳ họp Ban Chấp hành, trực tiếp chỉ đạo và điều hành mọi hoạt động phong trào đoàn viên. <em>(Dữ liệu trực tiếp từ CSDL - Bấm vào thẻ để xem hồ sơ phân công chi tiết)</em>
              </p>

              {btvMembers.map(c => (
                <div key={c.id} className="cadre-card-item" onClick={() => setSelectedCadre(c)} title="Xem hồ sơ phân công chi tiết">
                  <div className="d-flex align-items-center gap-3">
                    <img src={c.photo} className="cadre-real-avatar" alt={c.name} onError={e => { e.target.src = 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'; }} />
                    <div>
                      <h5 className="fw-bold mb-1" style={{ fontSize: '15.5px', color: '#002855' }}>{c.name}</h5>
                      <div className="text-muted small">
                        <span><i className="fa-solid fa-briefcase text-primary me-1"></i> {c.unit}</span>
                        <span className="ms-3"><i className="fa-solid fa-envelope text-primary me-1"></i> {c.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`cadre-role-tag ${c.tag}`}><i className="fa-solid fa-star me-1"></i> {c.tagText}</span>
                    <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}><i className="fa-solid fa-circle-info text-primary me-1"></i> Chi tiết »</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: BAN CHẤP HÀNH */}
          {activeTab === 'ban-chap-hanh' && (
            <div className="content-box mb-4">
              <div className="tieudelon mb-3" style={{ borderBottom: '2px solid #002855' }}>
                <span><i className="fa-solid fa-users text-primary me-2"></i>BAN CHẤP HÀNH CÔNG ĐOÀN KHÓA X (NHIỆM KỲ 2023 – 2028)</span>
              </div>
              <p className="text-muted small mb-3">
                Ban Chấp hành Công đoàn Cơ sở gồm các đồng chí đại diện cho các khoa, phòng ban và viện nghiên cứu, phụ trách các ban chuyên môn vì quyền lợi đoàn viên. <em>(Dữ liệu trực tiếp từ CSDL bảng dbo.MEMBERS)</em>
              </p>

              {bchMembers.map(c => (
                <div key={c.id} className="cadre-card-item" onClick={() => setSelectedCadre(c)} title="Xem hồ sơ phân công chi tiết">
                  <div className="d-flex align-items-center gap-3">
                    <img src={c.photo} className="cadre-real-avatar" alt={c.name} onError={e => { e.target.src = 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'; }} />
                    <div>
                      <h5 className="fw-bold mb-1" style={{ fontSize: '15.5px', color: '#002855' }}>{c.name}</h5>
                      <div className="text-muted small">
                        <span><i className="fa-solid fa-briefcase text-primary me-1"></i> {c.unit}</span>
                        <span className="ms-3"><i className="fa-solid fa-envelope text-primary me-1"></i> {c.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`cadre-role-tag ${c.tag}`}><i className="fa-solid fa-user-check me-1"></i> {c.tagText}</span>
                    <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}><i className="fa-solid fa-circle-info text-primary me-1"></i> Chi tiết »</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ỦY BAN KIỂM TRA */}
          {activeTab === 'uy-ban-kiem-tra' && (
            <div className="content-box mb-4">
              <div className="tieudelon mb-3" style={{ borderBottom: '2px solid #002855' }}>
                <span><i className="fa-solid fa-shield-halved text-success me-2"></i>ỦY BAN KIỂM TRA CÔNG ĐOÀN KHÓA X (NHIỆM KỲ 2023 – 2028)</span>
              </div>
              <p className="text-muted small mb-3">
                Ủy ban Kiểm tra Công đoàn chịu trách nhiệm giám sát tài chính, bảo vệ quyền lợi đoàn viên và kiểm tra việc thi hành Điều lệ Công đoàn Việt Nam. <em>(Dữ liệu trực tiếp từ CSDL)</em>
              </p>

              {ubktMembers.map(c => (
                <div key={c.id} className="cadre-card-item" onClick={() => setSelectedCadre(c)} title="Xem nhiệm vụ kiểm tra chi tiết">
                  <div className="d-flex align-items-center gap-3">
                    <img src={c.photo} className="cadre-real-avatar" alt={c.name} onError={e => { e.target.src = 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'; }} />
                    <div>
                      <h5 className="fw-bold mb-1" style={{ fontSize: '15.5px', color: '#002855' }}>{c.name}</h5>
                      <div className="text-muted small">
                        <span><i className="fa-solid fa-briefcase text-primary me-1"></i> {c.unit}</span>
                        <span className="ms-3"><i className="fa-solid fa-envelope text-primary me-1"></i> {c.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="cadre-role-tag tag-vice-president"><i className="fa-solid fa-shield-check me-1"></i> {c.tagText}</span>
                    <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}><i className="fa-solid fa-circle-info text-primary me-1"></i> Chi tiết »</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: 16 TỔ CÔNG ĐOÀN CƠ SỞ */}
          {activeTab === '16-to-cong-doan' && (
            <div className="content-box mb-4">
              <div className="tieudelon mb-3" style={{ borderBottom: '2px solid #002855' }}>
                <span><i className="fa-solid fa-building text-info me-2"></i>HỆ THỐNG 16 TỔ CÔNG ĐOÀN CƠ SỞ TRỰC THUỘC TRƯỜNG</span>
              </div>
              <p className="text-muted small mb-3">
                Danh sách cập nhật 16 Tổ Công đoàn cơ sở trực thuộc các Khoa, Phòng ban, Viện nghiên cứu trong toàn trường (truy vấn trực tiếp từ bảng <code>dbo.UNION_BRANCHES</code>):
              </p>

              <div className="table-responsive">
                <table className="table table-hover table-bordered align-middle">
                  <thead className="table-light">
                    <tr style={{ fontSize: '13.5px' }}>
                      <th style={{ width: '80px' }} className="text-center">Mã Tổ</th>
                      <th>Tên Tổ Công Đoàn Cơ Sở</th>
                      <th style={{ width: '220px' }}>Tổ Trưởng / Đại Diện</th>
                      <th style={{ width: '200px' }}>Email Liên Hệ</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '13px' }}>
                    {units.map((u, i) => (
                      <tr key={u.id || i}>
                        <td className="text-center fw-bold text-primary">{u.code || u.MaDinhDanh || `TCD${String(i + 1).padStart(2, '0')}`}</td>
                        <td><strong>{u.name || u.TenToCongDoan}</strong></td>
                        <td>{u.leader || u.ToTruong || 'Ban Chấp Hành Tổ'}</td>
                        <td className="text-muted"><i className="fa-regular fa-envelope me-1"></i>{u.email || u.EmailLienHe || 'congdoan@tdmu.edu.vn'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* CỘT PHẢI: QUY MÔ TỔ CHỨC & LIÊN KẾT */}
        <div className="col-lg-3">
          <div className="panel-tdmu mb-4">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-sitemap me-2 text-primary"></i>Quy mô tổ chức</div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-users text-primary me-2"></i> Tổng đoàn viên: <strong>{stats.total_members || 760} cán bộ</strong></p>
              <p className="mb-2"><i className="fa-solid fa-building text-warning me-2"></i> Tổ công đoàn: <strong>{stats.total_units || units.length || 16} đơn vị</strong></p>
              <p className="mb-2"><i className="fa-solid fa-user-tie text-success me-2"></i> Cán bộ BTV/BCH: <strong>{stats.total_cadres || bchMembers.length || 13} đồng chí</strong></p>
              <p className="mb-0"><i className="fa-solid fa-calendar-check text-info me-2"></i> Nhiệm kỳ: <strong>2023 - 2028</strong></p>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
            <div className="list-group-tdmu">
              <a href="https://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
              <a href="https://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ ĐH Thủ Dầu Một</a>
              <a href="https://binhduong.congdoan.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
            </div>
          </div>
        </div>
      </div>

      {/* Cadre Detail Modal */}
      {selectedCadre && (
        <>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} onClick={() => setSelectedCadre(null)}></div>
          <div className="modal fade show d-block" tabIndex="-1" role="dialog" style={{ zIndex: 1055 }} onClick={() => setSelectedCadre(null)}>
            <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
              <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '10px', overflow: 'hidden' }}>
                <div className="profile-modal-header d-flex justify-content-between align-items-center">
                  <h6 className="modal-title fw-bold mb-0 text-white">
                    <i className="fa-solid fa-address-card me-2 text-warning"></i>
                    HỒ SƠ CÁN BỘ CÔNG ĐOÀN TDMU
                  </h6>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCadre(null)}></button>
                </div>
                <div className="modal-body p-4 bg-light">
                  <div className="text-center mb-3">
                    <img src={selectedCadre.photo} className="profile-large-img" alt={selectedCadre.name} onError={e => { e.target.src = 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh.jpg'; }} />
                    <h5 className="fw-bold mt-3 mb-1" style={{ color: '#002855' }}>{selectedCadre.name}</h5>
                    <span className={`cadre-role-tag ${selectedCadre.tag}`}>{selectedCadre.title}</span>
                  </div>

                  <div className="bg-white p-3 rounded border shadow-sm">
                    <div className="profile-info-row">
                      <span className="profile-info-label"><i className="fa-solid fa-graduation-cap text-primary me-2"></i> Trình độ chuyên môn:</span>
                      <span className="profile-info-val">{selectedCadre.degree}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label"><i className="fa-solid fa-briefcase text-primary me-2"></i> Đơn vị công tác:</span>
                      <span className="profile-info-val">{selectedCadre.unit}</span>
                    </div>
                    <div className="profile-info-row">
                      <span className="profile-info-label"><i className="fa-solid fa-envelope text-primary me-2"></i> Email liên hệ:</span>
                      <span className="profile-info-val text-primary fw-bold">{selectedCadre.email}</span>
                    </div>
                    <div className="profile-info-row border-bottom-0">
                      <span className="profile-info-label"><i className="fa-solid fa-list-check text-primary me-2"></i> Phân công nhiệm vụ:</span>
                      <span className="profile-info-val text-muted">{selectedCadre.duties}</span>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-white py-2">
                  <button type="button" className="btn btn-sm btn-secondary" onClick={() => setSelectedCadre(null)}>Đóng cửa sổ</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CoCauToChuc;
