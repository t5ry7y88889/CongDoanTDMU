import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const bchMembers = [
  { id: 1, name: 'TS. Lê Thị Kim Út', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/images/Picture1.jpg', title: 'Chủ tịch Công đoàn Trường', degree: 'Tiến sĩ Quản lý', unit: 'Phòng Quản lý Khoa học', email: 'utltk@tdmu.edu.vn', duties: 'Phụ trách chung công tác Công đoàn, trực tiếp chỉ đạo kế hoạch hoạt động, tài chính và quan hệ đối ngoại.', tag: 'tag-president', tagText: 'Chủ tịch' },
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
  { id: 12, name: 'Âu Minh Triết', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Triet.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Thạc sĩ', unit: 'Phòng Quản trị Thiết bị', email: 'trietam@tdmu.edu.vn', duties: 'Phụ trách công tác bảo hộ lao động, an toàn vệ sinh cơ quan và cảnh quan môi trường.', tag: 'tag-executive', tagText: 'Ủy viên BCH' },
  { id: 13, name: 'Nguyễn Thị Thanh Thảo', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Thao.jpg', title: 'Ủy viên Ban Chấp hành', degree: 'Cử nhân', unit: 'Phòng Kế hoạch Tài chính', email: 'thaontt@tdmu.edu.vn', duties: 'Kế toán trưởng Công đoàn, quản lý thu chi tài chính và quỹ tương trợ đoàn viên.', tag: 'tag-executive', tagText: 'Ủy viên BCH' }
];

const ubktMembers = [
  { id: 2, name: 'ThS. Nguyễn Minh Danh', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Danh(1).jpg', title: 'UV. BTV, Chủ nhiệm UBKT', degree: 'Thạc sĩ', unit: 'Công đoàn Trường TDMU', email: 'danhnm@tdmu.edu.vn', duties: 'Chủ trì toàn diện công tác kiểm tra, giám sát thực hiện Điều lệ Công đoàn và tài chính cơ quan.', tag: 'tag-inspector', tagText: 'Chủ nhiệm UBKT' },
  { id: 14, name: 'ThS. Nguyễn Ngọc Hiền', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Hien.jpg', title: 'Ủy viên UBKT', degree: 'Thạc sĩ', unit: 'Phòng Thanh tra - Pháp chế', email: 'hiennn@tdmu.edu.vn', duties: 'Giám sát việc giải quyết đơn thư khiếu nại, phản ánh và quy chế dân chủ cơ sở.', tag: 'tag-vice-president', tagText: 'Ủy viên UBKT' },
  { id: 15, name: 'ThS. Nguyễn Văn Trường', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Truong.jpg', title: 'Ủy viên UBKT', degree: 'Thạc sĩ', unit: 'Phòng Khảo thí & Đảm bảo Chất lượng', email: 'truongnv@tdmu.edu.vn', duties: 'Kiểm tra tài chính, chứng từ thu chi và quản lý tài sản công đoàn định kỳ.', tag: 'tag-executive', tagText: 'Ủy viên UBKT' }
];

const btvMembers = bchMembers.slice(0, 3);

const CoCauToChuc = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabParam || 'ban-thuong-vu');
  const [selectedCadre, setSelectedCadre] = useState(null);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    fetch('/api/units')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setUnits(data.data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="container my-3">
      {/* Breadcrumb */}
      <div className="breadcrumb-box mb-3">
        <Link to="/">Trang chủ</Link> / <span className="text-muted">Cơ cấu tổ chức Công đoàn TDMU</span>
      </div>

      {/* Tabs */}
      <div className="doc-filter-bar mb-4" id="orgTabs">
        <button
          className={`doc-tab-btn ${activeTab === 'ban-thuong-vu' ? 'active' : ''}`}
          onClick={() => setActiveTab('ban-thuong-vu')}
        >
          <i className="fa-solid fa-crown text-warning me-1"></i> Ban Thường Vụ
        </button>
        <button
          className={`doc-tab-btn ${activeTab === 'ban-chap-hanh' ? 'active' : ''}`}
          onClick={() => setActiveTab('ban-chap-hanh')}
        >
          <i className="fa-solid fa-users text-primary me-1"></i> Ban Chấp Hành (13 Đ/C)
        </button>
        <button
          className={`doc-tab-btn ${activeTab === 'uy-ban-kiem-tra' ? 'active' : ''}`}
          onClick={() => setActiveTab('uy-ban-kiem-tra')}
        >
          <i className="fa-solid fa-scale-balanced text-success me-1"></i> Ủy Ban Kiểm Tra
        </button>
        <button
          className={`doc-tab-btn ${activeTab === '16-to-cong-doan' ? 'active' : ''}`}
          onClick={() => setActiveTab('16-to-cong-doan')}
        >
          <i className="fa-solid fa-sitemap text-danger me-1"></i> 16 Tổ Công Đoàn Cơ Sở
        </button>
      </div>

      <div className="row g-4">
        {/* CỘT TRÁI: NỘI DUNG TỔ CHỨC */}
        <div className="col-lg-9">
          {/* TAB 1: BAN THƯỜNG VỤ */}
          {activeTab === 'ban-thuong-vu' && (
            <div className="content-box mb-4">
              <div className="tieudelon">
                <span><i className="fa-solid fa-crown text-warning me-2"></i>BAN THƯỜNG VỤ CÔNG ĐOÀN KHÓA X (NHIỆM KỲ 2023 – 2028)</span>
              </div>
              <p className="text-muted small mb-3">
                Ban Thường vụ là cơ quan lãnh đạo cao nhất giữa hai kỳ họp Ban Chấp hành, trực tiếp chỉ đạo và điều hành mọi hoạt động phong trào đoàn viên. <em>(Bấm vào thẻ để xem hồ sơ phân công chi tiết)</em>
              </p>

              {btvMembers.map(c => (
                <div key={c.id} className="cadre-card-item" onClick={() => setSelectedCadre(c)} title="Xem hồ sơ phân công chi tiết">
                  <div className="d-flex align-items-center gap-3">
                    <img src={c.photo} className="cadre-real-avatar" alt={c.name} />
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

          {/* TAB 2: BAN CHẤP HÀNH (13 Đ/C CÓ ẢNH THẬT) */}
          {activeTab === 'ban-chap-hanh' && (
            <div className="content-box mb-4">
              <div className="tieudelon">
                <span><i className="fa-solid fa-users text-primary me-2"></i>DANH SÁCH BAN CHẤP HÀNH CÔNG ĐOÀN TRƯỜNG NHIỆM KỲ 2023 - 2028 (13 ĐỒNG CHÍ)</span>
              </div>
              <p className="text-muted small mb-3">
                Ban Chấp hành đại diện cho khối Đào tạo, Nghiên cứu, Hành chính và các Viện chuyên môn trực thuộc Đại học Thủ Dầu Một. <em>(Bấm vào thẻ để xem hồ sơ chi tiết)</em>
              </p>

              {bchMembers.map(c => (
                <div key={c.id} className="cadre-card-item" onClick={() => setSelectedCadre(c)} title="Xem hồ sơ chi tiết">
                  <div className="d-flex align-items-center gap-3">
                    <img src={c.photo} className="cadre-real-avatar" alt={c.name} />
                    <div>
                      <h5 className="fw-bold mb-1" style={{ fontSize: '15.5px', color: '#002855' }}>{c.name}</h5>
                      <div className="text-muted small">
                        <span><i className="fa-solid fa-briefcase text-primary me-1"></i> {c.title} ({c.unit})</span>
                        <span className="ms-3"><i className="fa-solid fa-envelope text-primary me-1"></i> {c.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`cadre-role-tag ${c.tag}`}>{c.tagText}</span>
                    <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}><i className="fa-solid fa-circle-info text-primary me-1"></i> Chi tiết »</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: ỦY BAN KIỂM TRA */}
          {activeTab === 'uy-ban-kiem-tra' && (
            <div className="content-box mb-4">
              <div className="tieudelon">
                <span><i className="fa-solid fa-scale-balanced text-success me-2"></i>ỦY BAN KIỂM TRA CÔNG ĐOÀN CƠ SỞ TDMU</span>
              </div>
              <p className="text-muted small mb-3">
                Ủy ban Kiểm tra thực hiện nhiệm vụ giám sát thi hành Điều lệ Công đoàn, quản lý tài chính và bảo vệ quyền lợi hợp pháp người lao động.
              </p>

              {ubktMembers.map(c => (
                <div key={c.id} className="cadre-card-item" onClick={() => setSelectedCadre(c)} title="Xem hồ sơ chi tiết">
                  <div className="d-flex align-items-center gap-3">
                    <img src={c.photo} className="cadre-real-avatar" alt={c.name} />
                    <div>
                      <h5 className="fw-bold mb-1" style={{ fontSize: '15.5px', color: '#002855' }}>{c.name}</h5>
                      <div className="text-muted small">
                        <span><i className="fa-solid fa-briefcase text-primary me-1"></i> {c.title}</span>
                        <span className="ms-3"><i className="fa-solid fa-envelope text-primary me-1"></i> {c.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className={`cadre-role-tag ${c.tag}`}>{c.tagText}</span>
                    <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}><i className="fa-solid fa-circle-info text-primary me-1"></i> Chi tiết »</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: 16 TỔ CÔNG ĐOÀN CƠ SỞ */}
          {activeTab === '16-to-cong-doan' && (
            <div className="content-box mb-4">
              <div className="tieudelon">
                <span><i className="fa-solid fa-sitemap text-danger me-2"></i>DANH SÁCH 16 TỔ CÔNG ĐOÀN BỘ PHẬN TRỰC THUỘC</span>
              </div>
              <p className="text-muted small mb-3">
                Hệ thống 16 Tổ công đoàn bộ phận tại các Viện, Khoa, Trung tâm và Phòng ban thực hiện nhiệm vụ sâu sát đến từng đoàn viên.
              </p>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle" style={{ fontSize: '13px' }}>
                  <thead className="table-primary">
                    <tr>
                      <th style={{ width: '60px', textAlign: 'center' }}>Mã</th>
                      <th>Tên Tổ Công Đoàn</th>
                      <th>Tổ Trưởng / Đại Diện</th>
                      <th>Email Liên Hệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(units.length > 0 ? units : [
                      { id: 1, code: 'TCD01', name: 'Tổ Công đoàn Viện Công nghệ số', leader: 'TS. Võ Quốc Lương', email: 'tcd_cntt@tdmu.edu.vn' },
                      { id: 2, code: 'TCD02', name: 'Tổ Công đoàn Khoa Kinh tế', leader: 'ThS. Trần Đức Hoàn', email: 'tcd_kinhte@tdmu.edu.vn' },
                      { id: 3, code: 'TCD03', name: 'Tổ Công đoàn Khoa Sư phạm', leader: 'ThS. Lê Nguyễn Xuân Lan', email: 'tcd_supham@tdmu.edu.vn' },
                      { id: 4, code: 'TCD04', name: 'Tổ Công đoàn Trường Luật và Quản lý', leader: 'ThS. Võ Nguyễn Đoan Trinh', email: 'tcd_luat@tdmu.edu.vn' },
                      { id: 5, code: 'TCD05', name: 'Tổ Công đoàn Khoa Kỹ thuật Công nghệ', leader: 'ThS. Nguyễn Võ Thành Long', email: 'tcd_ktcn@tdmu.edu.vn' },
                      { id: 6, code: 'TCD06', name: 'Tổ Công đoàn Khoa Ngoại ngữ', leader: 'ThS. Huỳnh Thanh Thúy', email: 'tcd_ngoainngu@tdmu.edu.vn' },
                      { id: 7, code: 'TCD07', name: 'Tổ Công đoàn Phòng Quản lý Khoa học', leader: 'TS. Lê Thị Kim Út', email: 'tcd_qlkh@tdmu.edu.vn' },
                      { id: 8, code: 'TCD08', name: 'Tổ Công đoàn Phòng Tổ chức Cán bộ', leader: 'ThS. Phan Nguyễn Hồng Diễm', email: 'tcd_tccb@tdmu.edu.vn' },
                      { id: 9, code: 'TCD09', name: 'Tổ Công đoàn Phòng Đào tạo Đại học', leader: 'ThS. Phú Thị Tuyết Nga', email: 'tcd_daotao@tdmu.edu.vn' },
                      { id: 10, code: 'TCD10', name: 'Tổ Công đoàn Phòng Quản trị Thiết bị', leader: 'ThS. Âu Minh Triết', email: 'tcd_qttb@tdmu.edu.vn' },
                      { id: 11, code: 'TCD11', name: 'Tổ Công đoàn Phòng Kế hoạch Tài chính', leader: 'CN. Nguyễn Thị Thanh Thảo', email: 'tcd_khtc@tdmu.edu.vn' },
                      { id: 12, code: 'TCD12', name: 'Tổ Công đoàn Phòng Công tác Sinh viên', leader: 'ThS. Nguyễn Thanh Triều', email: 'tcd_ctsv@tdmu.edu.vn' },
                      { id: 13, code: 'TCD13', name: 'Tổ Công đoàn Trung tâm Học liệu', leader: 'ThS. Hoàng Thị Lan', email: 'tcd_thuvien@tdmu.edu.vn' },
                      { id: 14, code: 'TCD14', name: 'Tổ Công đoàn Khoa Khoa học Tự nhiên', leader: 'TS. Nguyễn Hữu Dũng', email: 'tcd_khtn@tdmu.edu.vn' },
                      { id: 15, code: 'TCD15', name: 'Tổ Công đoàn Khoa Khoa học Xã hội & Nhân văn', leader: 'TS. Vũ Văn Hải', email: 'tcd_khxhnv@tdmu.edu.vn' },
                      { id: 16, code: 'TCD16', name: 'Tổ Công đoàn Khối Viện Nghiên cứu & Trạm Trại', leader: 'TS. Lê Tuấn Anh', email: 'tcd_vien@tdmu.edu.vn' }
                    ]).map((u, i) => (
                      <tr key={u.id || i}>
                        <td className="text-center fw-bold text-primary">{u.code || `TCD${String(i + 1).padStart(2, '0')}`}</td>
                        <td><strong>{u.name}</strong></td>
                        <td>{u.leader || 'Ban Chấp Hành Tổ'}</td>
                        <td className="text-muted"><i className="fa-regular fa-envelope me-1"></i>{u.email}</td>
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
              <p className="mb-2"><i className="fa-solid fa-users text-primary me-2"></i> Tổng đoàn viên: <strong>760 cán bộ</strong></p>
              <p className="mb-2"><i className="fa-solid fa-building text-warning me-2"></i> Tổ công đoàn: <strong>16 đơn vị</strong></p>
              <p className="mb-2"><i className="fa-solid fa-user-tie text-success me-2"></i> Cán bộ BTV/BCH: <strong>13 đồng chí</strong></p>
              <p className="mb-0"><i className="fa-solid fa-calendar-check text-info me-2"></i> Nhiệm kỳ: <strong>2023 - 2028</strong></p>
            </div>
          </div>

          <div className="panel-tdmu">
            <div className="panel-heading-tdmu"><i className="fa-solid fa-link me-2 text-primary"></i>Liên kết website</div>
            <div className="list-group-tdmu">
              <a href="http://tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đại học Thủ Dầu Một</a>
              <a href="http://danguy.tdmu.edu.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> Đảng Bộ ĐH Thủ Dầu Một</a>
              <a href="http://congdoanbinhduong.org.vn/" target="_blank" rel="noreferrer" className="list-group-item"><i className="fa-solid fa-chevron-right me-1 text-muted small"></i> LĐLĐ Tỉnh Bình Dương</a>
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
                    <img src={selectedCadre.photo} className="profile-large-img" alt={selectedCadre.name} />
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
