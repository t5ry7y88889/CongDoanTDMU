-- =========================================================================
-- CƠ SỞ DỮ LIỆU TOÀN DIỆN 15 BẢNG (15 TABLES ENTERPRISE SCHEMA - 3NF)
-- HỆ THỐNG TRUYỀN THÔNG & QUẢN TRỊ CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU)
-- MICROSOFT SQL SERVER 2019/2022 | Server: RTX-ON\MSSQLVESE
-- Database: TDMU_TradeUnion_DB
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TDMU_TradeUnion_DB')
BEGIN
    CREATE DATABASE TDMU_TradeUnion_DB;
END
GO

USE TDMU_TradeUnion_DB;
GO

-- Xóa các bảng cũ theo thứ tự ràng buộc khóa ngoại
IF OBJECT_ID('dbo.INBOX_FEEDBACK', 'U') IS NOT NULL DROP TABLE dbo.INBOX_FEEDBACK;
IF OBJECT_ID('dbo.DON_TRO_CAP', 'U') IS NOT NULL DROP TABLE dbo.DON_TRO_CAP;
IF OBJECT_ID('dbo.PHUC_LOI', 'U') IS NOT NULL DROP TABLE dbo.PHUC_LOI;
IF OBJECT_ID('dbo.BOOKMARKS', 'U') IS NOT NULL DROP TABLE dbo.BOOKMARKS;
IF OBJECT_ID('dbo.COMMENTS', 'U') IS NOT NULL DROP TABLE dbo.COMMENTS;
IF OBJECT_ID('dbo.ARTICLE_AUDITS', 'U') IS NOT NULL DROP TABLE dbo.ARTICLE_AUDITS;
IF OBJECT_ID('dbo.USERS', 'U') IS NOT NULL DROP TABLE dbo.USERS;
IF OBJECT_ID('dbo.SCHEDULES', 'U') IS NOT NULL DROP TABLE dbo.SCHEDULES;
IF OBJECT_ID('dbo.MONTHLY_REPORTS', 'U') IS NOT NULL DROP TABLE dbo.MONTHLY_REPORTS;
IF OBJECT_ID('dbo.DOCUMENTS', 'U') IS NOT NULL DROP TABLE dbo.DOCUMENTS;
IF OBJECT_ID('dbo.ARTICLES', 'U') IS NOT NULL DROP TABLE dbo.ARTICLES;
IF OBJECT_ID('dbo.CATEGORIES', 'U') IS NOT NULL DROP TABLE dbo.CATEGORIES;
IF OBJECT_ID('dbo.NHAN_SU', 'U') IS NOT NULL DROP TABLE dbo.NHAN_SU;
IF OBJECT_ID('dbo.TO_CONG_DOAN', 'U') IS NOT NULL DROP TABLE dbo.TO_CONG_DOAN;
IF OBJECT_ID('dbo.TO_CHUC', 'U') IS NOT NULL DROP TABLE dbo.TO_CHUC;
GO

-- =========================================================================
-- NHÓM 1: 8 BẢNG QUẢN TRỊ CỐT LÕI (CORE GOVERNANCE & CONTENT)
-- =========================================================================

-- 1. BẢNG TO_CHUC (5 Ban chuyên môn cấp Trường)
CREATE TABLE dbo.TO_CHUC (
    MaToChuc INT IDENTITY(1,1) PRIMARY KEY,
    TenToChuc NVARCHAR(150) NOT NULL,
    NhiemKy NVARCHAR(50) NOT NULL DEFAULT N'Nhiệm kỳ 2023 - 2028',
    MoTaChucNang NVARCHAR(MAX) NULL,
    ThuTuHienThi INT DEFAULT 1,
    TrangThai BIT DEFAULT 1,
    NgayTao DATETIME2 DEFAULT SYSDATETIME()
);

