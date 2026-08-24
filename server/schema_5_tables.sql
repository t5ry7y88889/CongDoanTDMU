-- =========================================================================
-- CƠ SỞ DỮ LIỆU 5 BẢNG CỐT LÕI - CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU)
-- Chuẩn hóa quan hệ toàn vẹn dữ liệu (Primary Keys, Foreign Keys, Constraints)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS TDMU_CongDoan_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE TDMU_CongDoan_DB;

-- Xóa bảng theo đúng thứ tự phụ thuộc khóa ngoại
DROP TABLE IF EXISTS VAN_BAN;
DROP TABLE IF EXISTS TIN_TUC;
DROP TABLE IF EXISTS NHAN_SU;
DROP TABLE IF EXISTS TO_CONG_DOAN;
DROP TABLE IF EXISTS TO_CHUC;

-- -------------------------------------------------------------------------
-- 1. BẢNG TO_CHUC (Cơ cấu Ban Chấp hành & Các Ban chuyên môn cấp Trường)
-- -------------------------------------------------------------------------
CREATE TABLE TO_CHUC (
    MaToChuc INT AUTO_INCREMENT PRIMARY KEY,
    TenToChuc VARCHAR(150) NOT NULL,              -- Ban Thường vụ, Ban Chấp hành, Ủy ban Kiểm tra, Ban Nữ công...
    NhiemKy VARCHAR(50) NOT NULL,                 -- Khóa X (2023 - 2028)
    MoTaChucNang TEXT NULL,                       -- Chức năng, nhiệm vụ của ban
    ThuTuHienThi INT DEFAULT 1,                   -- Thứ tự hiển thị
    TrangThai TINYINT(1) DEFAULT 1,               -- 1: Đang hoạt động, 0: Đã kết thúc
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- 2. BẢNG TO_CONG_DOAN (Tổ Công đoàn cơ sở trực thuộc các Viện / Khoa / Phòng)
-- -------------------------------------------------------------------------
CREATE TABLE TO_CONG_DOAN (
    MaToCongDoan INT AUTO_INCREMENT PRIMARY KEY,
    MaDinhDanh VARCHAR(50) UNIQUE NOT NULL,       -- TCD_V_CNS, TCD_K_KT, TCD_P_DT...
    TenToCongDoan VARCHAR(150) NOT NULL,          -- Tổ Công đoàn Viện Công nghệ số, Tổ CĐ Khoa Kinh tế...
    ToTruong VARCHAR(100) NULL,                   -- Họ tên cán bộ Tổ trưởng
    EmailLienHe VARCHAR(100) NULL,                -- Email liên hệ của tổ
    SoDienThoai VARCHAR(20) NULL,                 -- Số điện thoại
    DiaChiVanPhong VARCHAR(150) NULL,             -- Phòng làm việc (vd: Phòng B1-204)
    TrangThai TINYINT(1) DEFAULT 1,               -- 1: Đang hoạt động, 0: Ngừng hoạt động
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- 3. BẢNG NHAN_SU (Cán bộ Ban Chấp hành, Tổ trưởng & Công đoàn viên)
-- -------------------------------------------------------------------------
CREATE TABLE NHAN_SU (
    MaNhanSu INT AUTO_INCREMENT PRIMARY KEY,
    MaToCongDoan INT NOT NULL,                    -- Mọi đoàn viên bắt buộc thuộc 1 Tổ CĐ cơ sở
    MaToChuc INT NULL,                            -- Cán bộ kiêm nhiệm thuộc Ban BCH cấp trường (nếu có)
    MaCanBo VARCHAR(50) UNIQUE NOT NULL,          -- Mã viên chức / giảng viên TDMU
    HoVaTen VARCHAR(100) NOT NULL,                -- Họ và tên
    GioiTinh ENUM('Nam', 'Nữ', 'Khác') DEFAULT 'Nam',
    NgaySinh DATE NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,           -- Email chính thức @tdmu.edu.vn (Tên đăng nhập)
    SoDienThoai VARCHAR(20) NULL,
    MatKhau VARCHAR(255) NULL,                    -- Mật khẩu tài khoản (Hash)
    HocHamHocVi VARCHAR(50) NULL,                 -- GS, PGS, TS, ThS, Cử nhân...
    ChucVuCongDoan VARCHAR(100) DEFAULT 'Đoàn viên', -- Chủ tịch, Phó Chủ tịch, UV BTV, Tổ trưởng, Đoàn viên
    ChucVuChuyenMon VARCHAR(100) NULL,            -- Trưởng khoa, Giảng viên chính, Chuyên viên
    VaiTroHeThong ENUM('Admin', 'Editor', 'Contributor', 'User') DEFAULT 'Contributor',
    TrangThai TINYINT(1) DEFAULT 1,               -- 1: Đang công tác, 0: Đã nghỉ/chuyển
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_NhanSu_ToCongDoan FOREIGN KEY (MaToCongDoan) REFERENCES TO_CONG_DOAN(MaToCongDoan) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT FK_NhanSu_ToChuc FOREIGN KEY (MaToChuc) REFERENCES TO_CHUC(MaToChuc) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- 4. BẢNG TIN_TUC (Bài viết truyền thông, Thông báo, Phong trào thi đua)
-- -------------------------------------------------------------------------
CREATE TABLE TIN_TUC (
    MaTinTuc INT AUTO_INCREMENT PRIMARY KEY,
    MaTacGia INT NOT NULL,                        -- Cán bộ biên soạn bài viết
    TieuDe VARCHAR(255) NOT NULL,                 -- Tiêu đề bài viết
    Slug VARCHAR(255) UNIQUE NOT NULL,            -- URL thân thiện
    ChuyenMuc VARCHAR(100) NOT NULL,              -- Tin hoạt động, Thông báo, Phong trào thi đua, Chăm lo đời sống
    TomTat TEXT NULL,                             -- Đoạn tóm tắt (Sapo)
    NoiDung LONGTEXT NOT NULL,                    -- Nội dung chi tiết bài viết (HTML)
    HinhAnhDaiDien VARCHAR(255) NULL,             -- URL ảnh bìa
    TrangThai ENUM('Draft', 'Pending', 'Approved', 'Published', 'Archived') DEFAULT 'Draft',
    LuotXem INT DEFAULT 0,                        -- Số lượt truy cập xem bài
    NgayXuatBan DATETIME NULL,                    -- Thời điểm xuất bản bài viết
    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,
    NgayCapNhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT FK_TinTuc_TacGia FOREIGN KEY (MaTacGia) REFERENCES NHAN_SU(MaNhanSu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------------------
-- 5. BẢNG VAN_BAN (Văn bản chỉ đạo, Kế hoạch, Quy chế, Biểu mẫu)
-- -------------------------------------------------------------------------
CREATE TABLE VAN_BAN (
    MaVanBan INT AUTO_INCREMENT PRIMARY KEY,
    MaNguoiDang INT NOT NULL,                     -- Cán bộ tiếp nhận & đăng tải văn bản
    SoHieuVanBan VARCHAR(100) NOT NULL,           -- Số hiệu (vd: 15/NQ-CĐ, 08/HD-CĐ, BM-01/CĐ)
    TenVanBan VARCHAR(255) NOT NULL,              -- Trích yếu nội dung văn bản
    LoaiVanBan VARCHAR(100) NOT NULL,             -- Nghị quyết, Quyết định, Kế hoạch, Hướng dẫn, Quy chế, Biểu mẫu
    CoQuanBanHanh VARCHAR(150) NOT NULL,          -- Công đoàn TDMU, LĐLĐ Tỉnh Bình Dương, Tổng LĐLĐ VN
    NgayBanHanh DATE NOT NULL,                    -- Ngày ký ban hành
    NguoiKy VARCHAR(100) NULL,                    -- Họ tên người ký văn bản
    TepDinhKem VARCHAR(255) NOT NULL,             -- Đường dẫn file (PDF/DOCX)
    GhiChu TEXT NULL,                             -- Ghi chú thêm
    NgayDang DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_VanBan_NguoiDang FOREIGN KEY (MaNguoiDang) REFERENCES NHAN_SU(MaNhanSu) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;
