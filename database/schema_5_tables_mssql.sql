-- =========================================================================
-- CƠ SỞ DỮ LIỆU ĐẲNG CẤP ENTERPRISE - CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU)
-- Hệ quản trị: Microsoft SQL Server (SSMS / LocalDB)
-- Đầy đủ: 5 Bảng + 16 Tổ CĐ + Dữ liệu mẫu + Indexes + Views + Stored Procedures
-- =========================================================================

USE master;
GO

-- 1. TẠO DATABASE NẾU CHƯA CÓ
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'TDMU_CongDoan_DB')
BEGIN
    CREATE DATABASE [TDMU_CongDoan_DB];
END
GO

USE [TDMU_CongDoan_DB];
GO

-- 2. XÓA CÁC ĐỐI TƯỢNG CŨ THEO THỨ TỰ RÀNG BUỘC
IF OBJECT_ID(N'dbo.sp_LayThongKeTongQuan', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_LayThongKeTongQuan;
IF OBJECT_ID(N'dbo.V_TinTuc_TrangChu', N'V') IS NOT NULL DROP VIEW dbo.V_TinTuc_TrangChu;
IF OBJECT_ID(N'dbo.V_ThongKe_16ToCongDoan', N'V') IS NOT NULL DROP VIEW dbo.V_ThongKe_16ToCongDoan;
IF OBJECT_ID(N'dbo.VAN_BAN', N'U') IS NOT NULL DROP TABLE dbo.VAN_BAN;
IF OBJECT_ID(N'dbo.TIN_TUC', N'U') IS NOT NULL DROP TABLE dbo.TIN_TUC;
IF OBJECT_ID(N'dbo.NHAN_SU', N'U') IS NOT NULL DROP TABLE dbo.NHAN_SU;
IF OBJECT_ID(N'dbo.TO_CONG_DOAN', N'U') IS NOT NULL DROP TABLE dbo.TO_CONG_DOAN;
IF OBJECT_ID(N'dbo.TO_CHUC', N'U') IS NOT NULL DROP TABLE dbo.TO_CHUC;
GO

-- -------------------------------------------------------------------------
-- 1. BẢNG TO_CHUC (Cơ cấu Ban Chấp hành & Các Ban chuyên môn cấp Trường)
-- -------------------------------------------------------------------------
CREATE TABLE dbo.TO_CHUC (
    MaToChuc INT IDENTITY(1,1) PRIMARY KEY,
    TenToChuc NVARCHAR(150) NOT NULL,
    NhiemKy NVARCHAR(50) NOT NULL,
    MoTaChucNang NVARCHAR(MAX) NULL,
    ThuTuHienThi INT NOT NULL CONSTRAINT DF_TO_CHUC_ThuTu DEFAULT 1,
    TrangThai BIT NOT NULL CONSTRAINT DF_TO_CHUC_TrangThai DEFAULT 1,
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_TO_CHUC_NgayTao DEFAULT SYSDATETIME()
);
GO

-- -------------------------------------------------------------------------
-- 2. BẢNG TO_CONG_DOAN (16 Tổ Công đoàn chính thức của TDMU)
-- -------------------------------------------------------------------------
CREATE TABLE dbo.TO_CONG_DOAN (
    MaToCongDoan INT IDENTITY(1,1) PRIMARY KEY,
    MaDinhDanh NVARCHAR(50) NOT NULL CONSTRAINT UQ_TO_CONG_DOAN_MaDinhDanh UNIQUE,
    TenToCongDoan NVARCHAR(150) NOT NULL,
    ToTruong NVARCHAR(100) NULL,
    EmailLienHe NVARCHAR(100) NULL,
    SoDienThoai NVARCHAR(20) NULL,
    DiaChiVanPhong NVARCHAR(150) NULL,
    TrangThai BIT NOT NULL CONSTRAINT DF_TO_CONG_DOAN_TrangThai DEFAULT 1,
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_TO_CONG_DOAN_NgayTao DEFAULT SYSDATETIME()
);
GO

-- -------------------------------------------------------------------------
-- 3. BẢNG NHAN_SU (Cán bộ Ban Chấp hành, Tổ trưởng & Công đoàn viên)
-- -------------------------------------------------------------------------
CREATE TABLE dbo.NHAN_SU (
    MaNhanSu INT IDENTITY(1,1) PRIMARY KEY,
    MaToCongDoan INT NOT NULL,
    MaToChuc INT NULL,
    MaCanBo NVARCHAR(50) NOT NULL CONSTRAINT UQ_NHAN_SU_MaCanBo UNIQUE,
    HoVaTen NVARCHAR(100) NOT NULL,
    GioiTinh NVARCHAR(10) NOT NULL CONSTRAINT DF_NHAN_SU_GioiTinh DEFAULT N'Nam' CONSTRAINT CK_NHAN_SU_GioiTinh CHECK (GioiTinh IN (N'Nam', N'Nữ', N'Khác')),
    NgaySinh DATE NULL,
    Email NVARCHAR(100) NOT NULL CONSTRAINT UQ_NHAN_SU_Email UNIQUE,
    SoDienThoai NVARCHAR(20) NULL,
    MatKhau NVARCHAR(255) NULL,
    HocHamHocVi NVARCHAR(50) NULL,
    ChucVuCongDoan NVARCHAR(100) NOT NULL CONSTRAINT DF_NHAN_SU_ChucVuCD DEFAULT N'Đoàn viên',
    ChucVuChuyenMon NVARCHAR(100) NULL,
    VaiTroHeThong NVARCHAR(50) NOT NULL CONSTRAINT DF_NHAN_SU_VaiTro DEFAULT 'Contributor' CONSTRAINT CK_NHAN_SU_VaiTro CHECK (VaiTroHeThong IN ('Admin', 'Editor', 'Contributor', 'User')),
    TrangThai BIT NOT NULL CONSTRAINT DF_NHAN_SU_TrangThai DEFAULT 1,
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_NHAN_SU_NgayTao DEFAULT SYSDATETIME(),
    CONSTRAINT FK_NHAN_SU_ToCongDoan FOREIGN KEY (MaToCongDoan) REFERENCES dbo.TO_CONG_DOAN(MaToCongDoan),
    CONSTRAINT FK_NHAN_SU_ToChuc FOREIGN KEY (MaToChuc) REFERENCES dbo.TO_CHUC(MaToChuc) ON DELETE SET NULL
);
GO

-- -------------------------------------------------------------------------
-- 4. BẢNG TIN_TUC (Bài viết truyền thông, Thông báo, Phong trào thi đua)
-- -------------------------------------------------------------------------
CREATE TABLE dbo.TIN_TUC (
    MaTinTuc INT IDENTITY(1,1) PRIMARY KEY,
    MaTacGia INT NOT NULL,
    TieuDe NVARCHAR(255) NOT NULL,
    Slug NVARCHAR(255) NOT NULL CONSTRAINT UQ_TIN_TUC_Slug UNIQUE,
    ChuyenMuc NVARCHAR(100) NOT NULL,
    TomTat NVARCHAR(MAX) NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    HinhAnhDaiDien NVARCHAR(255) NULL,
    TrangThai NVARCHAR(50) NOT NULL CONSTRAINT DF_TIN_TUC_TrangThai DEFAULT 'Draft' CONSTRAINT CK_TIN_TUC_TrangThai CHECK (TrangThai IN ('Draft', 'Pending', 'Approved', 'Published', 'Archived')),
    LuotXem INT NOT NULL CONSTRAINT DF_TIN_TUC_LuotXem DEFAULT 0,
    NgayXuatBan DATETIME2 NULL,
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_TIN_TUC_NgayTao DEFAULT SYSDATETIME(),
    NgayCapNhat DATETIME2 NOT NULL CONSTRAINT DF_TIN_TUC_NgayCapNhat DEFAULT SYSDATETIME(),
    CONSTRAINT FK_TIN_TUC_TacGia FOREIGN KEY (MaTacGia) REFERENCES dbo.NHAN_SU(MaNhanSu)
);
GO

-- -------------------------------------------------------------------------
-- 5. BẢNG VAN_BAN (Văn bản chỉ đạo, Kế hoạch, Quy chế, Biểu mẫu)
-- -------------------------------------------------------------------------
CREATE TABLE dbo.VAN_BAN (
    MaVanBan INT IDENTITY(1,1) PRIMARY KEY,
    MaNguoiDang INT NOT NULL,
    SoHieuVanBan NVARCHAR(100) NOT NULL,
    TenVanBan NVARCHAR(255) NOT NULL,
    LoaiVanBan NVARCHAR(100) NOT NULL,
    CoQuanBanHanh NVARCHAR(150) NOT NULL,
    NgayBanHanh DATE NOT NULL,
    NguoiKy NVARCHAR(100) NULL,
    TepDinhKem NVARCHAR(255) NOT NULL,
    GhiChu NVARCHAR(MAX) NULL,
    NgayDang DATETIME2 NOT NULL CONSTRAINT DF_VAN_BAN_NgayDang DEFAULT SYSDATETIME(),
    CONSTRAINT FK_VAN_BAN_NguoiDang FOREIGN KEY (MaNguoiDang) REFERENCES dbo.NHAN_SU(MaNhanSu)
);
GO

-- -------------------------------------------------------------------------
-- 6. INDEXING CHUYÊN SÂU TĂNG TỐC ĐỘ TRUY VẤN (PERFORMANCE TUNING)
-- -------------------------------------------------------------------------
CREATE NONCLUSTERED INDEX IX_TIN_TUC_TrangThai_NgayXuatBan 
ON dbo.TIN_TUC (TrangThai, NgayXuatBan DESC) 
INCLUDE (TieuDe, Slug, ChuyenMuc, HinhAnhDaiDien, LuotXem);

CREATE NONCLUSTERED INDEX IX_NHAN_SU_ToCongDoan 
ON dbo.NHAN_SU (MaToCongDoan) 
INCLUDE (HoVaTen, Email, ChucVuCongDoan);

CREATE NONCLUSTERED INDEX IX_VAN_BAN_LoaiVanBan_NgayBanHanh 
ON dbo.VAN_BAN (LoaiVanBan, NgayBanHanh DESC);
GO

-- -------------------------------------------------------------------------
-- 7. INSERT DỮ LIỆU THỰC TẾ 16 TỔ CÔNG ĐOÀN & BAN LÃNH ĐẠO TDMU
-- -------------------------------------------------------------------------
INSERT INTO dbo.TO_CHUC (TenToChuc, NhiemKy, MoTaChucNang, ThuTuHienThi) VALUES
(N'Ban Thường vụ', N'Nhiệm kỳ 2023 - 2028', N'Lãnh đạo, điều hành toàn diện hoạt động Công đoàn giữa hai kỳ họp BCH', 1),
(N'Ban Chấp hành', N'Nhiệm kỳ 2023 - 2028', N'Cơ quan lãnh đạo cao nhất của Công đoàn cơ sở TDMU', 2),
(N'Ủy ban Kiểm tra', N'Nhiệm kỳ 2023 - 2028', N'Kiểm tra việc chấp hành Điều lệ Công đoàn và quản lý tài chính', 3),
(N'Ban Nữ công', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách phong trào nữ cán bộ giảng viên Giỏi việc trường - Đảm việc nhà', 4),
(N'Ban Tuyên giáo - Thi đua', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách công tác truyền thông, học tập chính trị và phong trào thi đua', 5);

INSERT INTO dbo.TO_CONG_DOAN (MaDinhDanh, TenToCongDoan, ToTruong, EmailLienHe, DiaChiVanPhong) VALUES
(N'TCD_01', N'Công đoàn 1', N'Đ/c Nguyễn Văn A', N'tcd01@tdmu.edu.vn', N'Phòng A1-101'),
(N'TCD_02', N'Công đoàn 2', N'Đ/c Trần Thị B', N'tcd02@tdmu.edu.vn', N'Phòng A1-102'),
(N'TCD_03', N'Công đoàn 3', N'Đ/c Lê Văn C', N'tcd03@tdmu.edu.vn', N'Phòng A1-103'),
(N'TCD_04', N'Công đoàn 4', N'Đ/c Nguyễn Thị Hương', N'tcd04@tdmu.edu.vn', N'Phòng A1-104'),
(N'TCD_KCNVH', N'Khoa Công nghiệp Văn hóa', N'Đ/c Phạm Văn D', N'tcd_cnvh@tdmu.edu.vn', N'Phòng B2-201'),
(N'TCD_KNN', N'Khoa Ngoại ngữ', N'Đ/c Hoàng Thị E', N'tcd_ngoaingu@tdmu.edu.vn', N'Phòng B1-305'),
(N'TCD_KKTXD', N'Khoa Kiến trúc - Xây dựng', N'Đ/c Vũ Văn F', N'tcd_ktxd@tdmu.edu.vn', N'Phòng B2-302'),
(N'TCD_VKTCN', N'Viện Kỹ thuật công nghệ', N'Đ/c Đặng Văn G', N'tcd_ktcn@tdmu.edu.vn', N'Phòng B1-102'),
(N'TCD_VCNS', N'Viện Công nghệ số', N'Đ/c Hồ Ngọc Trung Kiên', N'tcd_cns@tdmu.edu.vn', N'Phòng B1-204'),
(N'TCD_VCNXBV', N'Viện Công nghệ xanh và bền vững', N'Đ/c Bùi Thị H', N'tcd_cnxbv@tdmu.edu.vn', N'Phòng B1-208'),
(N'TCD_TLQL', N'Trường Luật và Quản lý', N'Đ/c Huỳnh Thị Lệ Kha', N'tcd_luat@tdmu.edu.vn', N'Phòng B3-101'),
(N'TCD_SP1', N'Sư phạm 1', N'Đ/c Ngô Văn I', N'tcd_sp1@tdmu.edu.vn', N'Phòng C1-201'),
(N'TCD_SP2', N'Sư phạm 2', N'Đ/c Đỗ Thị K', N'tcd_sp2@tdmu.edu.vn', N'Phòng C1-202'),
(N'TCD_KTTC1', N'Kinh tế tài chính 1', N'Đ/c Trương Văn L', N'tcd_kttc1@tdmu.edu.vn', N'Phòng B2-101'),
(N'TCD_KTTC2', N'Kinh tế tài chính 2', N'Đ/c Nguyễn Thụy Bảo Khuyên', N'tcd_kttc2@tdmu.edu.vn', N'Phòng B2-102'),
(N'TCD_KTTC3', N'Kinh tế tài chính 3', N'Đ/c Phan Văn M', N'tcd_kttc3@tdmu.edu.vn', N'Phòng B2-103');

INSERT INTO dbo.NHAN_SU (MaToCongDoan, MaToChuc, MaCanBo, HoVaTen, GioiTinh, Email, HocHamHocVi, ChucVuCongDoan, ChucVuChuyenMon, VaiTroHeThong) VALUES
(9, 1, N'CB001', N'TS. Lê Thị Kim Út', N'Nữ', N'utltk@tdmu.edu.vn', N'Tiến sĩ', N'Chủ tịch Công đoàn', N'Giảng viên cao cấp', 'Admin'),
(9, 1, N'CB002', N'ThS. Võ Quốc Lương', N'Nam', N'luongvq@tdmu.edu.vn', N'Thạc sĩ', N'Ủy viên Ban Thường vụ', N'Giảng viên chính Viện CNS', 'Editor'),
(11, 3, N'CB003', N'Huỳnh Thị Lệ Kha', N'Nữ', N'khahl@tdmu.edu.vn', N'Thạc sĩ', N'Tổ trưởng CĐ Trường Luật', N'Giảng viên', 'Editor'),
(9, 5, N'CB004', N'Hồ Ngọc Trung Kiên', N'Nam', N'kienhnt@tdmu.edu.vn', N'Thạc sĩ', N'Tổ trưởng CĐ Viện CNS', N'Giảng viên', 'Editor'),
(15, NULL, N'CB005', N'Nguyễn Thụy Bảo Khuyên', N'Nữ', N'khuyenntb@tdmu.edu.vn', N'Thạc sĩ', N'Tổ trưởng CĐ KTTC 2', N'Giảng viên', 'Editor'),
(4, NULL, N'CB006', N'Nguyễn Thị Hương', N'Nữ', N'huongnt@tdmu.edu.vn', N'Cử nhân', N'Tổ trưởng Công đoàn 4', N'Chuyên viên', 'Editor'),
(9, NULL, N'CB007', N'Nguyễn Bình Dương', N'Nam', N'2424802010319@student.tdmu.edu.vn', N'Cử nhân', N'Đoàn viên', N'Cộng tác viên truyền thông', 'Contributor');

INSERT INTO dbo.TIN_TUC (MaTacGia, TieuDe, Slug, ChuyenMuc, TomTat, NoiDung, HinhAnhDaiDien, TrangThai, LuotXem, NgayXuatBan) VALUES
(2, N'Công đoàn TDMU hưởng ứng phong trào Lao động giỏi - Lao động sáng tạo 2026', N'cong-doan-tdmu-lao-dong-sang-tao-2026', N'Phong trào thi đua', N'Công đoàn Trường ĐH Thủ Dầu Một tích cực phát động phong trào đổi mới sáng tạo trong giảng dạy và NCKH.', N'<p>Nội dung chi tiết về phong trào thi đua sáng tạo của các cán bộ giảng viên...</p>', N'/images/lao-dong-sang-tao.jpg', 'Published', 1250, '2026-08-20 08:30:00'),
(4, N'Báo cáo hoạt động Công đoàn tháng 8/2026 của Viện Công nghệ số và các Tổ Công đoàn', N'bao-cao-hoat-dong-cong-doan-thang-8-2026', N'Thông báo', N'Tổng hợp kết quả công tác tuyên truyền và chăm lo đời sống đoàn viên các Tổ Công đoàn tháng 8/2026.', N'<p>Kế hoạch chi tiết và báo cáo thi đua của 16 Tổ Công đoàn toàn trường...</p>', N'/images/hoi-thao.jpg', 'Published', 980, '2026-08-24 09:00:00');

INSERT INTO dbo.VAN_BAN (MaNguoiDang, SoHieuVanBan, TenVanBan, LoaiVanBan, CoQuanBanHanh, NgayBanHanh, NguoiKy, TepDinhKem) VALUES
(1, N'15/NQ-CĐ', N'Nghị quyết Hội nghị Công đoàn cơ sở Trường Đại học Thủ Dầu Một lần thứ X', N'Nghị quyết', N'Công đoàn TDMU', '2025-12-25', N'TS. Lê Thị Kim Út', N'/uploads/van-ban/15-NQ-CD-2025.pdf'),
(2, N'08/HD-CĐ', N'Hướng dẫn đánh giá, phân loại Tổ Công đoàn và Đoàn viên xuất sắc năm học 2026', N'Hướng dẫn', N'Công đoàn TDMU', '2026-06-15', N'TS. Lê Thị Kim Út', N'/uploads/van-ban/08-HD-CD-2026.pdf'),
(2, N'BM-01/CĐ', N'Mẫu phiếu Lý lịch Công đoàn viên và Đơn xin gia nhập Công đoàn TDMU (Cập nhật 2026)', N'Biểu mẫu', N'Ban Thường vụ Công đoàn TDMU', '2026-01-10', N'Ban Thường vụ', N'/uploads/van-ban/BM-01-LyLichDoanVien.docx');
GO

-- -------------------------------------------------------------------------
-- 8. VIEWS: TỰ ĐỘNG THỐNG KÊ 16 TỔ CÔNG ĐOÀN VÀ BÀI VIẾT TRANG CHỦ
-- -------------------------------------------------------------------------
CREATE OR ALTER VIEW dbo.V_ThongKe_16ToCongDoan
AS
SELECT 
    t.MaToCongDoan,
    t.MaDinhDanh,
    t.TenToCongDoan,
    t.ToTruong,
    t.DiaChiVanPhong,
    COUNT(n.MaNhanSu) AS TongSoDoanVienHienTai,
    SUM(CASE WHEN n.GioiTinh = N'Nữ' THEN 1 ELSE 0 END) AS SoDoanVienNu
FROM dbo.TO_CONG_DOAN t
LEFT JOIN dbo.NHAN_SU n ON t.MaToCongDoan = n.MaToCongDoan AND n.TrangThai = 1
WHERE t.TrangThai = 1
GROUP BY t.MaToCongDoan, t.MaDinhDanh, t.TenToCongDoan, t.ToTruong, t.DiaChiVanPhong;
GO

CREATE OR ALTER VIEW dbo.V_TinTuc_TrangChu
AS
SELECT 
    tt.MaTinTuc,
    tt.TieuDe,
    tt.Slug,
    tt.ChuyenMuc,
    tt.TomTat,
    tt.HinhAnhDaiDien,
    tt.LuotXem,
    tt.NgayXuatBan,
    ns.HoVaTen AS TenTacGia,
    tcd.TenToCongDoan AS DonViTacGia
FROM dbo.TIN_TUC tt
INNER JOIN dbo.NHAN_SU ns ON tt.MaTacGia = ns.MaNhanSu
INNER JOIN dbo.TO_CONG_DOAN tcd ON ns.MaToCongDoan = tcd.MaToCongDoan
WHERE tt.TrangThai = 'Published' AND (tt.NgayXuatBan <= SYSDATETIME() OR tt.NgayXuatBan IS NULL);
GO

-- -------------------------------------------------------------------------
-- 9. STORED PROCEDURE: LẤY THỐNG KÊ DASHBOARD TOÀN HỆ THỐNG
-- -------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE dbo.sp_LayThongKeTongQuan
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        (SELECT COUNT(*) FROM dbo.TO_CONG_DOAN WHERE TrangThai = 1) AS TongSoToCongDoan,
        (SELECT COUNT(*) FROM dbo.NHAN_SU WHERE TrangThai = 1) AS TongSoDoanVien,
        (SELECT COUNT(*) FROM dbo.TIN_TUC WHERE TrangThai = 'Published') AS TongSoTinDaDang,
        (SELECT COUNT(*) FROM dbo.VAN_BAN) AS TongSoVanBan,
        (SELECT ISNULL(SUM(LuotXem), 0) FROM dbo.TIN_TUC) AS TongLuotXemTinTuc;
END;
GO
