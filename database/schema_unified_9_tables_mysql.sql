-- =========================================================================
-- CƠ SỞ DỮ LIỆU HỢP NHẤT TOÀN DIỆN (UNIFIED MASTER SCHEMA - 9 BẢNG 3NF)
-- HỆ THỐNG TRUYỀN THÔNG & QUẢN TRỊ CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU)
-- Tích hợp: Hành chính Đoàn thể + Tòa soạn AI Đa Kênh + Kho DAM + Kiểm toán
-- =========================================================================

CREATE DATABASE IF NOT EXISTS TDMU_CongDoan_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE TDMU_CongDoan_DB;

-- Xóa các bảng cũ theo thứ tự ràng buộc khóa ngoại
DROP TABLE IF EXISTS NHAT_KY;
DROP TABLE IF EXISTS KHO_TU_LIEU;
DROP TABLE IF EXISTS LICH_XUAT_BAN;
DROP TABLE IF EXISTS BAO_CAO_THANG;
DROP TABLE IF EXISTS VAN_BAN;
DROP TABLE IF EXISTS TIN_TUC;
DROP TABLE IF EXISTS NHAN_SU;
DROP TABLE IF EXISTS TO_CONG_DOAN;
DROP TABLE IF EXISTS TO_CHUC;

-- =========================================================================
-- PHÂN HỆ 1: QUẢN TRỊ DANH MỤC & NHÂN SỰ ĐẠI HỌC
-- =========================================================================

