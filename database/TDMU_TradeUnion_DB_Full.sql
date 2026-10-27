-- =========================================================================
-- CƠ SỞ DỮ LIỆU ĐỒ ÁN TOÀN DIỆN (FULL DATABASE SCRIPT: DDL + SEED DATA)
-- ĐỀ TÀI: WEBSITE TRUYỀN THÔNG & QUẢN TRỊ CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU)
-- HỆ QUẢN TRỊ CSDL: MICROSOFT SQL SERVER 2019 / 2022
-- TÊN CƠ SỞ DỮ LIỆU: TDMU_TradeUnion_DB
-- =========================================================================
-- HƯỚNG DẪN THỰC THI (1 CLICK TRONG SSMS):
-- 1. Mở SQL Server Management Studio (SSMS) và kết nối tới máy chủ SQL Server.
-- 2. Mở file script này (File -> Open -> File...).
-- 3. Bấm nút [Execute] hoặc phím tắt [F5] để chạy toàn bộ.
-- 4. Toàn bộ CSDL, 15+ bảng chuẩn 3NF và dữ liệu mẫu sẽ được tạo tự động 100%!
-- =========================================================================

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
IF OBJECT_ID('dbo.PUBLISH_LOGS', 'U') IS NOT NULL DROP TABLE dbo.PUBLISH_LOGS;
IF OBJECT_ID('dbo.TEMPLATES', 'U') IS NOT NULL DROP TABLE dbo.TEMPLATES;
IF OBJECT_ID('dbo.INBOX_FEEDBACK', 'U') IS NOT NULL DROP TABLE dbo.INBOX_FEEDBACK;
IF OBJECT_ID('dbo.AID_REQUESTS', 'U') IS NOT NULL DROP TABLE dbo.AID_REQUESTS;
IF OBJECT_ID('dbo.DON_TRO_CAP', 'U') IS NOT NULL DROP TABLE dbo.DON_TRO_CAP;
IF OBJECT_ID('dbo.WELFARE_PROGRAMS', 'U') IS NOT NULL DROP TABLE dbo.WELFARE_PROGRAMS;
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
IF OBJECT_ID('dbo.MEMBERS', 'U') IS NOT NULL DROP TABLE dbo.MEMBERS;
IF OBJECT_ID('dbo.NHAN_SU', 'U') IS NOT NULL DROP TABLE dbo.NHAN_SU;
IF OBJECT_ID('dbo.UNION_BRANCHES', 'U') IS NOT NULL DROP TABLE dbo.UNION_BRANCHES;
IF OBJECT_ID('dbo.TO_CONG_DOAN', 'U') IS NOT NULL DROP TABLE dbo.TO_CONG_DOAN;
IF OBJECT_ID('dbo.ORGANIZATIONS', 'U') IS NOT NULL DROP TABLE dbo.ORGANIZATIONS;
IF OBJECT_ID('dbo.TO_CHUC', 'U') IS NOT NULL DROP TABLE dbo.TO_CHUC;
GO

-- =========================================================================
-- NHÓM 1: 8 BẢNG QUẢN TRỊ CỐT LÕI (CORE GOVERNANCE & CONTENT)
-- =========================================================================

-- 1. BẢNG ORGANIZATIONS (5 Ban chuyên môn cấp Trường - Cũ: TO_CHUC)
CREATE TABLE dbo.ORGANIZATIONS (
    MaToChuc INT IDENTITY(1,1) PRIMARY KEY,
    TenToChuc NVARCHAR(150) NOT NULL,
    NhiemKy NVARCHAR(50) NOT NULL DEFAULT N'Nhiệm kỳ 2023 - 2028',
    MoTaChucNang NVARCHAR(MAX) NULL,
    ThuTuHienThi INT DEFAULT 1,
    TrangThai BIT DEFAULT 1,
    NgayTao DATETIME2 DEFAULT SYSDATETIME()
);

-- 2. BẢNG UNION_BRANCHES (16 Tổ công đoàn bộ phận - Cũ: TO_CONG_DOAN)
CREATE TABLE dbo.UNION_BRANCHES (
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

-- 3. BẢNG MEMBERS (Cán bộ giảng viên đoàn viên - Cũ: NHAN_SU)
CREATE TABLE dbo.MEMBERS (
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
    CONSTRAINT FK_Members_UnionBranches FOREIGN KEY (MaToCongDoan) REFERENCES dbo.UNION_BRANCHES(MaToCongDoan),
    CONSTRAINT FK_Members_Organizations FOREIGN KEY (MaToChuc) REFERENCES dbo.ORGANIZATIONS(MaToChuc) ON DELETE SET NULL
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
    LuotVoTay INT DEFAULT 0,
    NgayXuatBan DATETIME2 NULL,
    NgayTao DATETIME2 DEFAULT SYSDATETIME(),
    NgayCapNhat DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Articles_TacGia FOREIGN KEY (MaTacGia) REFERENCES dbo.MEMBERS(MaNhanSu),
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
    HieuLuc VARCHAR(20) NOT NULL DEFAULT 'con_hieu_luc',
    GhiChu NVARCHAR(MAX) NULL,
    NgayDang DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Documents_NguoiDang FOREIGN KEY (MaNguoiDang) REFERENCES dbo.MEMBERS(MaNhanSu)
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
    SoDoanVienOmDau INT DEFAULT 0,
    SoVuTaiNanLaoDong INT DEFAULT 0,
    SoCuocKiemTra INT DEFAULT 0,
    SoBuoiTuyenTruyen INT DEFAULT 0,
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
    CONSTRAINT FK_Reports_ToCongDoan FOREIGN KEY (MaToCongDoan) REFERENCES dbo.UNION_BRANCHES(MaToCongDoan) ON DELETE CASCADE,
    CONSTRAINT FK_Reports_NguoiBaoCao FOREIGN KEY (MaNguoiBaoCao) REFERENCES dbo.MEMBERS(MaNhanSu)
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
    CONSTRAINT FK_Users_NhanSu FOREIGN KEY (MaNhanSu) REFERENCES dbo.MEMBERS(MaNhanSu) ON DELETE SET NULL
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
    UserId INT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) NULL,
    ChucVu NVARCHAR(100) NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    TrangThai VARCHAR(20) DEFAULT 'approved',
    NgayTao DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Comments_Articles FOREIGN KEY (ArticleId) REFERENCES dbo.ARTICLES(ArticleId) ON DELETE CASCADE,
    CONSTRAINT FK_Comments_Users FOREIGN KEY (UserId) REFERENCES dbo.USERS(UserId) ON DELETE SET NULL
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
    CONSTRAINT FK_Bookmarks_Articles FOREIGN KEY (ArticleId) REFERENCES dbo.ARTICLES(ArticleId) ON DELETE CASCADE,
    CONSTRAINT FK_Bookmarks_Users FOREIGN KEY (UserId) REFERENCES dbo.USERS(UserId) ON DELETE SET NULL
);

