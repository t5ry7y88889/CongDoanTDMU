-- =========================================================================
-- CƠ SỞ DỮ LIỆU 5 BẢNG CỐT LÕI - MICROSOFT SQL SERVER (SSMS)
-- Database Name: TDMU_CongDoan_DB (Bản chuẩn 16 Tổ Công đoàn TDMU)
-- =========================================================================

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'TDMU_CongDoan_DB')
BEGIN
    CREATE DATABASE [TDMU_CongDoan_DB];
END
GO

USE [TDMU_CongDoan_DB];
GO

IF OBJECT_ID(N'dbo.VAN_BAN', N'U') IS NOT NULL DROP TABLE dbo.VAN_BAN;
IF OBJECT_ID(N'dbo.TIN_TUC', N'U') IS NOT NULL DROP TABLE dbo.TIN_TUC;
IF OBJECT_ID(N'dbo.NHAN_SU', N'U') IS NOT NULL DROP TABLE dbo.NHAN_SU;
IF OBJECT_ID(N'dbo.TO_CONG_DOAN', N'U') IS NOT NULL DROP TABLE dbo.TO_CONG_DOAN;
IF OBJECT_ID(N'dbo.TO_CHUC', N'U') IS NOT NULL DROP TABLE dbo.TO_CHUC;
GO

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

-- INSERT 16 TO CONG DOAN
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
GO