-- 1. BẢNG TO_CHUC (5 Ban chuyên môn cấp Trường nhiệm kỳ 5 năm)
CREATE TABLE TO_CHUC (
    MaToChuc INT AUTO_INCREMENT PRIMARY KEY,
    TenToChuc VARCHAR(150) NOT NULL,
    NhiemKy VARCHAR(50) NOT NULL DEFAULT 'Nhiệm kỳ 2023 - 2028',
    MoTaChucNang TEXT NULL,
    ThuTuHienThi INT DEFAULT 1,
    TrangThai TINYINT(1) DEFAULT 1,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. BẢNG TO_CONG_DOAN (16 Tổ Công đoàn cơ sở trực thuộc)
CREATE TABLE TO_CONG_DOAN (
    MaToCongDoan INT AUTO_INCREMENT PRIMARY KEY,
    MaDinhDanh VARCHAR(50) UNIQUE NOT NULL,
    TenToCongDoan VARCHAR(150) NOT NULL,
    ToTruong VARCHAR(100) NULL,
    EmailLienHe VARCHAR(100) NULL,
    SoDienThoai VARCHAR(20) NULL,
    DiaChiVanPhong VARCHAR(150) NULL,
    TrangThai TINYINT(1) DEFAULT 1,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. BẢNG NHAN_SU (Cán bộ đoàn viên & Phân quyền 3 Role: Admin, Editor, Contributor)
CREATE TABLE NHAN_SU (
    MaNhanSu INT AUTO_INCREMENT PRIMARY KEY,
    MaToCongDoan INT NOT NULL,
    MaToChuc INT NULL,
    MaCanBo VARCHAR(50) UNIQUE NOT NULL,
    HoVaTen VARCHAR(100) NOT NULL,
    GioiTinh ENUM('Nam', 'Nữ', 'Khác') DEFAULT 'Nam',
    NgaySinh DATE NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    SoDienThoai VARCHAR(20) NULL,
    MatKhau VARCHAR(255) NULL,
    HocHamHocVi VARCHAR(50) NULL,
    ChucVuCongDoan VARCHAR(100) DEFAULT 'Đoàn viên',
    ChucVuChuyenMon VARCHAR(100) NULL,
    VaiTroHeThong ENUM('Admin', 'Editor', 'Contributor', 'User') DEFAULT 'Contributor',
    TrangThai TINYINT(1) DEFAULT 1,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_NhanSu_ToCongDoan FOREIGN KEY (MaToCongDoan) REFERENCES TO_CONG_DOAN(MaToCongDoan) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_NhanSu_ToChuc FOREIGN KEY (MaToChuc) REFERENCES TO_CHUC(MaToChuc) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- PHÂN HỆ 2: TÒA SOẠN & BIÊN TẬP TRUYỀN THÔNG ĐA KÊNH AI
-- =========================================================================

-- 4. BẢNG TIN_TUC (Nội dung đa kênh: Website, FB, Zalo, Video Script, AI Metadata)
CREATE TABLE TIN_TUC (
    MaTinTuc INT AUTO_INCREMENT PRIMARY KEY,
    MaTacGia INT NOT NULL,
    TieuDe VARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE NOT NULL,
    ChuyenMuc VARCHAR(100) NOT NULL,
    TomTat TEXT NULL,
    NoiDung LONGTEXT NOT NULL,
    HinhAnhDaiDien VARCHAR(500) NULL,
    NoiDungFB TEXT NULL,
    NoiDungZalo TEXT NULL,
    VideoScript TEXT NULL,
    IsAiGenerated TINYINT(1) DEFAULT 0,
    AiPrompt TEXT NULL,
    TrangThai ENUM('Draft', 'Pending', 'Approved', 'Published', 'Archived') DEFAULT 'Draft',
    LuotXem INT DEFAULT 0,
    LuotThich INT DEFAULT 0,
    NgayXuatBan DATETIME NULL,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_TinTuc_TacGia FOREIGN KEY (MaTacGia) REFERENCES NHAN_SU(MaNhanSu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. BẢNG LICH_XUAT_BAN (Hẹn giờ tự động phát hành sang các nền tảng mạng xã hội)
CREATE TABLE LICH_XUAT_BAN (
    MaLichDang INT AUTO_INCREMENT PRIMARY KEY,
    MaTinTuc INT NOT NULL,
    KenhXuatBan ENUM('Website', 'Facebook', 'Zalo') NOT NULL DEFAULT 'Website',
    ThoiGianDang DATETIME NOT NULL,
    TrangThai ENUM('Pending', 'Done', 'Failed') DEFAULT 'Pending',
    GhiChuLoi TEXT NULL,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_LichDang_TinTuc FOREIGN KEY (MaTinTuc) REFERENCES TIN_TUC(MaTinTuc) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- PHÂN HỆ 3: HÀNH CHÍNH CÔNG VĂN & THI ĐUA NỘI BỘ
-- =========================================================================

-- 6. BẢNG VAN_BAN (4 nhóm công văn chuyên biệt: Tuyên truyền, Kế hoạch, Luật, Quyết định)
CREATE TABLE VAN_BAN (
    MaVanBan INT AUTO_INCREMENT PRIMARY KEY,
    MaNguoiDang INT NOT NULL,
    SoHieuVanBan VARCHAR(100) NOT NULL,
    TenVanBan VARCHAR(255) NOT NULL,
    LoaiVanBan ENUM('tuyentruyen', 'kehoach', 'luat', 'quyetdinh') NOT NULL DEFAULT 'tuyentruyen',
    CoQuanBanHanh VARCHAR(150) NOT NULL DEFAULT 'Ban Thường Vụ Công Đoàn TDMU',
    NgayBanHanh DATE NOT NULL,
    NguoiKy VARCHAR(100) NULL,
    TepDinhKem VARCHAR(500) NOT NULL,
    DungLuong VARCHAR(50) DEFAULT '1.5 MB',
    LuotTai INT DEFAULT 0,
    GhiChu TEXT NULL,
    NgayDang DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_VanBan_NguoiDang FOREIGN KEY (MaNguoiDang) REFERENCES NHAN_SU(MaNhanSu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. BẢNG BAO_CAO_THANG (Báo cáo hoạt động định kỳ & Chấm điểm thi đua 16 Tổ)
CREATE TABLE BAO_CAO_THANG (
    MaBaoCao INT AUTO_INCREMENT PRIMARY KEY,
    MaToCongDoan INT NOT NULL,
    MaNguoiBaoCao INT NOT NULL,
    ThangBaoCao INT NOT NULL,
    NamBaoCao INT NOT NULL DEFAULT 2026,
    TongSoCBNV INT DEFAULT 0,
    TongSoDoanVien INT DEFAULT 0,
    TongSoNuDoanVien INT DEFAULT 0,
    SoDoanVienKetNap INT DEFAULT 0,
    SoDoanVienUuTuSangDang INT DEFAULT 0,
    SoNguoiDuocChamLo INT DEFAULT 0,
    TongTienChamLo DECIMAL(15, 2) DEFAULT 0,
    NoiDungTuyenTruyen TEXT NULL,
    HoatDongKhac TEXT NULL,
    KeHoachThangToi TEXT NULL,
    KienNghiNhaTruong TEXT NULL,
    LinkMinhChung VARCHAR(500) NULL,
    TuDanhGia VARCHAR(100) DEFAULT 'Hoàn thành tốt nhiệm vụ (Loại B)',
    BtvXepLoai VARCHAR(100) DEFAULT 'Chờ duyệt',
    TrangThai ENUM('Draft', 'Submitted', 'Approved') DEFAULT 'Submitted',
    NgayNop DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_BaoCao_ToCongDoan FOREIGN KEY (MaToCongDoan) REFERENCES TO_CONG_DOAN(MaToCongDoan) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT FK_BaoCao_NguoiBaoCao FOREIGN KEY (MaNguoiBaoCao) REFERENCES NHAN_SU(MaNhanSu) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- PHÂN HỆ 4: KHO TƯ LIỆU SỐ (DAM) & NHẬT KÝ KIỂM TOÁN AN NINH
-- =========================================================================

-- 8. BẢNG KHO_TU_LIEU (Digital Asset Management - DAM lưu trữ ảnh/video/tài liệu gốc cho AI)
CREATE TABLE KHO_TU_LIEU (
    MaTuLieu INT AUTO_INCREMENT PRIMARY KEY,
    MaNguoiNop INT NOT NULL,
    TenFile VARCHAR(255) NOT NULL,
    DuongDan VARCHAR(500) NOT NULL,
    LoaiFile VARCHAR(50) NOT NULL DEFAULT 'image/jpeg',
    DungLuong VARCHAR(50) DEFAULT '2.0 MB',
    ChuDeTag VARCHAR(150) NULL,
    AiTriageScore INT DEFAULT 85,
    TrangThai ENUM('Active', 'Archived') DEFAULT 'Active',
    NgayTaiLen DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_KhoTuLieu_NguoiNop FOREIGN KEY (MaNguoiNop) REFERENCES NHAN_SU(MaNhanSu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. BẢNG NHAT_KY (Audit Trail & Logging truy vết trách nhiệm an ninh mạng)
CREATE TABLE NHAT_KY (
    MaNhatKy INT AUTO_INCREMENT PRIMARY KEY,
    MaNhanSu INT NULL,
    HanhDong VARCHAR(100) NOT NULL,
    ChiTiet TEXT NULL,
    IpAddress VARCHAR(45) NULL,
    TenTacGia VARCHAR(100) NULL,
    ThoiGian DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_NhatKy_NhanSu FOREIGN KEY (MaNhanSu) REFERENCES NHAN_SU(MaNhanSu) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- NẠP DỮ LIỆU MẪU CHUẨN THỰC TẾ 100% CỦA ĐẠI HỌC THỦ DẦU MỘT
-- =========================================================================

-- 1. Nạp TO_CHUC
INSERT INTO TO_CHUC (TenToChuc, NhiemKy, MoTaChucNang, ThuTuHienThi) VALUES
('Ban Thường vụ', 'Nhiệm kỳ 2023 - 2028', 'Lãnh đạo, điều hành toàn diện hoạt động Công đoàn giữa hai kỳ họp BCH', 1),
('Ban Chấp hành', 'Nhiệm kỳ 2023 - 2028', 'Cơ quan lãnh đạo cao nhất của Công đoàn cơ sở TDMU', 2),
('Ủy ban Kiểm tra', 'Nhiệm kỳ 2023 - 2028', 'Kiểm tra việc chấp hành Điều lệ Công đoàn và quản lý tài chính', 3),
('Ban Nữ công', 'Nhiệm kỳ 2023 - 2028', 'Phụ trách phong trào nữ cán bộ giảng viên Giỏi việc trường - Đảm việc nhà', 4),
('Ban Tuyên giáo - Thi đua', 'Nhiệm kỳ 2023 - 2028', 'Phụ trách công tác truyền thông, học tập chính trị và phong trào thi đua', 5);

-- 2. Nạp TO_CONG_DOAN (16 Tổ)
INSERT INTO TO_CONG_DOAN (MaDinhDanh, TenToCongDoan, ToTruong, EmailLienHe) VALUES
('TCD_01', 'Tổ Công đoàn 1 - Khối Hiệu Bộ', 'Đ/c Nguyễn Văn A', 'tcd01@tdmu.edu.vn'),
('TCD_02', 'Tổ Công đoàn 2 - Phòng Đào Tạo & Khảo Thí', 'Đ/c Trần Thị B', 'tcd02@tdmu.edu.vn'),
('TCD_03', 'Tổ Công đoàn 3 - Viện Công Nghệ Số', 'Đ/c Lê Văn C', 'tcd03@tdmu.edu.vn'),
('TCD_04', 'Tổ Công đoàn 4 - Khoa Khoa Học Tự Nhiên', 'Đ/c Nguyễn Thị Hương', 'tcd04@tdmu.edu.vn'),
('TCD_05', 'Tổ Công đoàn 5 - Khoa Khoa Học Xã Hội', 'Đ/c Phạm Văn Dũng', 'tcd05@tdmu.edu.vn'),
('TCD_06', 'Tổ Công đoàn 6 - Khoa Kinh Tế', 'Đ/c Hoàng Minh Tuấn', 'tcd06@tdmu.edu.vn'),
('TCD_07', 'Tổ Công đoàn 7 - Khoa Ngoại Ngữ', 'Đ/c Vũ Thị Mai', 'tcd07@tdmu.edu.vn'),
('TCD_08', 'Tổ Công đoàn 8 - Khoa Kỹ Thuật Công Nghệ', 'Đ/c Đặng Văn Long', 'tcd08@tdmu.edu.vn'),
('TCD_09', 'Tổ Công đoàn 9 - Khoa Kiến Trúc', 'Đ/c Bùi Thị Lan', 'tcd09@tdmu.edu.vn'),
('TCD_10', 'Tổ Công đoàn 10 - Khoa Sư Phạm', 'Đ/c Đỗ Văn Hùng', 'tcd10@tdmu.edu.vn'),
('TCD_11', 'Tổ Công đoàn 11 - Khoa Luật', 'Đ/c Ngô Thị Bích', 'tcd11@tdmu.edu.vn'),
('TCD_12', 'Tổ Công đoàn 12 - Viện Đào Tạo Sau Đại Học', 'Đ/c Dương Văn Nam', 'tcd12@tdmu.edu.vn'),
('TCD_13', 'Tổ Công đoàn 13 - Trung Tâm Học Liệu & CNTT', 'Đ/c Lý Thị Thu', 'tcd13@tdmu.edu.vn'),
('TCD_14', 'Tổ Công đoàn 14 - Phòng Công Tác Sinh Viên', 'Đ/c Trịnh Văn Phát', 'tcd14@tdmu.edu.vn'),
('TCD_15', 'Tổ Công đoàn 15 - Phòng Quản Trị & Cơ Sở Vật Chất', 'Đ/c Mai Thị Ngọc', 'tcd15@tdmu.edu.vn'),
('TCD_16', 'Tổ Công đoàn 16 - Trung Tâm Ngoại Ngữ - Tin Học', 'Đ/c Đoàn Văn Khải', 'tcd16@tdmu.edu.vn');

-- 3. Nạp NHAN_SU (Phân quyền 3 Role)
INSERT INTO NHAN_SU (MaToCongDoan, MaToChuc, MaCanBo, HoVaTen, Email, ChucVuCongDoan, VaiTroHeThong) VALUES
(1, 1, 'CB_001', 'TS. Nguyễn Văn A', 'admin@tdmu.edu.vn', 'Chủ tịch Công đoàn', 'Admin'),
(2, 5, 'CB_002', 'ThS. Trần Thị B', 'editor@tdmu.edu.vn', 'Trưởng Ban Tuyên giáo', 'Editor'),
(3, NULL, 'CB_003', 'ThS. Lê Văn C', 'contributor@tdmu.edu.vn', 'Tổ trưởng Tổ 3', 'Contributor'),
(4, 3, 'CB_004', 'ThS. Nguyễn Thị Hương', 'huongnt@tdmu.edu.vn', 'Ủy viên UBKT', 'Editor'),
(5, 4, 'CB_005', 'ThS. Phạm Văn Dũng', 'dungpv@tdmu.edu.vn', 'Trưởng Ban Nữ công', 'Contributor');

-- 4. Nạp TIN_TUC
INSERT INTO TIN_TUC (MaTacGia, TieuDe, Slug, ChuyenMuc, TomTat, NoiDung, TrangThai, LuotXem) VALUES
(1, 'Công đoàn TDMU hưởng ứng phong trào Lao động giỏi - Lao động sáng tạo 2026', 'cong-doan-tdmu-huong-ung-phong-trao-lao-dong-gioi-2026', 'PHONG TRÀO THI ĐUA', 'Phát động đợt thi đua cao điểm trong toàn thể cán bộ giảng viên.', '<p>Nội dung chi tiết phong trào thi đua...</p>', 'Published', 320),
(2, 'Báo cáo hoạt động Công đoàn tháng 8/2026 của Viện Công nghệ số và các Tổ Công đoàn', 'bao-cao-hoat-dong-cong-doan-thang-8-2026', 'THÔNG BÁO', 'Tổng kết công tác chăm lo đời sống và các hoạt động trọng tâm tháng 8.', '<p>Nội dung chi tiết báo cáo...</p>', 'Published', 185);

-- 5. Nạp LICH_XUAT_BAN
INSERT INTO LICH_XUAT_BAN (MaTinTuc, KenhXuatBan, ThoiGianDang, TrangThai) VALUES
(1, 'Website', '2026-09-02 08:00:00', 'Done'),
(1, 'Facebook', '2026-09-02 08:30:00', 'Pending'),
(2, 'Website', '2026-09-05 09:00:00', 'Pending');

-- 6. Nạp VAN_BAN (4 loại chuẩn)
INSERT INTO VAN_BAN (MaNguoiDang, SoHieuVanBan, TenVanBan, LoaiVanBan, CoQuanBanHanh, NgayBanHanh, NguoiKy, TepDinhKem, DungLuong, LuotTai) VALUES
(1, '18/CV-CĐCS', 'Vận động ủng hộ đồng bào bị thiệt hại do bão số 3', 'tuyentruyen', 'Ban Thường Vụ Công Đoàn TDMU', '2026-08-15', 'TS. Nguyễn Văn A', 'uploads/documents/18_CV_CDCS_UngHoBaoSo3.pdf', '1.2 MB', 2524),
(1, '1630/CV-BTG', 'Công văn số 1630 của Ban Tuyên giáo Tỉnh ủy Bình Dương: Cuộc thi trực tuyến Tìm hiểu Nghị quyết TW 8', 'tuyentruyen', 'Ban Tuyên Giáo Tỉnh Ủy', '2026-08-01', 'Trưởng Ban Tuyên Giáo', 'uploads/documents/1630_CV_BTG.pdf', '2.4 MB', 3915),
(2, '25/KH-CĐCS', 'Kế hoạch tổ chức giải Bóng đá truyền thống Công đoàn trường ĐH Thủ Dầu Một lần thứ X', 'kehoach', 'BTV Công Đoàn TDMU', '2026-07-10', 'TS. Nguyễn Văn A', 'uploads/documents/25_KH_GiaiBongDa.pdf', '3.1 MB', 1478),
(1, '12/2012/QH13', 'Luật Công đoàn số 12/2012/QH13 của Quốc hội nước CHXHCN Việt Nam', 'luat', 'Quốc Hội Nước CHXHCN Việt Nam', '2026-01-01', 'Chủ Tịch Quốc Hội', 'uploads/documents/Luat_Cong_Doan_2012.pdf', '5.2 MB', 8920),
(1, '82/QĐ-LĐLĐ', 'Quyết định số 82/QĐ-LĐLĐ về việc ban hành Quy chế Khen thưởng của tổ chức công đoàn', 'quyetdinh', 'Tổng Liên Đoàn Lao Động Việt Nam', '2026-06-18', 'Đoàn Chủ Tịch Tổng LĐLĐ', 'uploads/documents/82_QD_LDLD.pdf', '2.1 MB', 4120);

-- 7. Nạp BAO_CAO_THANG (16 Tổ)
INSERT INTO BAO_CAO_THANG (MaToCongDoan, MaNguoiBaoCao, ThangBaoCao, NamBaoCao, TongSoCBNV, TongSoDoanVien, TongSoNuDoanVien, TuDanhGia, BtvXepLoai, TrangThai) VALUES
(1, 1, 8, 2026, 30, 30, 18, 'Hoàn thành xuất sắc nhiệm vụ (Loại A)', 'Loại A - Xuất Sắc', 'Approved'),
(2, 2, 8, 2026, 25, 25, 15, 'Hoàn thành xuất sắc nhiệm vụ (Loại A)', 'Loại A - Xuất Sắc', 'Approved'),
(3, 3, 8, 2026, 28, 28, 12, 'Hoàn thành tốt nhiệm vụ (Loại B)', 'Loại B - Tốt', 'Approved'),
(4, 4, 8, 2026, 22, 22, 14, 'Hoàn thành tốt nhiệm vụ (Loại B)', 'Chờ duyệt', 'Submitted');

-- 8. Nạp KHO_TU_LIEU (Digital Assets)
INSERT INTO KHO_TU_LIEU (MaNguoiNop, TenFile, DuongDan, LoaiFile, DungLuong, ChuDeTag, AiTriageScore) VALUES
(1, 'Dai_Hoi_Cong_Doan_2026_Banner.jpg', 'images/banner.jpg', 'image/jpeg', '1.8 MB', 'Đại hội Công đoàn', 98),
(2, 'Hoi_Thao_Dinh_Duong_Suc_Khoe.jpg', 'images/hoi_thao_dinh_duong.jpg', 'image/jpeg', '2.4 MB', 'Tọa đàm sức khỏe', 92),
(3, 'Ky_Yeu_Thanh_Tich_2021_2026.pdf', 'uploads/documents/Ky_Yeu_2026.pdf', 'application/pdf', '12.5 MB', 'Điển hình tiên tiến', 95);

-- 9. Nạp NHAT_KY
INSERT INTO NHAT_KY (MaNhanSu, HanhDong, ChiTiet, TenTacGia) VALUES
(1, 'SYSTEM_INIT', 'Khởi tạo hệ thống quản trị truyền thông công đoàn TDMU chuẩn hợp nhất 9 bảng', 'TS. Nguyễn Văn A'),
(2, 'ARTICLE_APPROVED', 'Phê duyệt bài viết #1: Phong trào thi đua 2026', 'ThS. Trần Thị B'),
(3, 'REPORT_SUBMITTED', 'Tổ Công đoàn 3 nộp báo cáo hoạt động tháng 8/2026', 'ThS. Lê Văn C');
