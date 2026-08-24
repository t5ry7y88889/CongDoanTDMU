-- =========================================================================
-- CƠ SỞ DỮ LIỆU 5 BẢNG CỐT LÕI - CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU)
-- Chuẩn hóa quan hệ toàn vẹn dữ liệu (MySQL / phpMyAdmin)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS TDMU_CongDoan_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE TDMU_CongDoan_DB;

DROP TABLE IF EXISTS VAN_BAN;
DROP TABLE IF EXISTS TIN_TUC;
DROP TABLE IF EXISTS NHAN_SU;
DROP TABLE IF EXISTS TO_CONG_DOAN;
DROP TABLE IF EXISTS TO_CHUC;

-- 1. BẢNG TO_CHUC
CREATE TABLE TO_CHUC (
    MaToChuc INT AUTO_INCREMENT PRIMARY KEY,
    TenToChuc VARCHAR(150) NOT NULL,
    NhiemKy VARCHAR(50) NOT NULL,
    MoTaChucNang TEXT NULL,
    ThuTuHienThi INT DEFAULT 1,
    TrangThai TINYINT(1) DEFAULT 1,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. BẢNG TO_CONG_DOAN (16 Tổ Công đoàn chính thức của TDMU)
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
) ENGINE=InnoDB;

-- 3. BẢNG NHAN_SU
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
) ENGINE=InnoDB;