-- 2. BẢNG TO_CONG_DOAN (16 Tổ công đoàn bộ phận)
CREATE TABLE dbo.TO_CONG_DOAN (
    MaToCongDoan INT IDENTITY(1,1) PRIMARY KEY,
    MaDinhDanh VARCHAR(50) UNIQUE NOT NULL,
    TenToCongDoan NVARCHAR(150) NOT NULL,
    ToTruong NVARCHAR(100) NULL,
    EmailLienHe VARCHAR(100) NULL,
    SoDienThoai VARCHAR(20) NULL,
    DiaChiVanPhong NVARCHAR(150) NULL,
    TrangThai BIT DEFAULT 1,
    NgayTao DATETIME2 DEFAULT SYSDATETIME()
);

-- 3. BẢNG NHAN_SU (Cán bộ giảng viên đoàn viên)
CREATE TABLE dbo.NHAN_SU (
    MaNhanSu INT IDENTITY(1,1) PRIMARY KEY,
    MaToCongDoan INT NOT NULL,
    MaToChuc INT NULL,
    MaCanBo VARCHAR(50) UNIQUE NOT NULL,
    HoVaTen NVARCHAR(100) NOT NULL,
    GioiTinh NVARCHAR(10) DEFAULT N'Nam',
    NgaySinh DATE NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    SoDienThoai VARCHAR(20) NULL,
    HocHamHocVi NVARCHAR(50) NULL,
    ChucVuCongDoan NVARCHAR(100) DEFAULT N'Đoàn viên',
    ChucVuChuyenMon NVARCHAR(100) NULL,
    TrangThai BIT DEFAULT 1,
    NgayTao DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_NhanSu_ToCongDoan FOREIGN KEY (MaToCongDoan) REFERENCES dbo.TO_CONG_DOAN(MaToCongDoan),
    CONSTRAINT FK_NhanSu_ToChuc FOREIGN KEY (MaToChuc) REFERENCES dbo.TO_CHUC(MaToChuc) ON DELETE SET NULL
);

-- 4. BẢNG CATEGORIES (Chuyên mục bài viết)
CREATE TABLE dbo.CATEGORIES (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    TenChuyenMuc NVARCHAR(100) NOT NULL,
    Slug VARCHAR(120) UNIQUE NOT NULL,
    MoTa NVARCHAR(MAX) NULL,
    ThuTu INT DEFAULT 1,
    TrangThai BIT DEFAULT 1,
    NgayTao DATETIME2 DEFAULT SYSDATETIME()
);

-- 5. BẢNG ARTICLES (Bài viết & Tòa soạn AI Đa Kênh)
CREATE TABLE dbo.ARTICLES (
    ArticleId INT IDENTITY(1,1) PRIMARY KEY,
    MaTacGia INT NOT NULL,
    CategoryId INT NULL,
    TieuDe NVARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE NOT NULL,
    TomTat NVARCHAR(MAX) NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    HinhAnhDaiDien VARCHAR(500) NULL,
    NoiDungFB NVARCHAR(MAX) NULL,
    NoiDungZalo NVARCHAR(MAX) NULL,
    VideoScript NVARCHAR(MAX) NULL,
    IsAiGenerated BIT DEFAULT 0,
    AiPrompt NVARCHAR(MAX) NULL,
    TrangThai VARCHAR(20) DEFAULT 'draft',
    LuotXem INT DEFAULT 0,
    LuotThich INT DEFAULT 0,
    NgayXuatBan DATETIME2 NULL,
    NgayTao DATETIME2 DEFAULT SYSDATETIME(),
    NgayCapNhat DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Articles_TacGia FOREIGN KEY (MaTacGia) REFERENCES dbo.NHAN_SU(MaNhanSu),
    CONSTRAINT FK_Articles_Category FOREIGN KEY (CategoryId) REFERENCES dbo.CATEGORIES(CategoryId) ON DELETE SET NULL
);

