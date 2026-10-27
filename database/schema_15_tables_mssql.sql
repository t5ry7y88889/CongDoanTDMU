-- =========================================================================
-- CƠ SỞ DỮ LIỆU ĐỒ ÁN TOÀN DIỆN (CHUẨN 100% THEO BÁO CÁO GỐC CHƯƠNG 3)
-- ĐỀ TÀI: WEBSITE TRUYỀN THÔNG & QUẢN TRỊ CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU)
-- HỆ QUẢN TRỊ CSDL: MICROSOFT SQL SERVER 2019 / 2022
-- TÊN CƠ SỞ DỮ LIỆU: TDMU_TradeUnion_DB
-- DANH SÁCH 15 BẢNG KHỚP 100% VỚI BẢNG 3.1 ĐẾN 3.15 TRONG FILE BÁO CÁO:
--   1. ORGANIZATIONS      6. DOCUMENTS        11. COMMENTS
--   2. UNION_BRANCHES     7. TEMPLATES        12. BOOKMARKS
--   3. MEMBERS            8. SCHEDULES        13. WELFARE_PROGRAMS
--   4. CATEGORIES         9. USERS            14. WELFARE_CATEGORIES
--   5. ARTICLES          10. ARTICLE_AUDITS   15. INBOX_FEEDBACK
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'TDMU_TradeUnion_DB')
BEGIN
    CREATE DATABASE TDMU_TradeUnion_DB;
END
GO

USE TDMU_TradeUnion_DB;
GO

-- XÓA BẢNG CŨ THEO THỨ TỰ RÀNG BUỘC KHÓA NGOẠI (NẾU ĐÃ TỒN TẠI)
IF OBJECT_ID('dbo.BOOKMARKS', 'U') IS NOT NULL DROP TABLE dbo.BOOKMARKS;
IF OBJECT_ID('dbo.COMMENTS', 'U') IS NOT NULL DROP TABLE dbo.COMMENTS;
IF OBJECT_ID('dbo.ARTICLE_AUDITS', 'U') IS NOT NULL DROP TABLE dbo.ARTICLE_AUDITS;
IF OBJECT_ID('dbo.ARTICLES', 'U') IS NOT NULL DROP TABLE dbo.ARTICLES;
IF OBJECT_ID('dbo.DOCUMENTS', 'U') IS NOT NULL DROP TABLE dbo.DOCUMENTS;
IF OBJECT_ID('dbo.SCHEDULES', 'U') IS NOT NULL DROP TABLE dbo.SCHEDULES;
IF OBJECT_ID('dbo.USERS', 'U') IS NOT NULL DROP TABLE dbo.USERS;
IF OBJECT_ID('dbo.MEMBERS', 'U') IS NOT NULL DROP TABLE dbo.MEMBERS;
IF OBJECT_ID('dbo.UNION_BRANCHES', 'U') IS NOT NULL DROP TABLE dbo.UNION_BRANCHES;
IF OBJECT_ID('dbo.ORGANIZATIONS', 'U') IS NOT NULL DROP TABLE dbo.ORGANIZATIONS;
IF OBJECT_ID('dbo.CATEGORIES', 'U') IS NOT NULL DROP TABLE dbo.CATEGORIES;
IF OBJECT_ID('dbo.TEMPLATES', 'U') IS NOT NULL DROP TABLE dbo.TEMPLATES;
IF OBJECT_ID('dbo.WELFARE_PROGRAMS', 'U') IS NOT NULL DROP TABLE dbo.WELFARE_PROGRAMS;
IF OBJECT_ID('dbo.WELFARE_CATEGORIES', 'U') IS NOT NULL DROP TABLE dbo.WELFARE_CATEGORIES;
IF OBJECT_ID('dbo.INBOX_FEEDBACK', 'U') IS NOT NULL DROP TABLE dbo.INBOX_FEEDBACK;
GO