-- 13. BẢNG WELFARE_PROGRAMS (Các gói chương trình phúc lợi đoàn viên - Cũ: PHUC_LOI)
CREATE TABLE dbo.WELFARE_PROGRAMS (
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

-- 14. BẢNG AID_REQUESTS (Đơn xin trợ cấp & chăm lo khó khăn - Cũ: DON_TRO_CAP)
CREATE TABLE dbo.AID_REQUESTS (
    DonId INT IDENTITY(1,1) PRIMARY KEY,
    MaNhanSu INT NULL,
    PhucLoiId INT NULL,
    HoTen NVARCHAR(100) NOT NULL,
    DonVi NVARCHAR(150) NOT NULL,
    LoaiTroCap NVARCHAR(150) NOT NULL,
    SoDienThoai VARCHAR(20) NULL,
    Email VARCHAR(100) NULL,
    SoTienDeXuat DECIMAL(15, 2) DEFAULT 0,
    SoTienDuocDuyet DECIMAL(15, 2) NULL,
    LyDo NVARCHAR(MAX) NOT NULL,
    TepMinhChung VARCHAR(500) NULL,
    TrangThai VARCHAR(20) DEFAULT 'pending',
    NguoiDuyet NVARCHAR(100) NULL,
    GhiChu NVARCHAR(MAX) NULL,
    NgayNop DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_AidRequests_Member FOREIGN KEY (MaNhanSu) REFERENCES dbo.MEMBERS(MaNhanSu) ON DELETE SET NULL,
    CONSTRAINT FK_AidRequests_Welfare FOREIGN KEY (PhucLoiId) REFERENCES dbo.WELFARE_PROGRAMS(PhucLoiId) ON DELETE SET NULL
);

-- 15. BẢNG INBOX_FEEDBACK (Hòm thư góp ý & phản ánh gửi BCH)
CREATE TABLE dbo.INBOX_FEEDBACK (
    FeedbackId INT IDENTITY(1,1) PRIMARY KEY,
    MaNhanSu INT NULL,
    NguoiXuLy INT NULL,
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
    NgayGui DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_Inbox_Member FOREIGN KEY (MaNhanSu) REFERENCES dbo.MEMBERS(MaNhanSu) ON DELETE SET NULL,
    CONSTRAINT FK_Inbox_Users FOREIGN KEY (NguoiXuLy) REFERENCES dbo.USERS(UserId) ON DELETE NO ACTION
);

-- 16. BẢNG TEMPLATES (Kho biểu mẫu nghiệp vụ & văn bản mẫu .docx/.xlsx)
CREATE TABLE dbo.TEMPLATES (
    TemplateId INT IDENTITY(1,1) PRIMARY KEY,
    MaHieu VARCHAR(50) NOT NULL,
    TenBieuMau NVARCHAR(255) NOT NULL,
    ChuyenMuc VARCHAR(50) NOT NULL DEFAULT 'doan_vien',
    TenChuyenMuc NVARCHAR(100) NULL,
    MoTa NVARCHAR(MAX) NULL,
    DinhDang VARCHAR(20) DEFAULT 'docx',
    DungLuong VARCHAR(50) DEFAULT '4.0 KB',
    DuongDanFile VARCHAR(500) NOT NULL,
    LuotTai INT DEFAULT 0,
    TrangThai BIT DEFAULT 1,
    NgayTao DATETIME2 DEFAULT SYSDATETIME()
);

-- 17. BẢNG PUBLISH_LOGS (Nhật ký phát hành đa kênh sang Website, Fanpage, Zalo OA)
CREATE TABLE dbo.PUBLISH_LOGS (
    LogId INT IDENTITY(1,1) PRIMARY KEY,
    ScheduleId INT NULL,
    ArticleId INT NOT NULL,
    Kenh VARCHAR(50) NOT NULL,
    HanhDong VARCHAR(50) NOT NULL,
    KetQua NVARCHAR(MAX) NULL,
    ThoiGianXuatBan DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT FK_PublishLogs_Articles FOREIGN KEY (ArticleId) REFERENCES dbo.ARTICLES(ArticleId) ON DELETE CASCADE
);
GO

-- =========================================================================
-- PHẦN BỔ SUNG: BẢNG QUỸ PHÚC LỢI & GIAO DỊCH (WELFARE_FUND)
-- =========================================================================
IF OBJECT_ID('dbo.WELFARE_TRANSACTIONS', 'U') IS NOT NULL DROP TABLE dbo.WELFARE_TRANSACTIONS;
IF OBJECT_ID('dbo.WELFARE_FUND', 'U') IS NOT NULL DROP TABLE dbo.WELFARE_FUND;
GO

CREATE TABLE dbo.WELFARE_FUND (
    FundId INT IDENTITY(1,1) PRIMARY KEY,
    FundName NVARCHAR(255) NOT NULL,
    CurrentBalance DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalDeposited DECIMAL(18,2) NOT NULL DEFAULT 0,
    TotalDisbursed DECIMAL(18,2) NOT NULL DEFAULT 0,
    UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE dbo.WELFARE_TRANSACTIONS (
    TransId INT IDENTITY(1,1) PRIMARY KEY,
    TransCode VARCHAR(50) NOT NULL,
    TransType VARCHAR(20) NOT NULL, -- 'deposit', 'disburse'
    Amount DECIMAL(18,2) NOT NULL,
    SourceName NVARCHAR(255) NULL,
    DecisionNo NVARCHAR(100) NULL,
    TransDate DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CreatedBy NVARCHAR(150) NULL,
    Note NVARCHAR(1000) NULL,
    RelatedDonId INT NULL
);
GO

-- =========================================================================
-- NẠP DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHUẨN ĐỒ ÁN)
-- =========================================================================

-- =========================================================================
-- DỮ LIỆU KHỞI TẠO MẪU 15 BẢNG (15 TABLES SEED DATA)
-- MICROSOFT SQL SERVER 2019/2022 | Database: TDMU_TradeUnion_DB
-- =========================================================================

USE TDMU_TradeUnion_DB;
GO

-- 1. Nạp ORGANIZATIONS (Cũ: TO_CHUC)
IF NOT EXISTS (SELECT 1 FROM dbo.ORGANIZATIONS)
BEGIN
    INSERT INTO dbo.ORGANIZATIONS (TenToChuc, NhiemKy, MoTaChucNang, ThuTuHienThi) VALUES
    (N'Ban Thường vụ', N'Nhiệm kỳ 2023 - 2028', N'Lãnh đạo, điều hành toàn diện hoạt động Công đoàn giữa hai kỳ họp BCH', 1),
    (N'Ban Chấp hành', N'Nhiệm kỳ 2023 - 2028', N'Cơ quan lãnh đạo cao nhất của Công đoàn cơ sở TDMU', 2),
    (N'Ủy ban Kiểm tra', N'Nhiệm kỳ 2023 - 2028', N'Kiểm tra việc chấp hành Điều lệ Công đoàn và quản lý tài chính', 3),
    (N'Ban Nữ công', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách phong trào nữ cán bộ giảng viên Giỏi việc trường - Đảm việc nhà', 4),
    (N'Ban Tuyên giáo - Thi đua', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách công tác truyền thông, học tập chính trị và phong trào thi đua', 5);
END
GO

-- 2. Nạp UNION_BRANCHES (Đủ 16 Tổ công đoàn bộ phận - Cũ: TO_CONG_DOAN)
IF NOT EXISTS (SELECT 1 FROM dbo.UNION_BRANCHES)
BEGIN
    INSERT INTO dbo.UNION_BRANCHES (MaDinhDanh, TenToCongDoan, ToTruong, EmailLienHe) VALUES
    ('TCD_01', N'Tổ Công đoàn 1 - Khối Hiệu Bộ', N'Đ/c Nguyễn Văn A', 'tcd01@tdmu.edu.vn'),
    ('TCD_02', N'Tổ Công đoàn 2 - Phòng Đào Tạo & Khảo Thí', N'Đ/c Trần Thị B', 'tcd02@tdmu.edu.vn'),
    ('TCD_03', N'Tổ Công đoàn 3 - Viện Công Nghệ Số', N'Đ/c Lê Văn C', 'tcd03@tdmu.edu.vn'),
    ('TCD_04', N'Tổ Công đoàn 4 - Khoa Khoa Học Tự Nhiên', N'Đ/c Nguyễn Thị Hương', 'tcd04@tdmu.edu.vn'),
    ('TCD_05', N'Tổ Công đoàn 5 - Khoa Khoa Học Xã Hội', N'Đ/c Phạm Văn Dũng', 'tcd05@tdmu.edu.vn'),
    ('TCD_06', N'Tổ Công đoàn 6 - Khoa Kinh Tế', N'Đ/c Hoàng Minh Tuấn', 'tcd06@tdmu.edu.vn'),
    ('TCD_07', N'Tổ Công đoàn 7 - Khoa Ngoại Ngữ', N'Đ/c Vũ Thị Mai', 'tcd07@tdmu.edu.vn'),
    ('TCD_08', N'Tổ Công đoàn 8 - Khoa Kỹ Thuật Công Nghệ', N'Đ/c Đặng Văn Long', 'tcd08@tdmu.edu.vn'),
    ('TCD_09', N'Tổ Công đoàn 9 - Khoa Kiến Trúc', N'Đ/c Bùi Thị Lan', 'tcd09@tdmu.edu.vn'),
    ('TCD_10', N'Tổ Công đoàn 10 - Khoa Sư Phạm', N'Đ/c Đỗ Văn Hùng', 'tcd10@tdmu.edu.vn'),
    ('TCD_11', N'Tổ Công đoàn 11 - Khoa Luật', N'Đ/c Ngô Thị Bích', 'tcd11@tdmu.edu.vn'),
    ('TCD_12', N'Tổ Công đoàn 12 - Viện Đào Tạo Sau Đại Học', N'Đ/c Dương Văn Nam', 'tcd12@tdmu.edu.vn'),
    ('TCD_13', N'Tổ Công đoàn 13 - Trung Tâm Học Liệu & CNTT', N'Đ/c Lý Thị Thu', 'tcd13@tdmu.edu.vn'),
    ('TCD_14', N'Tổ Công đoàn 14 - Phòng Công Tác Sinh Viên', N'Đ/c Trịnh Văn Phát', 'tcd14@tdmu.edu.vn'),
    ('TCD_15', N'Tổ Công đoàn 15 - Phòng Quản Trị & Cơ Sở Vật Chất', N'Đ/c Mai Thị Ngọc', 'tcd15@tdmu.edu.vn'),
    ('TCD_16', N'Tổ Công đoàn 16 - Trung Tâm Ngoại Ngữ - Tin Học', N'Đ/c Đoàn Văn Khải', 'tcd16@tdmu.edu.vn');
END
GO

-- 3. Nạp MEMBERS (17 Cán bộ BCH, UBKT và Đoàn viên tiêu biểu - Cũ: NHAN_SU)
IF NOT EXISTS (SELECT 1 FROM dbo.MEMBERS)
BEGIN
    INSERT INTO dbo.MEMBERS (MaToCongDoan, MaToChuc, MaCanBo, HoVaTen, Email, ChucVuCongDoan, HocHamHocVi) VALUES
    (1, 1, 'CB_001', N'TS. Lê Thị Kim Út', 'utltk@tdmu.edu.vn', N'Chủ tịch Công đoàn', N'Tiến sĩ Quản lý'),
    (1, 1, 'CB_002', N'ThS. Nguyễn Minh Danh', 'danhnm@tdmu.edu.vn', N'Phó Chủ tịch Công đoàn, Chủ nhiệm UBKT', N'Thạc sĩ'),
    (1, 1, 'CB_003', N'ThS. Phan Nguyễn Quỳnh Anh', 'anhpnq@tdmu.edu.vn', N'Phó Chủ tịch Công đoàn', N'Thạc sĩ'),
    (10, 2, 'CB_004', N'ThS. Lê Nguyễn Xuân Lan', 'lanlnx@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (1, 2, 'CB_009', N'ThS. Phan Nguyễn Hồng Diễm', 'diempnh@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (11, 2, 'CB_011', N'ThS. Võ Nguyễn Đoan Trinh', 'trinhvnd@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (8, 2, 'CB_015', N'ThS. Nguyễn Võ Thành Long', 'longnvt@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (6, 2, 'CB_016', N'ThS. Trần Đức Hoàn', 'hoantd@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (3, 2, 'CB_017', N'ThS. Võ Quốc Lương', 'luongvq@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (7, 2, 'CB_020', N'ThS. Huỳnh Thanh Thúy', 'thuyht@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (2, 2, 'CB_021', N'ThS. Phú Thị Tuyết Nga', 'ngaptt@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (15, 2, 'CB_022', N'ThS. Âu Minh Triết', 'trietam@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
    (1, 2, 'CB_023', N'CN. Nguyễn Thị Thanh Thảo', 'thaontt@tdmu.edu.vn', N'Ủy viên Ban Chấp hành - Kế toán trưởng', N'Cử nhân'),
    (11, 3, 'CB_024', N'ThS. Nguyễn Ngọc Hiền', 'hiennn@tdmu.edu.vn', N'Ủy viên Ủy ban Kiểm tra', N'Thạc sĩ'),
    (2, 3, 'CB_025', N'ThS. Nguyễn Văn Trường', 'truongnv@tdmu.edu.vn', N'Ủy viên Ủy ban Kiểm tra', N'Thạc sĩ'),
    (11, NULL, 'CB_018', N'ThS. Huỳnh Thị Lệ Kha', 'khatl@tdmu.edu.vn', N'Đoàn viên - Giảng viên Khoa Luật', N'Thạc sĩ'),
    (3, NULL, 'CB_019', N'ThS. Hồ Ngọc Trung Kiên', 'kienhnt@tdmu.edu.vn', N'Đoàn viên - Viện CNS', N'Thạc sĩ');
END
GO

-- 4. Nạp CATEGORIES
IF NOT EXISTS (SELECT 1 FROM dbo.CATEGORIES)
BEGIN
    INSERT INTO dbo.CATEGORIES (TenChuyenMuc, Slug, MoTa, ThuTu) VALUES
    (N'Hoạt Động Phong Trào', 'hoat-dong-phong-trao', N'Các phong trào thi đua, văn nghệ, thể thao', 1),
    (N'Thông Báo Chỉ Đạo', 'thong-bao-chi-dao', N'Thông báo, công văn chỉ đạo của Ban Thường vụ', 2),
    (N'Gương Sáng Đoàn Viên', 'guong-sang-doan-vien', N'Tuyên dương cán bộ, giảng viên điển hình tiên tiến', 3),
    (N'Chăm Lo Đời Sống', 'cham-lo-doi-song', N'Chính sách phúc lợi, trợ cấp, hỗ trợ công đoàn', 4),
    (N'Nữ Công & Gia Đình', 'nu-cong-gia-dinh', N'Phong trào giỏi việc trường - đảm việc nhà', 5);
END
GO

-- 5. Nạp ARTICLES (6 Bài Báo Thực Tế Chuẩn TDMU)
IF NOT EXISTS (SELECT 1 FROM dbo.ARTICLES)
BEGIN
    INSERT INTO dbo.ARTICLES (MaTacGia, CategoryId, TieuDe, Slug, TomTat, NoiDung, HinhAnhDaiDien, TrangThai, LuotXem, NgayXuatBan) VALUES
    (1, 1, N'Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình"', 'toa-dam-dinh-duong-lanh-manh-vi-suc-khoe-gia-dinh', N'Hướng tới Ngày Gia đình Việt Nam, Công đoàn TDMU tổ chức tọa đàm dinh dưỡng lành mạnh cho cán bộ nữ.', N'<p>Hướng tới kỷ niệm Ngày Gia đình Việt Nam, Công đoàn Trường Đại học Thủ Dầu Một đã tổ chức tọa đàm với chủ đề "Dinh dưỡng lành mạnh vì sức khỏe gia đình", thu hút đông đảo nữ cán bộ, giảng viên tham gia thảo luận về chế độ ăn uống khoa học và cân bằng cuộc sống.</p>', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800', 'published', 0, '2026-06-26'),
    (1, 2, N'Chào mừng Đại hội XIV Công đoàn Việt Nam nhiệm kỳ 2026 – 2031', 'chao-mung-dai-hoi-xiv-cong-doan-viet-nam', N'Toàn thể đoàn viên TDMU ra sức thi đua lập thành tích xuất sắc chào mừng Đại hội XIV Công đoàn Việt Nam.', N'<p>Đại hội XIV Công đoàn Việt Nam là sự kiện chính trị quan trọng của giai cấp công nhân và tổ chức Công đoàn Việt Nam. Ban Thường vụ Công đoàn trường kêu gọi toàn thể đoàn viên phát huy tinh thần trách nhiệm, sáng tạo, hoàn thành xuất sắc nhiệm vụ chính trị và chuyên môn.</p>', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'published', 0, '2026-06-01'),
    (2, 3, N'Đại học Thủ Dầu Một được tuyên dương điển hình tiên tiến trong học tập và làm theo Bác', 'tdmu-duoc-tuyen-duong-dien-hinh-tien-tien', N'Trường ĐH Thủ Dầu Một vinh dự nhận Bằng khen tập thể điển hình tiên tiến giai đoạn 2021–2026.', N'<p>Trường Đại học Thủ Dầu Một vinh dự được trao tặng Bằng khen dành cho tập thể điển hình tiên tiến có thành tích tiêu biểu giai đoạn 2021–2026 trong phong trào học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.</p>', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', 'published', 0, '2026-05-08'),
    (1, 4, N'Phiên chợ Tết “Ngựa ô đón Tết – Rước lộc về dinh” chào xuân 2026', 'phien-cho-tet-ngua-o-don-tet-2026', N'Phiên chợ Tết nghĩa tình phục vụ cán bộ viên chức và sinh viên có hoàn cảnh khó khăn.', N'<p>Trong không khí rộn ràng đón Tết Bính Ngọ 2026, Công đoàn TDMU tổ chức Phiên chợ Tết với nhiều gian hàng ẩm thực, quà tết trợ giá và các suất quà nghĩa tình cho đoàn viên, người lao động.</p>', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800', 'published', 0, '2026-01-30'),
    (1, 1, N'Công đoàn TDMU phát động phong trào thi đua "Lao động giỏi - Lao động sáng tạo" năm 2026', 'cong-doan-tdmu-phat-dong-thi-dua-2026', N'Quyết tâm thực hiện thắng lợi các mục tiêu nghiên cứu khoa học và đổi mới phương pháp giảng dạy.', N'<p>Ban Thường vụ Công đoàn Trường Đại học Thủ Dầu Một chính thức phát động đợt thi đua cao điểm năm 2026 với trọng tâm nâng cao chất lượng đào tạo và công bố quốc tế.</p>', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', 'published', 0, '2026-08-10'),
    (1, 2, N'Ban Thường vụ Công đoàn Trường Thông Báo Kết Quả Xếp Loại Thi Đua Tháng 8/2026', 'thong-bao-ket-qua-xep-loai-thi-dua-thang-8-2026', N'Khen ngợi 4 Tổ Công đoàn xuất sắc dẫn đầu đạt Loại A: Tổ 9, 11, 15 và Tổ 4.', N'<p>Căn cứ kết quả thẩm tra báo cáo công tác tháng 8/2026, Ban Thường vụ Công đoàn Trường Đại học Thủ Dầu Một biểu dương 4 Tổ Công đoàn đạt danh hiệu Loại A xuất sắc dẫn đầu phong trào thi đua.</p>', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800', 'published', 0, '2026-09-01');
END
GO

-- 6. Nạp DOCUMENTS (4 Loại văn bản)
IF NOT EXISTS (SELECT 1 FROM dbo.DOCUMENTS)
BEGIN
    INSERT INTO dbo.DOCUMENTS (MaNguoiDang, SoHieuVanBan, TenVanBan, LoaiVanBan, CoQuanBanHanh, NgayBanHanh, NguoiKy, TepDinhKem, DungLuong, LuotTai) VALUES
    (1, '18/CV-CĐCS', N'Vận động ủng hộ đồng bào bị thiệt hại do bão số 3', 'tuyentruyen', N'Ban Thường Vụ Công Đoàn TDMU', '2026-08-15', N'TS. Lê Thị Kim Út', 'uploads/documents/18_CV_CDCS_UngHoBaoSo3.pdf', '1.2 MB', 2524),
    (1, '1630/CV-BTG', N'Công văn số 1630 của Ban Tuyên giáo Tỉnh ủy Bình Dương: Cuộc thi trực tuyến Tìm hiểu Nghị quyết TW 8', 'tuyentruyen', N'Ban Tuyên Giáo Tỉnh Ủy Bình Dương', '2026-08-01', N'Trưởng Ban Tuyên Giáo', 'uploads/documents/1630_CV_BTG.pdf', '2.4 MB', 3915),
    (2, '25/KH-CĐCS', N'Kế hoạch tổ chức giải Bóng đá truyền thống Công đoàn trường ĐH Thủ Dầu Một lần thứ X', 'kehoach', N'Ban Thường Vụ Công Đoàn TDMU', '2026-07-10', N'TS. Lê Thị Kim Út', 'uploads/documents/25_KH_GiaiBongDa.pdf', '3.1 MB', 1478),
    (1, '12/2012/QH13', N'Luật Công đoàn số 12/2012/QH13 của Quốc hội nước CHXHCN Việt Nam', 'luat', N'Quốc Hội Nước CHXHCN Việt Nam', '2026-01-01', N'Chủ Tịch Quốc Hội', 'uploads/documents/Luat_Cong_Doan_2012.pdf', '5.2 MB', 8920),
    (1, '82/QĐ-LĐLĐ', N'Quyết định số 82/QĐ-LĐLĐ về việc ban hành Quy chế Khen thưởng của tổ chức công đoàn', 'quyetdinh', N'Tổng Liên Đoàn Lao Động Việt Nam', '2026-06-18', N'Đoàn Chủ Tịch Tổng LĐLĐ', 'uploads/documents/82_QD_LDLD.pdf', '2.1 MB', 4120);
END
GO

-- 7. Nạp MONTHLY_REPORTS (16 Tổ CĐ - Khớp 4 tổ Loại A: 9, 11, 15, 4)
IF NOT EXISTS (SELECT 1 FROM dbo.MONTHLY_REPORTS)
BEGIN
    INSERT INTO dbo.MONTHLY_REPORTS (MaToCongDoan, MaNguoiBaoCao, ThangBaoCao, NamBaoCao, TongSoCBNV, TongSoDoanVien, TongSoNuDoanVien, TuDanhGia, BtvXepLoai, TrangThai, LinkMinhChung) VALUES
    (9, 5, 8, 2026, 26, 26, 14, N'Hoàn thành xuất sắc nhiệm vụ (Loại A)', N'Loại A - Xuất Sắc', 'Approved', 'https://drive.google.com/drive/folders/to9_minhchung_t8'),
    (11, 6, 8, 2026, 24, 24, 15, N'Hoàn thành xuất sắc nhiệm vụ (Loại A)', N'Loại A - Xuất Sắc', 'Approved', 'https://drive.google.com/drive/folders/to11_minhchung_t8'),
    (15, 7, 8, 2026, 38, 38, 16, N'Hoàn thành xuất sắc nhiệm vụ (Loại A)', N'Loại A - Xuất Sắc', 'Approved', 'https://drive.google.com/drive/folders/to15_minhchung_t8'),
    (4, 4, 8, 2026, 30, 30, 18, N'Hoàn thành xuất sắc nhiệm vụ (Loại A)', N'Loại A - Xuất Sắc', 'Approved', 'https://drive.google.com/drive/folders/to4_minhchung_t8'),
    (1, 1, 8, 2026, 42, 42, 25, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', 'https://drive.google.com/drive/folders/to1_minhchung_t8'),
    (2, 2, 8, 2026, 28, 28, 17, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', 'https://drive.google.com/drive/folders/to2_minhchung_t8'),
    (3, 3, 8, 2026, 32, 32, 12, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', 'https://drive.google.com/drive/folders/to3_minhchung_t8'),
    (5, 1, 8, 2026, 27, 27, 16, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL),
    (6, 1, 8, 2026, 35, 35, 20, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL),
    (7, 1, 8, 2026, 31, 31, 24, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL),
    (8, 1, 8, 2026, 33, 33, 11, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL),
    (10, 1, 8, 2026, 40, 40, 26, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL),
    (12, 1, 8, 2026, 20, 20, 10, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL),
    (13, 1, 8, 2026, 22, 22, 9, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL),
    (14, 1, 8, 2026, 25, 25, 14, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL),
    (16, 1, 8, 2026, 21, 21, 13, N'Hoàn thành tốt nhiệm vụ (Loại B)', N'Loại B - Tốt', 'Approved', NULL);
END
GO

-- 8. Nạp SCHEDULES
IF NOT EXISTS (SELECT 1 FROM dbo.SCHEDULES)
BEGIN
    INSERT INTO dbo.SCHEDULES (ArticleId, KenhXuatBan, ThoiGianDang, TrangThai) VALUES
    (6, 'Website', '2026-09-01 08:00:00', 'Done'),
    (6, 'Facebook', '2026-09-01 08:30:00', 'Done'),
    (5, 'Website', '2026-08-10 09:00:00', 'Done');
END
GO

-- 9. Nạp USERS
IF NOT EXISTS (SELECT 1 FROM dbo.USERS)
BEGIN
    INSERT INTO dbo.USERS (MaNhanSu, Email, PasswordHash, HoTen, VaiTro) VALUES
    (1, 'admin@tdmu.edu.vn', '$2y$10$abcdefghijklmnopqrstuv', N'TS. Lê Thị Kim Út', 'Admin'),
    (2, 'editor@tdmu.edu.vn', '$2y$10$abcdefghijklmnopqrstuv', N'ThS. Trần Thị B', 'Editor'),
    (3, 'contributor@tdmu.edu.vn', '$2y$10$abcdefghijklmnopqrstuv', N'ThS. Lê Văn C', 'Contributor');
END
GO

-- 10. Nạp ARTICLE_AUDITS
IF NOT EXISTS (SELECT 1 FROM dbo.ARTICLE_AUDITS)
BEGIN
    INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, HanhDong, GhiChu) VALUES
    (6, 1, 'published', N'Xuất bản bài thông báo xếp loại thi đua tháng 8/2026 lên Cổng thông tin');
END
GO

-- 11. Nạp COMMENTS
IF NOT EXISTS (SELECT 1 FROM dbo.COMMENTS)
BEGIN
    INSERT INTO dbo.COMMENTS (ArticleId, HoTen, Email, ChucVu, NoiDung) VALUES
    (1, N'TS. Lê Thị Kim Út', 'admin@tdmu.edu.vn', N'Chủ tịch Công đoàn', N'Chương trình tọa đàm dinh dưỡng rất ý nghĩa và thiết thực cho sức khỏe đoàn viên toàn trường!'),
    (6, N'ThS. Huỳnh Thị Lệ Kha', 'khatl@tdmu.edu.vn', N'Khoa Luật', N'Chúc mừng các tổ xuất sắc! Tổ 11 Khoa Luật sẽ tiếp tục phấn đấu trong kỳ tới.');
END
GO

-- 12. Nạp BOOKMARKS
IF NOT EXISTS (SELECT 1 FROM dbo.BOOKMARKS)
BEGIN
    INSERT INTO dbo.BOOKMARKS (UserId, MaCanBo, ArticleId, TieuDe, GhiChu) VALUES
    (1, 'CB_001', 1, N'Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình"', N'Tài liệu tham khảo cho Ban Nữ công');
END
GO

-- 13. Nạp WELFARE_PROGRAMS (4 Gói phúc lợi chính thức - Cũ: PHUC_LOI)
IF NOT EXISTS (SELECT 1 FROM dbo.WELFARE_PROGRAMS)
BEGIN
    INSERT INTO dbo.WELFARE_PROGRAMS (MaPhucLoi, TieuDe, ChuyenMuc, DoiTuongHuong, MucHoTro, MoTa, Icon) VALUES
    ('PL-01', N'Chăm Lo Quà Tặng Dịp Lễ, Tết & Kỷ Niệm', 'le_tet', N'100% Cán bộ, Giảng viên, Đoàn viên Công đoàn', N'500.000đ - 1.500.000đ / suất', N'Tặng quà Tết Nguyên đán, Quốc tế Phụ nữ 8/3, Ngày Nhà giáo Việt Nam 20/11.', 'fa-gift'),
    ('PL-02', N'Chính Sách Chăm Lo Nữ Công & Trẻ Em', 'nu_cong', N'Nữ cán bộ sinh con & con cán bộ đạt học sinh giỏi', N'1.000.000đ - 2.000.000đ / suất', N'Hỗ trợ thai sản, khen thưởng con cán bộ đạt giải quốc gia, học bổng khuyến học.', 'fa-person-breastfeeding'),
    ('PL-03', N'Trợ Cấp Khó Khăn & Bệnh Hiểm Nghèo', 'tro_cap', N'Đoàn viên gặp tai nạn lao động hoặc bệnh hiểm nghèo', N'2.000.000đ - 10.000.000đ / đợt', N'Thăm hỏi ốm đau dài ngày, phẫu thuật, hỗ trợ kinh phí điều trị đặc biệt.', 'fa-hand-holding-medical'),
    ('PL-04', N'Hỗ Trợ Vay Vốn Quỹ Trợ Vốn CEP', 'vay_von', N'Đoàn viên có nhu cầu phát triển kinh tế gia đình', N'Tối đa 50.000.000đ / đoàn viên', N'Vay vốn lãi suất ưu đãi qua Quỹ Trợ vốn CEP của Liên đoàn Lao động tỉnh Bình Dương.', 'fa-sack-dollar');
END
GO

-- 14. Nạp AID_REQUESTS (4 Đơn đề nghị trợ cấp thực tế - Cũ: DON_TRO_CAP)
IF NOT EXISTS (SELECT 1 FROM dbo.AID_REQUESTS)
BEGIN
    INSERT INTO dbo.AID_REQUESTS (HoTen, DonVi, LoaiTroCap, SoTienDeXuat, SoTienDuocDuyet, LyDo, TrangThai, NguoiDuyet, GhiChu, SoDienThoai, Email)
    VALUES 
    (N'ThS. Huỳnh Thị Lệ Kha', N'Khoa Luật', N'Chế độ nghỉ dưỡng thai sản', 2000000, 2000000, N'Thực hiện chế độ chăm lo nữ công thai sản quý 3', 'approved', N'TS. Lê Thị Kim Út', N'Đã duyệt chi chuyển khoản qua KHTC', '0912.345.678', 'khatl@tdmu.edu.vn'),
    (N'TS. Lê Thị Kim Út', N'Phòng Quản lý Khoa học', N'Trợ cấp ốm đau nằm viện dài ngày', 2000000, 2000000, N'Hỗ trợ viện phí sau phẫu thuật', 'approved', N'Ban Thường Vụ', N'Đã duyệt chi hỗ trợ', '0918.370.363', 'utltk@tdmu.edu.vn'),
    (N'ThS. Nguyễn Văn A', N'Khối Hiệu Bộ', N'Trợ cấp khó khăn đột xuất', 1500000, 1500000, N'Gia đình bị ảnh hưởng bão lũ', 'approved', N'Ban Thường Vụ', N'Đã duyệt', '0903.111.222', 'anv@tdmu.edu.vn'),
    (N'ThS. Trần Văn Hùng', N'Khoa Sư Phạm', N'Hỗ trợ con đoàn viên vượt khó học giỏi', 1000000, NULL, N'Đơn đề nghị học bổng Nguyễn Đức Cảnh', 'pending', NULL, N'Chờ BTV xét đợt 2', '0988.222.333', 'hungtv@tdmu.edu.vn');
END
GO

-- 15. Nạp INBOX_FEEDBACK (4 Thư góp ý đoàn viên)
IF NOT EXISTS (SELECT 1 FROM dbo.INBOX_FEEDBACK)
BEGIN
    INSERT INTO dbo.INBOX_FEEDBACK (HoTen, Email, SoDienThoai, DonVi, ChuDe, TieuDe, NoiDung, TrangThai, TraLoi)
    VALUES 
    (N'ThS. Hồ Ngọc Trung Kiên', 'kienhnt@tdmu.edu.vn', '0977.797.378', N'Viện Công nghệ số', N'Đề xuất chuyển đổi số', N'Đề xuất tích hợp biểu mẫu điện tử cho 16 Tổ công đoàn', N'Kính gửi Ban Thường vụ, Viện CNS đề xuất tích hợp chữ ký số và biểu mẫu trực tuyến để giảm thiểu in ấn giấy tờ báo cáo tháng.', 'resolved', N'Ban Thường vụ đã ghi nhận và giao Ban Tuyên giáo triển khai trên Cổng thông tin mới.'),
    (N'ThS. Huỳnh Thị Lệ Kha', 'khatl@tdmu.edu.vn', '0912.345.678', N'Khoa Luật', N'Góp ý chế độ chính sách', N'Ý kiến về tăng cường khám sức khỏe định kỳ cho nữ giảng viên', N'Kính gửi BCH Công đoàn trường, đề xuất đưa thêm gói tầm soát chuyên sâu vào đợt khám sức khỏe định kỳ năm 2026.', 'resolved', N'BTV đã làm việc với Trung tâm Y tế và bổ sung gói khám theo đề xuất.'),
    (N'ThS. Trần Đức Hoàn', 'hoantd@tdmu.edu.vn', '0908.456.789', N'Khoa Kinh tế', N'Đề xuất phong trào thể thao', N'Đề xuất tổ chức giải Pickleball CBGV TDMU 2026', N'Môn Pickleball đang phát triển mạnh, đề xuất bổ sung vào chuỗi sự kiện thể thao 20/11.', 'resolved', N'BTV đã đưa vào Kế hoạch thi đấu Hội thao 20/11.'),
    (N'ThS. Lê Nguyễn Xuân Lan', 'lanlnx@tdmu.edu.vn', '0919.888.999', N'Khoa Sư phạm', N'Hoạt động Nữ công', N'Tổ chức hội thi cắm hoa ngày 20/10', N'Đề xuất tổ chức hội thi cắm hoa chủ đề Tôn vinh vẻ đẹp người phụ nữ Việt Nam.', 'pending', NULL);
END
GO

-- 16. Nạp TEMPLATES (5 Biểu mẫu nghiệp vụ chuẩn)
IF NOT EXISTS (SELECT 1 FROM dbo.TEMPLATES)
BEGIN
    INSERT INTO dbo.TEMPLATES (MaHieu, TenBieuMau, ChuyenMuc, TenChuyenMuc, MoTa, DinhDang, DungLuong, DuongDanFile, LuotTai) VALUES
    ('BM-01/CĐ', N'Phiếu Lý Lịch & Đơn Xin Gia Nhập Công Đoàn TDMU', 'doan_vien', N'Đoàn Viên & Gia Nhập', N'Dành cho Cán bộ, Giảng viên mới tuyển dụng gia nhập tổ chức công đoàn', 'docx', '4.1 KB', 'uploads/templates/BM_01_Don_Gia_Nhap_Cong_Doan.docx', 146),
    ('BM-02/CĐ', N'Mẫu Báo Cáo Hoạt Động Tháng & Chấm Điểm Thi Đua 16 Tổ', 'to_cong_doan', N'Tổ Công Đoàn Bộ Phận', N'Mẫu báo cáo định kỳ hàng tháng của Tổ trưởng gửi BTV Công đoàn trường', 'docx', '4.3 KB', 'uploads/templates/BM_02_Bao_Cao_Thang_16_To.docx', 285),
    ('BM-03/CĐ', N'Đơn Đề Nghị Trợ Cấp Khó Khăn & Thăm Hỏi Ốm Đau', 'tro_cap', N'Chăm Lo & Trợ Cấp', N'Mẫu đơn đề nghị xét duyệt kinh phí chăm lo đột xuất cho đoàn viên', 'docx', '3.9 KB', 'uploads/templates/BM_03_De_Nghi_Tro_Cap_Kho_Khan.docx', 312),
    ('BM-04/CĐ', N'Tờ Trình Khen Thưởng Đoàn Viên Tiêu Biểu & Phong Trào', 'thi_dua', N'Thi Đua Khen Thưởng', N'Mẫu đề xuất khen thưởng chuyên đề và thi đua hàng năm', 'docx', '4.0 KB', 'uploads/templates/BM_04_To_Trinh_Khen_Thuong.docx', 94),
    ('BM-05/CĐ', N'Giấy Đề Nghị Hỗ Trợ Vay Vốn Quỹ Trợ Vốn CEP Đoàn Viên', 'tro_von', N'Quỹ Trợ Vốn', N'Hỗ trợ đoàn viên, người lao động tiếp cận nguồn vốn ưu đãi không lãi suất', 'docx', '4.5 KB', 'uploads/templates/BM_05_Vay_Von_Tro_Cap.docx', 78);
END
GO

-- Nạp quỹ phúc lợi mẫu
IF NOT EXISTS (SELECT 1 FROM dbo.WELFARE_FUND)
BEGIN
    INSERT INTO dbo.WELFARE_FUND (FundName, CurrentBalance, TotalDeposited, TotalDisbursed)
    VALUES (N'Quỹ Tương Trợ & Khuyến Học Công Đoàn TDMU', 185000000, 250000000, 65000000);
END
GO

PRINT N'=================================================================';
PRINT N'✅ KHỞI TẠO CƠ SỞ DỮ LIỆU TDMU_TradeUnion_DB THÀNH CÔNG 100%!';
PRINT N'📊 Tất cả 17 bảng nghiệp vụ chuẩn 3NF và dữ liệu mẫu đã sẵn sàng.';
PRINT N'=================================================================';
GO