-- 6. BẢNG DOCUMENTS (Kho văn bản chỉ đạo & biểu mẫu)
CREATE TABLE dbo.DOCUMENTS (
    DocumentId INT IDENTITY(1,1) PRIMARY KEY,
    MaNguoiDang INT NOT NULL,
    SoHieuVanBan VARCHAR(100) NOT NULL,
    TenVanBan NVARCHAR(255) NOT NULL,
    LoaiVanBan VARCHAR(50) NOT NULL DEFAULT 'tuyentruyen',
    CoQuanBanHanh NVARCHAR(150) NOT NULL DEFAULT N'Ban Thường Vụ Công Đoàn TDMU',
    NgayBanHanh DATE NOT NULL,
    NguoiKy NVARCHAR(100) NULL,
    TepDinhKem VARCHAR(500) NOT NULL,
    DungLuong VARCHAR(50) DEFAULT '1.5 MB',
    LuotTai INT DEFAULT 0,
    GhiChu NVARCHAR(MAX) NULL,
    NgayDang DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Documents_NguoiDang FOREIGN KEY (MaNguoiDang) REFERENCES dbo.NHAN_SU(MaNhanSu)
);

-- 7. BẢNG MONTHLY_REPORTS (Báo cáo tháng định kỳ 16 Tổ CĐ - BM-02/CĐ)
CREATE TABLE dbo.MONTHLY_REPORTS (
    ReportId INT IDENTITY(1,1) PRIMARY KEY,
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
    NoiDungTuyenTruyen NVARCHAR(MAX) NULL,
    HoatDongKhac NVARCHAR(MAX) NULL,
    KeHoachThangToi NVARCHAR(MAX) NULL,
    KienNghiNhaTruong NVARCHAR(MAX) NULL,
    LinkMinhChung VARCHAR(500) NULL,
    TuDanhGia NVARCHAR(100) DEFAULT N'Hoàn thành tốt nhiệm vụ (Loại B)',
    BtvXepLoai NVARCHAR(100) DEFAULT N'Chờ duyệt',
    TrangThai VARCHAR(20) DEFAULT 'Submitted',
    NgayNop DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Reports_ToCongDoan FOREIGN KEY (MaToCongDoan) REFERENCES dbo.TO_CONG_DOAN(MaToCongDoan) ON DELETE CASCADE,
    CONSTRAINT FK_Reports_NguoiBaoCao FOREIGN KEY (MaNguoiBaoCao) REFERENCES dbo.NHAN_SU(MaNhanSu)
);

-- 8. BẢNG SCHEDULES (Lịch hẹn giờ xuất bản đa kênh)
CREATE TABLE dbo.SCHEDULES (
    ScheduleId INT IDENTITY(1,1) PRIMARY KEY,
    ArticleId INT NOT NULL,
    KenhXuatBan VARCHAR(50) NOT NULL DEFAULT 'Website',
    ThoiGianDang DATETIME2 NOT NULL,
    TrangThai VARCHAR(20) DEFAULT 'Pending',
    GhiChuLoi NVARCHAR(MAX) NULL,
    NgayTao DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Schedules_Articles FOREIGN KEY (ArticleId) REFERENCES dbo.ARTICLES(ArticleId) ON DELETE CASCADE
);

-- =========================================================================
-- NHÓM 2: 7 BẢNG BỔ TRỢ TƯƠNG TÁC, PHÚC LỢI & KIỂM TOÁN (INTERACTIVE PORTAL & WELFARE)
-- =========================================================================

-- 9. BẢNG USERS (Tài khoản xác thực & phân quyền 3 Role)
CREATE TABLE dbo.USERS (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    MaNhanSu INT NULL,
    Email VARCHAR(150) UNIQUE NOT NULL,
    PasswordHash VARCHAR(255) NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    VaiTro VARCHAR(20) NOT NULL DEFAULT 'Contributor',
    AvatarUrl VARCHAR(500) NULL,
    LastLoginAt DATETIME2 NULL,
    TrangThai BIT DEFAULT 1,
    NgayTao DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Users_NhanSu FOREIGN KEY (MaNhanSu) REFERENCES dbo.NHAN_SU(MaNhanSu) ON DELETE SET NULL
);

-- 10. BẢNG ARTICLE_AUDITS (Lịch sử tác nghiệp & vết duyệt bài)
CREATE TABLE dbo.ARTICLE_AUDITS (
    AuditId INT IDENTITY(1,1) PRIMARY KEY,
    ArticleId INT NOT NULL,
    UserId INT NOT NULL,
    HanhDong VARCHAR(100) NOT NULL,
    GhiChu NVARCHAR(MAX) NULL,
    IpAddress VARCHAR(45) NULL,
    NgayThucHien DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Audits_Articles FOREIGN KEY (ArticleId) REFERENCES dbo.ARTICLES(ArticleId) ON DELETE CASCADE,
    CONSTRAINT FK_Audits_Users FOREIGN KEY (UserId) REFERENCES dbo.USERS(UserId)
);

-- 11. BẢNG COMMENTS (Bình luận bài viết của đoàn viên)
CREATE TABLE dbo.COMMENTS (
    CommentId INT IDENTITY(1,1) PRIMARY KEY,
    ArticleId INT NOT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) NULL,
    ChucVu NVARCHAR(100) NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    TrangThai VARCHAR(20) DEFAULT 'approved',
    NgayTao DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Comments_Articles FOREIGN KEY (ArticleId) REFERENCES dbo.ARTICLES(ArticleId) ON DELETE CASCADE
);

-- 12. BẢNG BOOKMARKS (Tủ sách đọc sau cá nhân)
CREATE TABLE dbo.BOOKMARKS (
    BookmarkId INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT NULL,
    MaCanBo VARCHAR(50) NULL,
    ArticleId INT NOT NULL,
    TieuDe NVARCHAR(255) NULL,
    GhiChu NVARCHAR(255) NULL,
    NgayLuu DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Bookmarks_Articles FOREIGN KEY (ArticleId) REFERENCES dbo.ARTICLES(ArticleId) ON DELETE CASCADE
);

-- 13. BẢNG PHUC_LOI (Các gói chương trình phúc lợi đoàn viên)
CREATE TABLE dbo.PHUC_LOI (
    PhucLoiId INT IDENTITY(1,1) PRIMARY KEY,
    MaPhucLoi VARCHAR(50) UNIQUE NOT NULL,
    TieuDe NVARCHAR(200) NOT NULL,
    ChuyenMuc VARCHAR(50) DEFAULT 'le_tet',
    DoiTuongHuong NVARCHAR(200) NOT NULL,
    MucHoTro NVARCHAR(150) NOT NULL,
    MoTa NVARCHAR(MAX) NULL,
    Icon VARCHAR(50) DEFAULT 'fa-gift',
    TrangThai VARCHAR(20) DEFAULT 'active',
    NgayTao DATETIME2 DEFAULT SYSDATETIME()
);

-- 14. BẢNG DON_TRO_CAP (Đơn xin trợ cấp & chăm lo khó khăn)
CREATE TABLE dbo.DON_TRO_CAP (
    DonId INT IDENTITY(1,1) PRIMARY KEY,
    MaNhanSu INT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    DonVi NVARCHAR(150) NOT NULL,
    LoaiTroCap NVARCHAR(150) NOT NULL,
    SoTienDeXuat DECIMAL(15, 2) DEFAULT 0,
    LyDo NVARCHAR(MAX) NOT NULL,
    TepMinhChung VARCHAR(500) NULL,
    TrangThai VARCHAR(20) DEFAULT 'pending',
    NguoiDuyet NVARCHAR(100) NULL,
    GhiChu NVARCHAR(MAX) NULL,
    NgayNop DATETIME2 DEFAULT SYSDATETIME()
);

-- 15. BẢNG INBOX_FEEDBACK (Hòm thư góp ý & phản ánh gửi BCH)
CREATE TABLE dbo.INBOX_FEEDBACK (
    FeedbackId INT IDENTITY(1,1) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    SoDienThoai VARCHAR(20) NULL,
    DonVi NVARCHAR(150) NULL,
    ChuDe NVARCHAR(150) NOT NULL,
    TieuDe NVARCHAR(255) NOT NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    TepDinhKem VARCHAR(500) NULL,
    TrangThai VARCHAR(20) DEFAULT 'pending',
    TraLoi NVARCHAR(MAX) NULL,
    NgayGui DATETIME2 DEFAULT SYSDATETIME()
);
GO