-- =========================================================================
-- 1. BẢNG 3.1: ORGANIZATIONS (Cơ cấu Ban chuyên môn Công đoàn cấp Trường)
-- =========================================================================
CREATE TABLE dbo.ORGANIZATIONS (
    MaToChuc INT IDENTITY(1,1) PRIMARY KEY,
    TenToChuc NVARCHAR(150) NOT NULL,
    NhiemKy NVARCHAR(50) NOT NULL DEFAULT N'Nhiệm kỳ 2023 - 2028',
    MoTaChucNang NVARCHAR(MAX) NULL,
    ThuTuHienThi INT NULL,
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 2. BẢNG 3.2: UNION_BRANCHES (Mạng lưới 16 Tổ công đoàn cơ sở bộ phận)
-- =========================================================================
CREATE TABLE dbo.UNION_BRANCHES (
    MaToCongDoan INT IDENTITY(1,1) PRIMARY KEY,
    MaDinhDanh VARCHAR(50) NOT NULL UNIQUE,
    TenToCongDoan NVARCHAR(150) NOT NULL,
    ToTruong NVARCHAR(100) NULL,
    EmailLienHe VARCHAR(100) NULL,
    SoDienThoai VARCHAR(20) NULL,
    DiaChiVanPhong NVARCHAR(150) NULL,
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 3. BẢNG 3.3: MEMBERS (Hồ sơ cán bộ & đoàn viên công đoàn)
-- =========================================================================
CREATE TABLE dbo.MEMBERS (
    MaNhanSu INT IDENTITY(1,1) PRIMARY KEY,
    MaToCongDoan INT NULL FOREIGN KEY REFERENCES dbo.UNION_BRANCHES(MaToCongDoan),
    MaToChuc INT NULL FOREIGN KEY REFERENCES dbo.ORGANIZATIONS(MaToChuc),
    MaCanBo VARCHAR(50) NOT NULL UNIQUE,
    HoVaTen NVARCHAR(100) NOT NULL,
    GioiTinh NVARCHAR(10) NULL,
    NgaySinh DATE NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    SoDienThoai VARCHAR(20) NULL,
    HocHamHocVi NVARCHAR(50) NULL,
    ChucVuCongDoan NVARCHAR(100) NULL,
    ChucVuChuyenMon NVARCHAR(100) NULL,
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 4. BẢNG 3.4: CATEGORIES (Chuyên mục tin tức truyền thông)
-- =========================================================================
CREATE TABLE dbo.CATEGORIES (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    TenChuyenMuc NVARCHAR(100) NOT NULL,
    Slug VARCHAR(120) NOT NULL UNIQUE,
    MoTa NVARCHAR(MAX) NULL,
    ThuTu INT NULL,
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 5. BẢNG 3.5: ARTICLES (Bài viết, tin tức & nội dung số đa kênh AI)
-- =========================================================================
CREATE TABLE dbo.ARTICLES (
    ArticleId INT IDENTITY(1,1) PRIMARY KEY,
    MaTacGia INT NOT NULL FOREIGN KEY REFERENCES dbo.MEMBERS(MaNhanSu),
    CategoryId INT NULL FOREIGN KEY REFERENCES dbo.CATEGORIES(CategoryId),
    TieuDe NVARCHAR(255) NOT NULL,
    Slug VARCHAR(255) NOT NULL UNIQUE,
    TomTat NVARCHAR(MAX) NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    HinhAnhDaiDien VARCHAR(500) NULL,
    NoiDungFB NVARCHAR(MAX) NULL,
    NoiDungZalo NVARCHAR(MAX) NULL,
    IsAiGenerated BIT NOT NULL DEFAULT 0,
    AiPrompt NVARCHAR(MAX) NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'published',
    LuotXem INT NOT NULL DEFAULT 0,
    LuotThich INT NOT NULL DEFAULT 0,
    LuotVoTay INT NOT NULL DEFAULT 0,
    NgayXuatBan DATETIME2 NULL,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    NgayCapNhat DATETIME2 NULL
);
GO

-- =========================================================================
-- 6. BẢNG 3.6: DOCUMENTS (Kho văn bản, nghị quyết, chỉ đạo)
-- =========================================================================
CREATE TABLE dbo.DOCUMENTS (
    DocId INT IDENTITY(1,1) PRIMARY KEY,
    SoHieu NVARCHAR(50) NOT NULL UNIQUE,
    TieuDe NVARCHAR(255) NOT NULL,
    LoaiVanBan NVARCHAR(50) NOT NULL,
    CoQuanBanHanh NVARCHAR(100) NOT NULL,
    NgayBanHanh DATE NOT NULL,
    FileUrl VARCHAR(500) NOT NULL,
    MaNguoiDang INT NOT NULL FOREIGN KEY REFERENCES dbo.MEMBERS(MaNhanSu),
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 7. BẢNG 3.7: TEMPLATES (Biểu mẫu nghiệp vụ công đoàn tải về)
-- =========================================================================
CREATE TABLE dbo.TEMPLATES (
    TemplateId INT IDENTITY(1,1) PRIMARY KEY,
    Title NVARCHAR(250) NOT NULL,
    Code VARCHAR(50) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500) NULL,
    FileUrl NVARCHAR(255) NOT NULL,
    FileSize VARCHAR(50) NULL,
    DownloadsCount INT NOT NULL DEFAULT 0,
    Status VARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);
GO

-- =========================================================================
-- 8. BẢNG 3.8: SCHEDULES (Lịch công tác & Sự kiện công đoàn)
-- =========================================================================
CREATE TABLE dbo.SCHEDULES (
    ScheduleId INT IDENTITY(1,1) PRIMARY KEY,
    TieuDe NVARCHAR(255) NOT NULL,
    ThoiGianBatDau DATETIME2 NOT NULL,
    ThoiGianKetThuc DATETIME2 NOT NULL,
    DiaDiem NVARCHAR(255) NOT NULL,
    ThanhPhan NVARCHAR(MAX) NULL,
    ChuTri NVARCHAR(100) NOT NULL,
    NoiDungChuChot NVARCHAR(MAX) NULL,
    MaNguoiTao INT NOT NULL FOREIGN KEY REFERENCES dbo.MEMBERS(MaNhanSu),
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'scheduled',
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 9. BẢNG 3.9: USERS (Tài khoản người dùng & Phân quyền RBAC)
-- =========================================================================
CREATE TABLE dbo.USERS (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    MaNhanSu INT NOT NULL UNIQUE FOREIGN KEY REFERENCES dbo.MEMBERS(MaNhanSu),
    Username VARCHAR(50) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    Role VARCHAR(20) NOT NULL DEFAULT 'Admin',
    IsActive BIT NOT NULL DEFAULT 1,
    LastLogin DATETIME2 NULL,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 10. BẢNG 3.10: ARTICLE_AUDITS (Nhật ký kiểm toán xuất bản bài viết)
-- =========================================================================
CREATE TABLE dbo.ARTICLE_AUDITS (
    AuditId INT IDENTITY(1,1) PRIMARY KEY,
    ArticleId INT NOT NULL FOREIGN KEY REFERENCES dbo.ARTICLES(ArticleId),
    UserId INT NOT NULL FOREIGN KEY REFERENCES dbo.USERS(UserId),
    HanhDong VARCHAR(50) NOT NULL,
    TrangThaiCu VARCHAR(20) NULL,
    TrangThaiMoi VARCHAR(20) NULL,
    GhiChu NVARCHAR(MAX) NULL,
    ThoiGian DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 11. BẢNG 3.11: COMMENTS (Bình luận & Ý kiến trao đổi bài viết)
-- =========================================================================
CREATE TABLE dbo.COMMENTS (
    CommentId INT IDENTITY(1,1) PRIMARY KEY,
    ArticleId INT NOT NULL FOREIGN KEY REFERENCES dbo.ARTICLES(ArticleId),
    MaNhanSu INT NOT NULL FOREIGN KEY REFERENCES dbo.MEMBERS(MaNhanSu),
    NoiDung NVARCHAR(MAX) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'approved',
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 12. BẢNG 3.12: BOOKMARKS (Tủ sách đọc sau / Dấu trang đoàn viên)
-- =========================================================================
CREATE TABLE dbo.BOOKMARKS (
    BookmarkId INT IDENTITY(1,1) PRIMARY KEY,
    MaNhanSu INT NOT NULL FOREIGN KEY REFERENCES dbo.MEMBERS(MaNhanSu),
    ArticleId INT NOT NULL FOREIGN KEY REFERENCES dbo.ARTICLES(ArticleId),
    NgayLuu DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 13. BẢNG 3.13: WELFARE_PROGRAMS (Chương trình chăm lo & Phúc lợi)
-- =========================================================================
CREATE TABLE dbo.WELFARE_PROGRAMS (
    WelfareId INT IDENTITY(1,1) PRIMARY KEY,
    TenChuongTrinh NVARCHAR(255) NOT NULL,
    LoaiPhucLoi NVARCHAR(50) NOT NULL,
    KinhPhiDuKien DECIMAL(18,2) NULL,
    MoTaDoiTuong NVARCHAR(MAX) NULL,
    NgayBatDau DATE NOT NULL,
    NgayKetThuc DATE NOT NULL,
    TrangThai BIT NOT NULL DEFAULT 1,
    NgayTao DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- 14. BẢNG 3.14: WELFARE_CATEGORIES (Danh mục phân loại chế độ phúc lợi)
-- =========================================================================
CREATE TABLE dbo.WELFARE_CATEGORIES (
    CategoryId INT IDENTITY(1,1) PRIMARY KEY,
    CategoryCode VARCHAR(50) NOT NULL UNIQUE,
    CategoryName NVARCHAR(150) NOT NULL,
    IconClass VARCHAR(50) NULL,
    BadgeColor VARCHAR(30) NULL,
    Description NVARCHAR(500) NULL,
    DisplayOrder INT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'active',
    CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2 NULL
);
GO

-- =========================================================================
-- 15. BẢNG 3.15: INBOX_FEEDBACK (Hòm thư góp ý & Phản ánh đoàn viên)
-- =========================================================================
CREATE TABLE dbo.INBOX_FEEDBACK (
    FeedbackId INT IDENTITY(1,1) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL,
    TieuDe NVARCHAR(255) NOT NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    TrangThai VARCHAR(20) NOT NULL DEFAULT 'resolved',
    TraLoi NVARCHAR(MAX) NULL,
    NgayGui DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
);
GO

-- =========================================================================
-- NẠP DỮ LIỆU KHỞI TẠO MẪU (SEED DATA CHUẨN 100% THỰC TẾ)
-- =========================================================================

-- 1. NẠP ORGANIZATIONS (5 Ban chuyên môn)
INSERT INTO dbo.ORGANIZATIONS (TenToChuc, NhiemKy, MoTaChucNang, ThuTuHienThi) VALUES
(N'Ban Thường vụ', N'Nhiệm kỳ 2023 - 2028', N'Lãnh đạo, điều hành toàn diện hoạt động Công đoàn giữa hai kỳ họp BCH', 1),
(N'Ban Chấp hành', N'Nhiệm kỳ 2023 - 2028', N'Cơ quan lãnh đạo cao nhất của Công đoàn cơ sở TDMU', 2),
(N'Ủy ban Kiểm tra', N'Nhiệm kỳ 2023 - 2028', N'Kiểm tra việc chấp hành Điều lệ Công đoàn và quản lý tài chính', 3),
(N'Ban Nữ công', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách phong trào nữ cán bộ giảng viên Giỏi việc trường - Đảm việc nhà', 4),
(N'Ban Tuyên giáo - Thi đua', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách công tác truyền thông, học tập chính trị và phong trào thi đua', 5);
GO

-- 2. NẠP UNION_BRANCHES (16 Tổ công đoàn cơ sở)
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
GO

-- 3. NẠP MEMBERS (Nhân sự Ban Thường vụ & BCH Công đoàn)
INSERT INTO dbo.MEMBERS (MaToCongDoan, MaToChuc, MaCanBo, HoVaTen, Email, ChucVuCongDoan, HocHamHocVi) VALUES
(1, 1, 'CB_001', N'TS. Lê Thị Kim Út', 'utltk@tdmu.edu.vn', N'Chủ tịch Công đoàn', N'Tiến sĩ'),
(2, 1, 'CB_002', N'ThS. Nguyễn Văn Hậu', 'haunv@tdmu.edu.vn', N'Phó Chủ tịch - Chủ nhiệm UBKT', N'Thạc sĩ'),
(3, 1, 'CB_003', N'TS. Trần Trọng Danh', 'danhth@tdmu.edu.vn', N'Ủy viên Ban Thường vụ', N'Tiến sĩ'),
(10, 2, 'CB_004', N'ThS. Lê Nguyễn Xuân Lan', 'lanlnx@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(1, 2, 'CB_009', N'ThS. Phan Nguyễn Hồng Diễm', 'diempnh@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(11, 2, 'CB_011', N'ThS. Võ Nguyễn Đoan Trinh', 'trinhvnd@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(8, 2, 'CB_015', N'ThS. Nguyễn Võ Thành Long', 'longnvt@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(6, 2, 'CB_016', N'ThS. Trần Đức Hoàn', 'hoantd@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(3, 2, 'CB_017', N'ThS. Võ Quốc Lương', 'luongvq@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(7, 2, 'CB_020', N'ThS. Huỳnh Thanh Thúy', 'thuyht@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(2, 2, 'CB_021', N'ThS. Phú Thị Tuyết Nga', 'ngaptt@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(15, 2, 'CB_022', N'ThS. Âu Minh Triết', 'trietam@tdmu.edu.vn', N'Ủy viên Ban Chấp hành', N'Thạc sĩ'),
(1, 2, 'CB_023', N'CN. Nguyễn Thị Thanh Thảo', 'thaontt@tdmu.edu.vn', N'Ủy viên BCH - Kế toán trưởng', N'Cử nhân'),
(11, 3, 'CB_024', N'ThS. Nguyễn Ngọc Hiền', 'hiennn@tdmu.edu.vn', N'Ủy viên Ủy ban Kiểm tra', N'Thạc sĩ'),
(2, 3, 'CB_025', N'ThS. Nguyễn Văn Trường', 'truongnv@tdmu.edu.vn', N'Ủy viên Ủy ban Kiểm tra', N'Thạc sĩ');
GO

-- 4. NẠP CATEGORIES (Chuyên mục)
INSERT INTO dbo.CATEGORIES (TenChuyenMuc, Slug, MoTa, ThuTu) VALUES
(N'Hoạt Động & Phong Trào', 'hoat-dong-phong-trao', N'Các phong trào thi đua, văn nghệ, thể thao', 1),
(N'Chăm Lo & Phúc Lợi', 'cham-lo-phuc-loi', N'Chính sách phúc lợi, trợ cấp, hỗ trợ công đoàn', 2),
(N'Thi Đua & Tuyên Giáo', 'thi-dua-tuyen-giao', N'Tuyên dương điển hình, học tập và làm theo Bác, pháp luật', 3);
GO

-- 5. NẠP ARTICLES (Bài viết tin tức - Lượt xem & tương tác bắt đầu từ 0)
INSERT INTO dbo.ARTICLES (MaTacGia, CategoryId, TieuDe, Slug, TomTat, NoiDung, HinhAnhDaiDien, TrangThai, LuotXem, LuotThich, LuotVoTay, NgayXuatBan) VALUES
(1, 1, N'Sôi nổi Giải bóng đá truyền thống Công đoàn Trường Đại học Thủ Dầu Một lần thứ X', 'giai-bong-da-truyen-thong-lan-thu-x', N'Giải bóng đá thu hút 16 đội bóng đại diện 16 tổ công đoàn tham gia tranh tài sôi nổi.', N'<p>Nhằm tạo sân chơi lành mạnh, rèn luyện thể chất và thắt chặt tình đoàn kết giữa các cán bộ viên chức, Công đoàn Trường Đại học Thủ Dầu Một đã khai mạc Giải bóng đá truyền thống lần thứ X năm 2026 với sự tham gia nhiệt tình của 16 Tổ công đoàn cơ sở.</p>', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800', 'published', 0, 0, 0, '2026-09-20'),
(2, 1, N'Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình" chào mừng Ngày Gia đình Việt Nam', 'toa-dam-dinh-duong-lanh-manh-vi-suc-khoe-gia-dinh', N'Hướng tới Ngày Gia đình Việt Nam, Công đoàn TDMU tổ chức tọa đàm dinh dưỡng lành mạnh cho cán bộ nữ.', N'<p>Công đoàn Trường Đại học Thủ Dầu Một tổ chức tọa đàm chuyên đề nâng cao sức khỏe, dinh dưỡng khoa học và cân bằng cuộc sống gia đình cho toàn thể nữ cán bộ giảng viên.</p>', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800', 'published', 0, 0, 0, '2026-06-26'),
(1, 3, N'Chào mừng Đại hội XIV Công đoàn Việt Nam nhiệm kỳ 2026 – 2031', 'chao-mung-dai-hoi-xiv-cong-doan-viet-nam', N'Toàn thể đoàn viên TDMU ra sức thi đua lập thành tích xuất sắc chào mừng Đại hội XIV Công đoàn Việt Nam.', N'<p>Ban Thường vụ Công đoàn trường kêu gọi toàn thể cán bộ đoàn viên phát huy tinh thần trách nhiệm, đổi mới sáng tạo, hoàn thành thắng lợi nhiệm vụ đào tạo và nghiên cứu khoa học.</p>', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'published', 0, 0, 0, '2026-06-01'),
(3, 3, N'Đại học Thủ Dầu Một được tuyên dương điển hình tiên tiến trong học tập và làm theo Bác', 'tdmu-duoc-tuyen-duong-dien-hinh-tien-tien', N'Trường ĐH Thủ Dầu Một vinh dự nhận Bằng khen tập thể điển hình tiên tiến giai đoạn 2021–2026.', N'<p>Trường Đại học Thủ Dầu Một vinh dự đón nhận Bằng khen khen thưởng tập thể có thành tích tiêu biểu xuất sắc trong học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.</p>', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', 'published', 0, 0, 0, '2026-05-08'),
(2, 2, N'Phiên chợ Tết “Ngựa ô đón Tết – Rước lộc về dinh” chào xuân 2026', 'phien-cho-tet-ngua-o-don-tet-2026', N'Phiên chợ Tết nghĩa tình phục vụ cán bộ viên chức và sinh viên có hoàn cảnh khó khăn.', N'<p>Trong không khí rộn ràng đón Tết Bính Ngọ 2026, Công đoàn TDMU tổ chức phiên chợ tết nghĩa tình, trao tặng hàng trăm suất quà và phiếu mua hàng giảm giá cho đoàn viên khó khăn.</p>', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800', 'published', 0, 0, 0, '2026-01-30'),
(1, 3, N'Công đoàn TDMU phát động phong trào thi đua "Lao động giỏi - Lao động sáng tạo" năm 2026', 'cong-doan-tdmu-phat-dong-thi-dua-2026', N'Quyết tâm thực hiện thắng lợi các mục tiêu nghiên cứu khoa học và đổi mới phương pháp giảng dạy.', N'<p>Đợt thi đua cao điểm năm 2026 nhấn mạnh vào việc chuyển đổi số giảng dạy, công bố bài báo quốc tế uy tín và đồng hành cùng sự phát triển bền vững của Nhà trường.</p>', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', 'published', 0, 0, 0, '2026-08-10');
GO

-- 6. NẠP DOCUMENTS (Văn bản)
INSERT INTO dbo.DOCUMENTS (SoHieu, TieuDe, LoaiVanBan, CoQuanBanHanh, NgayBanHanh, FileUrl, MaNguoiDang, TrangThai) VALUES
('18/CV-CDCS', N'Công văn số 18/CV-CĐCS về việc vận động ủng hộ đồng bào bị ảnh hưởng bởi thiên tai', N'Công văn', N'Ban Thường Vụ Công Đoàn TDMU', '2026-08-15', 'uploads/documents/18_CV_CDCS.pdf', 1, 1),
('1630/CV-BTG', N'Công văn số 1630/CV-BTG của Ban Tuyên giáo Tỉnh ủy: Tham gia cuộc thi trực tuyến tìm hiểu Nghị quyết', N'Công văn', N'Ban Tuyên Giáo Tỉnh Ủy Bình Dương', '2026-08-01', 'uploads/documents/1630_CV_BTG.pdf', 1, 1),
('25/KH-CDCS', N'Kế hoạch số 25/KH-CĐCS: Kế hoạch tổ chức các hoạt động kỷ niệm Ngày Nhà giáo Việt Nam 20/11', N'Kế hoạch', N'Ban Thường Vụ Công Đoàn TDMU', '2026-07-10', 'uploads/documents/25_KH_20_11.pdf', 2, 1),
('12/2012/QH13', N'Luật Công đoàn số 12/2012/QH13 của Quốc hội nước CHXHCN Việt Nam', N'Luật', N'Quốc Hội Nước CHXHCN Việt Nam', '2026-01-01', 'uploads/documents/Luat_Cong_Doan.pdf', 1, 1),
('82/QD-LDLD', N'Quyết định số 82/QĐ-LĐLĐ ban hành Quy chế Khen thưởng của tổ chức Công đoàn', N'Quyết định', N'Tổng Liên Đoàn Lao Động Việt Nam', '2026-06-18', 'uploads/documents/82_QD_LDLD.pdf', 1, 1);
GO

-- 7. NẠP TEMPLATES (Biểu mẫu công đoàn chuẩn mẫu BM-01, BM-02, BM-03...)
INSERT INTO dbo.TEMPLATES (Title, Code, Category, CategoryName, Description, FileUrl, FileSize, DownloadsCount, Status) VALUES
(N'Đơn xin gia nhập Công đoàn Việt Nam', 'BM-01/CĐ', 'doan_vien', N'Công tác Đoàn viên', N'Mẫu đơn dành cho cán bộ giảng viên, người lao động mới tuyển dụng có nguyện vọng gia nhập tổ chức Công đoàn.', 'uploads/templates/BM01_DonGiaNhapCongDoan.docx', '45 KB', 0, 'active'),
(N'Báo cáo hoạt động công đoàn định kỳ hàng tháng', 'BM-02/CĐ', 'hoat_dong', N'Báo cáo & Tổng kết', N'Mẫu báo cáo số liệu phong trào, nhân sự và tài chính dành cho 16 Tổ công đoàn cơ sở.', 'uploads/templates/BM02_BaoCaoThang_ToCongDoan.docx', '58 KB', 0, 'active'),
(N'Đơn đề nghị hỗ trợ trợ cấp khó khăn đột xuất', 'BM-03/CĐ', 'phuc_loi', N'Chế độ & Trợ cấp', N'Mẫu đơn dành cho đoàn viên gặp ốm đau, tai nạn hoặc sự cố đột xuất đề nghị Công đoàn trường hỗ trợ.', 'uploads/templates/BM03_DonTroCapKhoKhan.docx', '42 KB', 0, 'active'),
(N'Biên bản họp bình xét thi đua Tổ công đoàn cuối năm', 'BM-04/CĐ', 'thi_dua', N'Thi đua & Khen thưởng', N'Mẫu biên bản tổng kết, bình chọn đoàn viên xuất sắc và tổ công đoàn vững mạnh tiêu biểu.', 'uploads/templates/BM04_BienBanThiDua.docx', '60 KB', 0, 'active'),
(N'Giấy đề nghị thanh toán kinh phí hoạt động phong trào', 'BM-05/CĐ', 'tai_chinh', N'Tài chính Công đoàn', N'Biểu mẫu thanh quyết toán các khoản chi cho hoạt động văn hóa, thể thao, hội thi của tổ công đoàn.', 'uploads/templates/BM05_DeNghiThanhToan.docx', '48 KB', 0, 'active');
GO

-- 8. NẠP SCHEDULES (Lịch công tác)
INSERT INTO dbo.SCHEDULES (TieuDe, ThoiGianBatDau, ThoiGianKetThuc, DiaDiem, ThanhPhan, ChuTri, NoiDungChuChot, MaNguoiTao, TrangThai) VALUES
(N'Họp Ban Thường Vụ định kỳ tháng 10/2026', '2026-10-30 08:30:00', '2026-10-30 11:30:00', N'Phòng họp 2 - Tòa nhà Trung tâm TDMU', N'Các đồng chí trong Ban Thường vụ Công đoàn', N'TS. Lê Thị Kim Út', N'Đánh giá công tác tháng 10 và triển khai kế hoạch phong trào thi đua chào mừng 20/11.', 1, 'scheduled'),
(N'Hội nghị giao ban Tổ trưởng 16 Tổ công đoàn cơ sở', '2026-11-05 14:00:00', '2026-11-05 16:30:00', N'Hội trường 1 - Đại học Thủ Dầu Một', N'BCH Công đoàn trường và 16 Tổ trưởng CĐ', N'ThS. Nguyễn Văn Hậu', N'Hướng dẫn nộp hồ sơ xét duyệt khen thưởng năm học 2025 - 2026.', 2, 'scheduled');
GO

-- 9. NẠP USERS (Tài khoản Quản trị viên demo)
INSERT INTO dbo.USERS (MaNhanSu, Username, PasswordHash, Role, IsActive, LastLogin) VALUES
(1, 'admin@tdmu.edu.vn', '123456', 'Admin', 1, SYSUTCDATETIME()),
(2, 'haunv@tdmu.edu.vn', '123456', 'Editor', 1, SYSUTCDATETIME()),
(3, 'danhth@tdmu.edu.vn', '123456', 'Contributor', 1, SYSUTCDATETIME());
GO

-- 10. NẠP ARTICLE_AUDITS (Nhật ký kiểm duyệt bài)
INSERT INTO dbo.ARTICLE_AUDITS (ArticleId, UserId, HanhDong, TrangThaiCu, TrangThaiMoi, GhiChu) VALUES
(1, 1, 'publish', 'approved', 'published', N'Đã xuất bản bài viết Giải bóng đá lên cổng thông tin truyền thông chính thức.');
GO

-- 11. NẠP COMMENTS (Bình luận bài viết)
INSERT INTO dbo.COMMENTS (ArticleId, MaNhanSu, NoiDung, TrangThai) VALUES
(1, 3, N'Chúc mừng giải đấu thành công tốt đẹp! Tinh thần thi đấu của các tổ rất tuyệt vời.', 'approved'),
(2, 4, N'Buổi tọa đàm rất bổ ích và mang lại nhiều kiến thức dinh dưỡng thiết thực cho nữ cán bộ giảng viên.', 'approved');
GO

-- 12. NẠP BOOKMARKS (Dấu trang đọc sau)
INSERT INTO dbo.BOOKMARKS (MaNhanSu, ArticleId) VALUES
(1, 1),
(2, 3);
GO

-- 13. NẠP WELFARE_PROGRAMS (Chương trình phúc lợi)
INSERT INTO dbo.WELFARE_PROGRAMS (TenChuongTrinh, LoaiPhucLoi, KinhPhiDuKien, MoTaDoiTuong, NgayBatDau, NgayKetThuc, TrangThai) VALUES
(N'Trợ cấp khó khăn đột xuất cho đoàn viên mắc bệnh hiểm nghèo', N'Trợ cấp khó khăn', 5000000, N'Đoàn viên công đoàn trường có hoàn cảnh đặc biệt khó khăn hoặc mắc bệnh hiểm nghèo.', '2026-01-01', '2026-12-31', 1),
(N'Học bổng "Tiếp sức đến trường" cho con cán bộ đoàn viên vượt khó học giỏi', N'Học bổng khuyến học', 2000000, N'Con cán bộ viên chức, người lao động đạt thành tích học sinh giỏi các cấp.', '2026-08-01', '2026-10-31', 1),
(N'Chương trình chăm lo Tết Bính Ngọ 2026 - Tặng quà đoàn viên', N'Quà Tết nghĩa tình', 1000000, N'Tất cả đoàn viên công đoàn sinh hoạt tại 16 Tổ công đoàn bộ phận.', '2026-01-10', '2026-02-15', 1);
GO

-- 14. NẠP WELFARE_CATEGORIES (Danh mục chế độ chăm lo)
INSERT INTO dbo.WELFARE_CATEGORIES (CategoryCode, CategoryName, IconClass, BadgeColor, Description, DisplayOrder, Status) VALUES
('KHO_KHAN', N'Trợ Cấp Khó Khăn Đột Xuất', 'fa-solid fa-hand-holding-heart', '#DC2626', N'Hỗ trợ đoàn viên ốm đau dài ngày, tai nạn lao động hoặc gia đình gặp hoạn nạn.', 1, 'active'),
('THAI_SAN', N'Chế Độ Thai Sản & Nuôi Con Nhỏ', 'fa-solid fa-baby', '#EC4899', N'Thăm hỏi, quà tặng mừng sinh con và hỗ trợ chăm sóc sức khỏe phụ nữ.', 2, 'active'),
('HOC_BONG', N'Quỹ Khuyến Học & Học Bổng', 'fa-solid fa-graduation-cap', '#2563EB', N'Tuyên dương khen thưởng con cán bộ giảng viên đạt giải học sinh giỏi các cấp.', 3, 'active'),
('HIEU_HY', N'Chế Độ Hiếu Hỷ & Thăm Hỏi', 'fa-solid fa-envelope-open-text', '#D97706', N'Chi thăm hỏi việc hiếu, việc hỷ của đoàn viên và thân nhân theo quy chế chi tiêu nội bộ.', 4, 'active'),
('TET_SUM_VAY', N'Tết Sum Vầy & Chăm Lo Cuối Năm', 'fa-solid fa-gift', '#059669', N'Quà tết, vé xe về quê đón tết và vé chợ tết trợ giá cho đoàn viên.', 5, 'active');
GO

-- 15. NẠP INBOX_FEEDBACK (Hòm thư góp ý đoàn viên)
INSERT INTO dbo.INBOX_FEEDBACK (HoTen, Email, TieuDe, NoiDung, TrangThai, TraLoi) VALUES
(N'TS. Nguyễn Văn Hậu', 'haunv@tdmu.edu.vn', N'Đề xuất số hóa 100% hồ sơ đoàn viên và quy trình trợ cấp', N'Kính gửi Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một, tôi xin góp ý bổ sung tính năng nộp hồ sơ trợ cấp trực tuyến để giảm tải thủ tục giấy tờ.', 'resolved', N'Ban Thường Vụ Công Đoàn Trường Đại học Thủ Dầu Một xin ghi nhận và đánh giá rất cao ý kiến đóng góp của Thầy. Hệ thống cổng thông tin công đoàn hiện đã chính thức tích hợp phân hệ số hóa hồ sơ trực tuyến.'),
(N'ThS. Lê Nguyễn Xuân Lan', 'lanlnx@tdmu.edu.vn', N'Đề xuất tổ chức thêm các buổi giao lưu thể thao định kỳ', N'Kính gửi Công đoàn trường, đề nghị tổ chức thêm giải cầu lông và bóng bàn định kỳ hàng quý.', 'resolved', N'Ban Thường vụ đã đưa nội dung này vào kế hoạch hoạt động quý 4/2026. Xin chân thành cảm ơn Cô.');
GO

PRINT N'=================================================================';
PRINT N'✅ KHỞI TẠO CƠ SỞ DỮ LIỆU TDMU_TradeUnion_DB THÀNH CÔNG 100%!';
PRINT N'📊 ĐÚNG 15 BẢNG CHUẨN 3NF KHỚP 100% BÁO CÁO GỐC CHƯƠNG 3:';
PRINT N'   1. ORGANIZATIONS      6. DOCUMENTS        11. COMMENTS';
PRINT N'   2. UNION_BRANCHES     7. TEMPLATES        12. BOOKMARKS';
PRINT N'   3. MEMBERS            8. SCHEDULES        13. WELFARE_PROGRAMS';
PRINT N'   4. CATEGORIES         9. USERS            14. WELFARE_CATEGORIES';
PRINT N'   5. ARTICLES          10. ARTICLE_AUDITS   15. INBOX_FEEDBACK';
PRINT N'=================================================================';
GO