-- 4. BẢNG TIN_TUC
CREATE TABLE TIN_TUC (
    MaTinTuc INT AUTO_INCREMENT PRIMARY KEY,
    MaTacGia INT NOT NULL,
    TieuDe VARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE NOT NULL,
    ChuyenMuc VARCHAR(100) NOT NULL,
    TomTat TEXT NULL,
    NoiDung LONGTEXT NOT NULL,
    HinhAnhDaiDien VARCHAR(255) NULL,
    TrangThai ENUM('Draft', 'Pending', 'Approved', 'Published', 'Archived') DEFAULT 'Draft',
    LuotXem INT DEFAULT 0,
    NgayXuatBan DATETIME NULL,
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_TinTuc_TacGia FOREIGN KEY (MaTacGia) REFERENCES NHAN_SU(MaNhanSu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- 5. BẢNG VAN_BAN
CREATE TABLE VAN_BAN (
    MaVanBan INT AUTO_INCREMENT PRIMARY KEY,
    MaNguoiDang INT NOT NULL,
    SoHieuVanBan VARCHAR(100) NOT NULL,
    TenVanBan VARCHAR(255) NOT NULL,
    LoaiVanBan VARCHAR(100) NOT NULL,
    CoQuanBanHanh VARCHAR(150) NOT NULL,
    NgayBanHanh DATE NOT NULL,
    NguoiKy VARCHAR(100) NULL,
    TepDinhKem VARCHAR(255) NOT NULL,
    GhiChu TEXT NULL,
    NgayDang DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_VanBan_NguoiDang FOREIGN KEY (MaNguoiDang) REFERENCES NHAN_SU(MaNhanSu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =========================================================================
-- DỮ LIỆU MẪU CHUẨN THỰC TẾ 16 TỔ CÔNG ĐOÀN TDMU
-- =========================================================================

INSERT INTO TO_CHUC (TenToChuc, NhiemKy, MoTaChucNang, ThuTuHienThi) VALUES
('Ban Thường vụ', 'Nhiệm kỳ 2023 - 2028', 'Lãnh đạo, điều hành toàn diện hoạt động Công đoàn giữa hai kỳ họp BCH', 1),
('Ban Chấp hành', 'Nhiệm kỳ 2023 - 2028', 'Cơ quan lãnh đạo cao nhất của Công đoàn cơ sở TDMU', 2),
('Ủy ban Kiểm tra', 'Nhiệm kỳ 2023 - 2028', 'Kiểm tra việc chấp hành Điều lệ Công đoàn và quản lý tài chính', 3),
('Ban Nữ công', 'Nhiệm kỳ 2023 - 2028', 'Phụ trách phong trào nữ cán bộ giảng viên Giỏi việc trường - Đảm việc nhà', 4),
('Ban Tuyên giáo - Thi đua', 'Nhiệm kỳ 2023 - 2028', 'Phụ trách công tác truyền thông, học tập chính trị và phong trào thi đua', 5);

INSERT INTO TO_CONG_DOAN (MaDinhDanh, TenToCongDoan, ToTruong, EmailLienHe, DiaChiVanPhong) VALUES
('TCD_01', 'Công đoàn 1', 'Đ/c Nguyễn Văn A', 'tcd01@tdmu.edu.vn', 'Phòng A1-101'),
('TCD_02', 'Công đoàn 2', 'Đ/c Trần Thị B', 'tcd02@tdmu.edu.vn', 'Phòng A1-102'),
('TCD_03', 'Công đoàn 3', 'Đ/c Lê Văn C', 'tcd03@tdmu.edu.vn', 'Phòng A1-103'),
('TCD_04', 'Công đoàn 4', 'Đ/c Nguyễn Thị Hương', 'tcd04@tdmu.edu.vn', 'Phòng A1-104'),
('TCD_KCNVH', 'Khoa Công nghiệp Văn hóa', 'Đ/c Phạm Văn D', 'tcd_cnvh@tdmu.edu.vn', 'Phòng B2-201'),
('TCD_KNN', 'Khoa Ngoại ngữ', 'Đ/c Hoàng Thị E', 'tcd_ngoaingu@tdmu.edu.vn', 'Phòng B1-305'),
('TCD_KKTXD', 'Khoa Kiến trúc - Xây dựng', 'Đ/c Vũ Văn F', 'tcd_ktxd@tdmu.edu.vn', 'Phòng B2-302'),
('TCD_VKTCN', 'Viện Kỹ thuật công nghệ', 'Đ/c Đặng Văn G', 'tcd_ktcn@tdmu.edu.vn', 'Phòng B1-102'),
('TCD_VCNS', 'Viện Công nghệ số', 'Đ/c Hồ Ngọc Trung Kiên', 'tcd_cns@tdmu.edu.vn', 'Phòng B1-204'),
('TCD_VCNXBV', 'Viện Công nghệ xanh và bền vững', 'Đ/c Bùi Thị H', 'tcd_cnxbv@tdmu.edu.vn', 'Phòng B1-208'),
('TCD_TLQL', 'Trường Luật và Quản lý', 'Đ/c Huỳnh Thị Lệ Kha', 'tcd_luat@tdmu.edu.vn', 'Phòng B3-101'),
('TCD_SP1', 'Sư phạm 1', 'Đ/c Ngô Văn I', 'tcd_sp1@tdmu.edu.vn', 'Phòng C1-201'),
('TCD_SP2', 'Sư phạm 2', 'Đ/c Đỗ Thị K', 'tcd_sp2@tdmu.edu.vn', 'Phòng C1-202'),
('TCD_KTTC1', 'Kinh tế tài chính 1', 'Đ/c Trương Văn L', 'tcd_kttc1@tdmu.edu.vn', 'Phòng B2-101'),
('TCD_KTTC2', 'Kinh tế tài chính 2', 'Đ/c Nguyễn Thụy Bảo Khuyên', 'tcd_kttc2@tdmu.edu.vn', 'Phòng B2-102'),
('TCD_KTTC3', 'Kinh tế tài chính 3', 'Đ/c Phan Văn M', 'tcd_kttc3@tdmu.edu.vn', 'Phòng B2-103');

INSERT INTO NHAN_SU (MaToCongDoan, MaToChuc, MaCanBo, HoVaTen, GioiTinh, Email, HocHamHocVi, ChucVuCongDoan, ChucVuChuyenMon, VaiTroHeThong) VALUES
(9, 1, 'CB001', 'TS. Lê Thị Kim Út', 'Nữ', 'utltk@tdmu.edu.vn', 'Tiến sĩ', 'Chủ tịch Công đoàn', 'Giảng viên cao cấp', 'Admin'),
(9, 1, 'CB002', 'ThS. Võ Quốc Lương', 'Nam', 'luongvq@tdmu.edu.vn', 'Thạc sĩ', 'Ủy viên Ban Thường vụ', 'Giảng viên chính Viện CNS', 'Editor'),
(11, 3, 'CB003', 'Huỳnh Thị Lệ Kha', 'Nữ', 'khahl@tdmu.edu.vn', 'Thạc sĩ', 'Tổ trưởng CĐ Trường Luật', 'Giảng viên', 'Editor'),
(9, 5, 'CB004', 'Hồ Ngọc Trung Kiên', 'Nam', 'kienhnt@tdmu.edu.vn', 'Thạc sĩ', 'Tổ trưởng CĐ Viện CNS', 'Giảng viên', 'Editor'),
(15, NULL, 'CB005', 'Nguyễn Thụy Bảo Khuyên', 'Nữ', 'khuyenntb@tdmu.edu.vn', 'Thạc sĩ', 'Tổ trưởng CĐ KTTC 2', 'Giảng viên', 'Editor'),
(4, NULL, 'CB006', 'Nguyễn Thị Hương', 'Nữ', 'huongnt@tdmu.edu.vn', 'Cử nhân', 'Tổ trưởng Công đoàn 4', 'Chuyên viên', 'Editor'),
(9, NULL, 'CB007', 'Nguyễn Bình Dương', 'Nam', '2424802010319@student.tdmu.edu.vn', 'Cử nhân', 'Đoàn viên', 'Cộng tác viên truyền thông', 'Contributor');

INSERT INTO TIN_TUC (MaTacGia, TieuDe, Slug, ChuyenMuc, TomTat, NoiDung, HinhAnhDaiDien, TrangThai, LuotXem, NgayXuatBan) VALUES
(2, 'Công đoàn TDMU hưởng ứng phong trào Lao động giỏi - Lao động sáng tạo 2026', 'cong-doan-tdmu-huong-ung-phong-trao-lao-dong-sang-tao-2026', 'Phong trào thi đua', 'Công đoàn Trường ĐH Thủ Dầu Một tích cực phát động phong trào đổi mới sáng tạo trong giảng dạy và NCKH.', '<p>Nội dung chi tiết về phong trào thi đua sáng tạo của các cán bộ giảng viên...</p>', '/images/lao-dong-sang-tao.jpg', 'Published', 1250, '2026-08-20 08:30:00'),
(4, 'Báo cáo hoạt động Công đoàn tháng 8/2026 của Viện Công nghệ số và các Tổ Công đoàn', 'bao-cao-hoat-dong-cong-doan-thang-8-2026', 'Thông báo', 'Tổng hợp kết quả công tác tuyên truyền và chăm lo đời sống đoàn viên các Tổ Công đoàn tháng 8/2026.', '<p>Kế hoạch chi tiết và báo cáo thi đua của 16 Tổ Công đoàn toàn trường...</p>', '/images/hoi-thao.jpg', 'Published', 980, '2026-08-24 09:00:00');

INSERT INTO VAN_BAN (MaNguoiDang, SoHieuVanBan, TenVanBan, LoaiVanBan, CoQuanBanHanh, NgayBanHanh, NguoiKy, TepDinhKem) VALUES
(1, '15/NQ-CĐ', 'Nghị quyết Hội nghị Công đoàn cơ sở Trường Đại học Thủ Dầu Một lần thứ X', 'Nghị quyết', 'Công đoàn TDMU', '2025-12-25', 'TS. Lê Thị Kim Út', '/uploads/van-ban/15-NQ-CD-2025.pdf'),
(2, '08/HD-CĐ', 'Hướng dẫn đánh giá, phân loại Tổ Công đoàn và Đoàn viên xuất sắc năm học 2026', 'Hướng dẫn', 'Công đoàn TDMU', '2026-06-15', 'TS. Lê Thị Kim Út', '/uploads/van-ban/08-HD-CD-2026.pdf'),
(2, 'BM-01/CĐ', 'Mẫu phiếu Lý lịch Công đoàn viên và Đơn xin gia nhập Công đoàn TDMU (Cập nhật 2026)', 'Biểu mẫu', 'Ban Thường vụ Công đoàn TDMU', '2026-01-10', 'Ban Thường vụ', '/uploads/van-ban/BM-01-LyLichDoanVien.docx');
