import React, { useEffect, useRef, useState } from 'react';

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

const unionUnits = [
  { id: 1, name: 'Tổ Công đoàn 1', unitName: 'Khối Phòng Ban Chức Năng 1', desc: 'Phòng Đào tạo Đại học, Phòng Sau đại học & Khảo thí', lead: 'Đ/c Nguyễn Thị Nhi', role: 'Tổ trưởng Tổ CĐ 1', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Nguyen%20Thi%20Nhi%20-%20NV.jpg', phone: '0918.370.363', email: 'tcd01@tdmu.edu.vn', members: 48, females: 26, party: 14 },
  { id: 2, name: 'Tổ Công đoàn 2', unitName: 'Khối Phòng Ban Chức Năng 2', desc: 'Phòng Công tác Sinh viên, Truyền thông & Khởi nghiệp', lead: 'Đ/c Huỳnh Thanh Thúy', role: 'Tổ trưởng Tổ CĐ 2', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/HuynhThanhThuy.jpg', phone: '0938.662.185', email: 'tcd02@tdmu.edu.vn', members: 42, females: 22, party: 12 },
  { id: 3, name: 'Tổ Công đoàn 3', unitName: 'Khối Phòng Ban Chức Năng 3', desc: 'Phòng Tổ chức Cán bộ, Hành chính - Tổng hợp & Pháp chế', lead: 'Đ/c Lê Thanh Tâm', role: 'Tổ trưởng Tổ CĐ 3', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/LeThanhTam.jpg', phone: '0945.460.712', email: 'tcd03@tdmu.edu.vn', members: 55, females: 34, party: 20 },
  { id: 4, name: 'Tổ Công đoàn 4', unitName: 'Khối Cơ Sở Vật Chất', desc: 'Phòng Quản trị Thiết bị, Dự án Đầu tư & Trạm Y tế', lead: 'Đ/c Ngô Hương Hoa', role: 'Tổ trưởng Tổ CĐ 4', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/NgoHuongHoa.jpg', phone: '0792.122.291', email: 'tcd04@tdmu.edu.vn', members: 39, females: 15, party: 11 },
  { id: 5, name: 'Tổ Công đoàn 5', unitName: 'Khối Tài Chính & Kế Hoạch', desc: 'Phòng Kế hoạch Tài chính & Ban Quản lý Thu - Chi', lead: 'Đ/c Nguyễn Thị Hương', role: 'Tổ trưởng Tổ CĐ 5', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/NguyenThiHuong.jpg', phone: '0387.840.422', email: 'tcd05@tdmu.edu.vn', members: 35, females: 24, party: 10 },
  { id: 6, name: 'CĐBP Khoa Sư phạm', unitName: 'Công đoàn bộ phận Khoa Sư phạm', desc: 'Khoa Sư phạm, Giáo dục Mầm non, Giáo dục Tiểu học', lead: 'Đ/c Ngô Thị Kiều Oanh', role: 'Chủ tịch CĐBP Khoa Sư phạm', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/NgoThiKieuOanh.jpg', phone: '0915.854.251', email: 'oanhntk@tdmu.edu.vn', members: 62, females: 45, party: 19 },
  { id: 7, name: 'CĐBP Trường Kinh tế Tài chính', unitName: 'Công đoàn bộ phận Trường Kinh tế Tài chính', desc: 'Khoa Quản trị Kinh doanh, Tài chính - Ngân hàng, Kế toán - Kiểm toán', lead: 'Đ/c Hồ Thị Hà', role: 'Chủ tịch CĐBP Trường KTTC', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/HoThiHa.png', phone: '0909.528.522', email: 'haht@tdmu.edu.vn', members: 58, females: 38, party: 18 },
  { id: 8, name: 'CĐBP Trường Luật & QLPT', unitName: 'Công đoàn bộ phận Trường Luật và Quản lý phát triển', desc: 'Khoa Luật, Quản lý Nhà nước, Quản trị Nhân lực', lead: 'Đ/c Đỗ Mạnh Tuấn', role: 'Chủ tịch CĐBP Trường Luật', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/DoManhTuan.jpg', phone: '0908.184.560', email: 'tuandm@tdmu.edu.vn', members: 45, females: 25, party: 15 },
  { id: 9, name: 'Tổ CĐ Viện Công nghệ số', unitName: 'Viện Đào tạo CNTT, Chuyển đổi số & Trí tuệ nhân tạo', desc: 'Khoa Công nghệ Thông tin, Kỹ thuật Phần mềm, Hệ thống Thông tin', lead: 'ThS. Hồ Ngọc Trung Kiên', role: 'Tổ trưởng CĐ Viện CNS', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/HoNgocTrungKien.jpg', phone: '0977.797.378', email: 'kienhnt@tdmu.edu.vn', members: 52, females: 28, party: 16 },
  { id: 10, name: 'Tổ CĐ Viện Đào tạo Ngoại ngữ', unitName: 'Viện Đào tạo Ngoại ngữ & Hợp tác Quốc tế', desc: 'Ngành Ngôn ngữ Anh, Ngôn ngữ Hàn, Ngôn ngữ Trung, Ngôn ngữ Nhật', lead: 'Đ/c Âu Minh Triết', role: 'Tổ trưởng CĐ Viện Ngoại ngữ', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/AuMinhTriet.jpg', phone: '0918.875.507', email: 'trietam@tdmu.edu.vn', members: 50, females: 38, party: 14 },
  { id: 11, name: 'Tổ CĐ Viện Kỹ thuật Công nghệ', unitName: 'Viện Kỹ thuật Công nghệ & Cơ Điện tử', desc: 'Ngành Công nghệ Kỹ thuật Điện - Điện tử, Kỹ thuật Cơ điện tử, Ô tô', lead: 'Đ/c Trần Thị Thanh', role: 'Tổ trưởng CĐ Viện KTCN', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/TranThiThanh.jpg', phone: '0975.483.404', email: 'thanhtt@tdmu.edu.vn', members: 46, females: 18, party: 14 },
  { id: 12, name: 'Tổ CĐ Viện Đào tạo Kiến trúc', unitName: 'Viện Đào tạo Kiến trúc, Xây dựng & Giao thông', desc: 'Ngành Kiến trúc, Kỹ thuật Xây dựng, Thiết kế Đồ họa, Mỹ thuật Ứng dụng', lead: 'Đ/c Phú Thị Tuyết Nga', role: 'Tổ trưởng CĐ Viện Kiến trúc', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/PhuThiTuyetNga.jpg', phone: '0913.788.800', email: 'ngaptt@tdmu.edu.vn', members: 44, females: 22, party: 12 },
  { id: 13, name: 'Tổ CĐ Khoa Kiến thức chung', unitName: 'Khoa Khoa học Cơ bản & Lý luận Chính trị', desc: 'Bộ môn Lý luận Chính trị, Pháp luật đại cương, Toán - Lý - Hóa', lead: 'Đ/c Biện Thị Ngọc Anh', role: 'Tổ trưởng CĐ Khoa KTC', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/BienThiNgocAnh.jpg', phone: '0909.762.656', email: 'anhbtn@tdmu.edu.vn', members: 40, females: 28, party: 16 },
  { id: 14, name: 'Tổ CĐ Khoa CN Văn hóa - TT & DL', unitName: 'Khoa Công nghiệp Văn hóa, Thể thao & Du lịch', desc: 'Ngành Quản trị Dịch vụ Du lịch & Lữ hành, Quản lý Văn hóa, Thể thao', lead: 'Đ/c Nguyễn Thị Hướng', role: 'Tổ trưởng CĐ Khoa CNVHTT&DL', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/NguyenThiHuong_2.jpg', phone: '0396.902.367', email: 'huongnt@tdmu.edu.vn', members: 38, females: 26, party: 11 },
  { id: 15, name: 'Tổ CĐ Viện Đào tạo Y Dược', unitName: 'Viện Đào tạo Y Dược & Khoa học Sức khỏe', desc: 'Ngành Y đa khoa, Dược học, Điều dưỡng & Kỹ thuật Xét nghiệm Y học', lead: 'TS. Lưu Kim Lệ Hằng', role: 'Tổ trưởng CĐ Viện Y Dược', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/LeThanhTam.jpg', phone: '0918.450.184', email: 'hanglkl@tdmu.edu.vn', members: 46, females: 31, party: 13 },
  { id: 16, name: 'Tổ CĐ Trung tâm Học liệu & DV', unitName: 'Trung tâm Học liệu, CNTT & Dịch vụ Đào tạo', desc: 'Thư viện số, Trung tâm Dữ liệu Server, Ban Quản trị Ký túc xá', lead: 'Đ/c Bùi Văn Dũng', role: 'Tổ trưởng CĐ TT Học liệu', photo: 'https://congdoan.tdmu.edu.vn/img/ckeditor/Images/Triet.jpg', phone: '0979.184.221', email: 'dungbv@tdmu.edu.vn', members: 47, females: 29, party: 12 }
];

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100';

const TABS = [
  { key: 'ban-thuong-vu', label: 'Ban Thường Vụ', icon: 'fa-crown', cls: 'text-warning' },
  { key: 'ban-chap-hanh', label: 'Ban Chấp Hành (13 Đ/C)', icon: 'fa-users', cls: 'text-primary' },
  { key: 'uy-ban-kiem-tra', label: 'Ủy Ban Kiểm Tra', icon: 'fa-scale-balanced', cls: 'text-success' },
  { key: '16-to-cong-doan', label: '16 Tổ Công Đoàn Cơ Sở', icon: 'fa-sitemap', cls: 'text-danger' }
];

const CadreCard = ({ m, onClick }) => (
  <div className="cadre-card-item" onClick={() => onClick(m)} title={`Xem hồ sơ chi tiết của ${m.name}`}>
    <div className="d-flex align-items-center gap-3">
      <img src={m.photo} className="cadre-real-avatar" alt={m.name} onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }} />
      <div>
        <h5 className="fw-bold mb-1" style={{ fontSize: '15px', color: '#002855' }}>{m.name}</h5>
        <div className="text-muted small">
          <span><i className="fa-solid fa-briefcase text-primary me-1"></i> {m.unit}</span>
          <span className="ms-3"><i className="fa-solid fa-envelope text-primary me-1"></i> {m.email}</span>
        </div>
      </div>
    </div>
    <div className="text-end">
      <span className={`cadre-role-tag ${m.tag}`}>{m.tagText}</span>
      <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}><i className="fa-solid fa-circle-info text-primary me-1"></i> Chi tiết »</div>
    </div>
  </div>
);

const CoCauToChuc = () => {
  const [tab, setTab] = useState('ban-thuong-vu');
  const [stats, setStats] = useState({ total_members: 760, total_units: 16, total_boards: 5 });
  const [cadre, setCadre] = useState(null);
  const [unit, setUnit] = useState(null);
  const cadreModalRef = useRef(null);
  const unitModalRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('tab');
    if (requested && TABS.some(t => t.key === requested)) setTab(requested);

    (async () => {
      try {
        const res = await fetch('/api/org-full-tree');
        const json = await res.json();
        if (json.success && json.data && json.data.stats) setStats(json.data.stats);
      } catch {
        // Keep pre-rendered static stats.
      }
    })();
  }, []);

  useEffect(() => {
    if (cadre && cadreModalRef.current) bootstrap.Modal.getOrCreateInstance(cadreModalRef.current).show();
  }, [cadre]);

  useEffect(() => {
    if (unit && unitModalRef.current) bootstrap.Modal.getOrCreateInstance(unitModalRef.current).show();
  }, [unit]);

  return (
    <div className="container my-3">
      <div className="breadcrumb-box"><a href="/">Trang chủ</a> / <span className="text-muted">Cơ cấu tổ chức Công đoàn TDMU</span></div>

      <div className="content-box mb-4 py-3">
        <div className="doc-filter-bar mb-0 border-0 pb-0">
          {TABS.map((t) => (
            <button key={t.key} className={`doc-tab-btn${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
              <i className={`fa-solid ${t.icon} ${t.cls}`}></i> {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-9">
          {tab === 'ban-thuong-vu' && (
            <div className="content-box mb-4">
              <div className="tieudelon"><span><i className="fa-solid fa-crown text-warning me-2"></i>BAN THƯỜNG VỤ CÔNG ĐOÀN KHÓA X (NHIỆM KỲ 2023 – 2028)</span></div>
              <p className="text-muted small mb-3">Ban Thường vụ là cơ quan lãnh đạo cao nhất giữa hai kỳ họp Ban Chấp hành, trực tiếp chỉ đạo và điều hành mọi hoạt động phong trào đoàn viên. <em>(Bấm vào thẻ để xem hồ sơ phân công chi tiết)</em></p>
              {bchMembers.slice(0, 3).map((m) => <CadreCard key={m.id} m={m} onClick={setCadre} />)}
            </div>
          )}

          {tab === 'ban-chap-hanh' && (
            <div className="content-box mb-4">
              <div className="tieudelon"><span><i className="fa-solid fa-users text-primary me-2"></i>DANH SÁCH BAN CHẤP HÀNH CÔNG ĐOÀN TRƯỜNG NHIỆM KỲ 2023 - 2028 (13 ĐỒNG CHÍ)</span></div>
              <p className="text-muted small mb-3">Ban Chấp hành đại diện cho khối Đào tạo, Nghiên cứu, Hành chính và các Viện chuyên môn trực thuộc Đại học Thủ Dầu Một. <em>(Bấm vào thẻ để xem hồ sơ chi tiết)</em></p>
              {bchMembers.map((m) => <CadreCard key={m.id} m={m} onClick={setCadre} />)}
            </div>
          )}

          {tab === 'uy-ban-kiem-tra' && (
            <div className="content-box mb-4">
              <div className="tieudelon"><span><i className="fa-solid fa-scale-balanced text-success me-2"></i>ỦY BAN KIỂM TRA CÔNG ĐOÀN CƠ SỞ KHÓA X</span></div>
              <p className="text-muted small mb-3">Thực hiện nhiệm vụ giám sát việc chấp hành Điều lệ Công đoàn Việt Nam, kiểm tra tài chính công đoàn và bảo vệ quyền lợi hợp pháp chính đáng của người lao động. <em>(Bấm vào thẻ để xem phân công)</em></p>
              {ubktMembers.map((m) => <CadreCard key={m.id} m={m} onClick={setCadre} />)}
            </div>
          )}

          {tab === '16-to-cong-doan' && (
            <div className="content-box mb-4">
              <div className="tieudelon"><span><i className="fa-solid fa-sitemap text-danger me-2"></i>16 TỔ CÔNG ĐOÀN CƠ SỞ TRỰC THUỘC TDMU</span></div>
              <p className="text-muted small mb-3">Mạng lưới 16 Tổ công đoàn cơ sở bám sát các khối đào tạo và phòng ban nghiệp vụ. <em>(Bấm vào tổ để xem báo cáo nhân sự &amp; bộ môn trực thuộc)</em></p>
              {unionUnits.map((u) => (
                <div className="cadre-card-item" key={u.id} onClick={() => setUnit(u)} title={`Bấm xem thông tin chi tiết và nhân sự của ${u.name}`}>
                  <div className="d-flex align-items-center gap-3">
                    <img src={u.photo} className="cadre-real-avatar" alt={u.lead} onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }} />
                    <div>
                      <h5 className="fw-bold mb-1" style={{ fontSize: '15px', color: '#002855' }}>{u.name} - {u.desc}</h5>
                      <div className="text-muted small">
                        <span><i className="fa-solid fa-user-tie text-primary me-1"></i> {u.role}: <strong>{u.lead}</strong></span>
                        <span className="ms-3"><i className="fa-solid fa-phone text-success me-1"></i> {u.phone}</span>
                        <span className="ms-3"><i className="fa-solid fa-envelope text-primary me-1"></i> {u.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="badge bg-light text-primary border fw-bold" style={{ fontSize: '12px', padding: '5px 10px' }}>{u.members} đoàn viên</span>
                    <div className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}><i className="fa-solid fa-circle-info text-primary me-1"></i> Xem chi tiết »</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-lg-3">
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
            <div className="panel-heading-tdmu"><i className="fa-solid fa-chart-pie me-2 text-warning"></i>Quy mô tổ chức</div>
            <div className="p-3" style={{ fontSize: '13px' }}>
              <p className="mb-2"><i className="fa-solid fa-users text-primary me-2"></i> Đoàn viên: <strong>{stats.total_members} đoàn viên</strong></p>
              <p className="mb-2"><i className="fa-solid fa-sitemap text-danger me-2"></i> Tổ công đoàn: <strong>{stats.total_units} Tổ cơ sở</strong></p>
              <p className="mb-0"><i className="fa-solid fa-medal text-success me-2"></i> Ban chuyên môn: <strong>{stats.total_boards} Ban nghiệp vụ</strong></p>
            </div>
          </div>
        </div>
      </div>

      {cadre && (
        <div className="modal fade" ref={cadreModalRef} tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div className="profile-modal-header d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold" style={{ fontSize: '17px' }}><i className="fa-solid fa-id-card text-warning me-2"></i> HỒ SƠ CÁN BỘ CÔNG ĐOÀN TDMU</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="row g-4 align-items-start">
                  <div className="col-md-4 text-center">
                    <img src={cadre.photo} className="profile-large-img" alt={cadre.name} onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }} />
                    <div className="mt-3"><span className="badge" style={{ background: '#002855', color: '#FEF08A', fontSize: '12px', padding: '6px 14px' }}>{cadre.tagText.toUpperCase()}</span></div>
                  </div>
                  <div className="col-md-8">
                    <h4 className="fw-bold text-dark mb-1">{cadre.name}</h4>
                    <p className="text-primary fw-bold small mb-3">{cadre.title}</p>
                    <div className="bg-white p-3 rounded border shadow-sm">
                      <div className="profile-info-row"><span className="profile-info-label"><i className="fa-solid fa-graduation-cap text-primary me-2"></i> Học vị:</span><span className="profile-info-val">{cadre.degree}</span></div>
                      <div className="profile-info-row"><span className="profile-info-label"><i className="fa-solid fa-building text-primary me-2"></i> Đơn vị công tác:</span><span className="profile-info-val">{cadre.unit}</span></div>
                      <div className="profile-info-row"><span className="profile-info-label"><i className="fa-solid fa-briefcase text-primary me-2"></i> Nhiệm vụ phân công:</span><span className="profile-info-val">{cadre.duties}</span></div>
                      <div className="profile-info-row border-bottom-0"><span className="profile-info-label"><i className="fa-solid fa-envelope text-primary me-2"></i> Email công vụ:</span><span className="profile-info-val">{cadre.email}</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-white py-2">
                <button type="button" className="btn btn-sm btn-secondary" data-bs-dismiss="modal">Đóng cửa sổ</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {unit && (
        <div className="modal fade" ref={unitModalRef} tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
              <div className="profile-modal-header d-flex justify-content-between align-items-center" style={{ background: '#002855' }}>
                <h5 className="modal-title fw-bold text-white" style={{ fontSize: '17px' }}><i className="fa-solid fa-sitemap text-warning me-2"></i> THÔNG TIN TỔ CÔNG ĐOÀN CƠ SỞ TDMU</h5>
                <button type="button" className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div className="modal-body p-4 bg-light">
                <div className="row g-4 align-items-start">
                  <div className="col-md-4 text-center">
                    <img src={unit.photo} className="profile-large-img" alt={unit.lead} onError={(e) => { e.currentTarget.src = FALLBACK_AVATAR; }} />
                    <div className="mt-2"><span className="badge" style={{ background: '#002855', color: '#FEF08A', fontSize: '12px', padding: '6px 14px' }}>{unit.role.toUpperCase()}</span></div>
                    <h5 className="fw-bold text-dark mt-2 mb-1">{unit.lead}</h5>
                    <div className="text-muted small mb-2"><i className="fa-solid fa-phone text-success me-1"></i> <strong>{unit.phone}</strong></div>
                    <div className="text-muted small"><i className="fa-solid fa-envelope text-primary me-1"></i> {unit.email}</div>
                  </div>
                  <div className="col-md-8">
                    <h4 className="fw-bold mb-1" style={{ color: '#002855' }}>{unit.name}</h4>
                    <p className="text-muted small mb-3">{unit.desc}</p>
                    <div className="row g-2 mb-3">
                      <div className="col-4 text-center p-2 border rounded bg-white shadow-sm"><div className="fs-4 fw-bold text-primary">{unit.members}</div><div className="text-muted" style={{ fontSize: '11.5px' }}>Tổng đoàn viên</div></div>
                      <div className="col-4 text-center p-2 border rounded bg-white shadow-sm"><div className="fs-4 fw-bold text-danger">{unit.females}</div><div className="text-muted" style={{ fontSize: '11.5px' }}>Nữ đoàn viên</div></div>
                      <div className="col-4 text-center p-2 border rounded bg-white shadow-sm"><div className="fs-4 fw-bold text-success">{unit.party}</div><div className="text-muted" style={{ fontSize: '11.5px' }}>Đoàn viên Đảng viên</div></div>
                    </div>
                    <div className="bg-white p-3 rounded border shadow-sm">
                      <div className="profile-info-row"><span className="profile-info-label"><i className="fa-solid fa-building-user text-primary me-2"></i> Khối trực thuộc:</span><span className="profile-info-val">{unit.unitName}</span></div>
                      <div className="profile-info-row"><span className="profile-info-label"><i className="fa-solid fa-award text-primary me-2"></i> Thi đua khen thưởng:</span><span className="profile-info-val"><span className="badge bg-success">Loại A - Xuất sắc tiêu biểu</span></span></div>
                      <div className="profile-info-row border-bottom-0"><span className="profile-info-label"><i className="fa-solid fa-calendar-check text-primary me-2"></i> Chế độ sinh hoạt:</span><span className="profile-info-val text-muted">Định kỳ tháng theo quy chế Công đoàn Trường</span></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer bg-white py-2">
                <button type="button" className="btn btn-sm btn-secondary" data-bs-dismiss="modal">Đóng cửa sổ</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoCauToChuc;