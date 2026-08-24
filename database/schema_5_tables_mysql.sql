-- =========================================================================
-- CƠ SỞ DỮ LIỆU 5 BẢNG CỐT LÕI - MICROSOFT SQL SERVER (SSMS)
-- Database Name: TDMU_CongDoan_DB
-- =========================================================================

-- 1. Tạo Database nếu chưa tồn tại
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'TDMU_CongDoan_DB')
BEGIN
    CREATE DATABASE [TDMU_CongDoan_DB];
END
GO

USE [TDMU_CongDoan_DB];
GO

-- -------------------------------------------------------------------------
-- 1. BẢNG TO_CHUC (Cơ cấu Ban Chấp hành & Các Ban chuyên môn cấp Trường)
-- -------------------------------------------------------------------------
CREATE TABLE dbo.TO_CHUC (
    MaToChuc INT IDENTITY(1,1) PRIMARY KEY,
    TenToChuc NVARCHAR(150) NOT NULL,              -- Ban Thường vụ, Ban Chấp hành, Ủy ban Kiểm tra, Ban Nữ công...
    NhiemKy NVARCHAR(50) NOT NULL,                 -- Khóa X (2023 - 2028)
    MoTaChucNang NVARCHAR(MAX) NULL,               -- Chức năng, nhiệm vụ của ban
    ThuTuHienThi INT NOT NULL CONSTRAINT DF_TO_CHUC_ThuTu DEFAULT 1,
    TrangThai BIT NOT NULL CONSTRAINT DF_TO_CHUC_TrangThai DEFAULT 1, -- 1: Đang hoạt động, 0: Đã kết thúc
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_TO_CHUC_NgayTao DEFAULT SYSDATETIME()
);
GO

-- -------------------------------------------------------------------------
-- 2. BẢNG TO_CONG_DOAN (Tổ Công đoàn cơ sở trực thuộc các Viện / Khoa / Phòng)
-- -------------------------------------------------------------------------
CREATE TABLE dbo.TO_CONG_DOAN (
    MaToCongDoan INT IDENTITY(1,1) PRIMARY KEY,
    MaDinhDanh NVARCHAR(50) NOT NULL CONSTRAINT UQ_TO_CONG_DOAN_MaDinhDanh UNIQUE, -- TCD_V_CNS, TCD_K_KT...
    TenToCongDoan NVARCHAR(150) NOT NULL,          -- Tổ Công đoàn Viện Công nghệ số, Tổ CĐ Khoa Kinh tế...
    ToTruong NVARCHAR(100) NULL,                   -- Họ tên cán bộ Tổ trưởng
    EmailLienHe NVARCHAR(100) NULL,                -- Email liên hệ của tổ
    SoDienThoai NVARCHAR(20) NULL,                 -- Số điện thoại
    DiaChiVanPhong NVARCHAR(150) NULL,             -- Phòng làm việc (vd: Phòng B1-204)
    TrangThai BIT NOT NULL CONSTRAINT DF_TO_CONG_DOAN_TrangThai DEFAULT 1,
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_TO_CONG_DOAN_NgayTao DEFAULT SYSDATETIME()
);
GO

-- -------------------------------------------------------------------------
-- 3. BẢNG NHAN_SU (Cán bộ Ban Chấp hành, Tổ trưởng & Công đoàn viên)
-- -------------------------------------------------------------------------
CREATE TABLE dbo.NHAN_SU (
    MaNhanSu INT IDENTITY(1,1) PRIMARY KEY,
    MaToCongDoan INT NOT NULL,                    -- Mọi đoàn viên bắt buộc thuộc 1 Tổ CĐ cơ sở
    MaToChuc INT NULL,                            -- Cán bộ kiêm nhiệm thuộc Ban BCH cấp trường (nếu có)
    MaCanBo NVARCHAR(50) NOT NULL CONSTRAINT UQ_NHAN_SU_MaCanBo UNIQUE, -- Mã số viên chức / giảng viên TDMU
    HoVaTen NVARCHAR(100) NOT NULL,                -- Họ và tên
    GioiTinh NVARCHAR(10) NOT NULL CONSTRAINT DF_NHAN_SU_GioiTinh DEFAULT N'Nam' CONSTRAINT CK_NHAN_SU_GioiTinh CHECK (GioiTinh IN (N'Nam', N'Nữ', N'Khác')),
    NgaySinh DATE NULL,
    Email NVARCHAR(100) NOT NULL CONSTRAINT UQ_NHAN_SU_Email UNIQUE, -- Email @tdmu.edu.vn (Tên đăng nhập)
    SoDienThoai NVARCHAR(20) NULL,
    MatKhau NVARCHAR(255) NULL,                    -- Mật khẩu băm (Hash)
    HocHamHocVi NVARCHAR(50) NULL,                 -- GS, PGS, TS, ThS, Cử nhân...
    ChucVuCongDoan NVARCHAR(100) NOT NULL CONSTRAINT DF_NHAN_SU_ChucVuCD DEFAULT N'Đoàn viên', -- Chủ tịch, Phó Chủ tịch, UV BTV, Tổ trưởng, Đoàn viên
    ChucVuChuyenMon NVARCHAR(100) NULL,            -- Trưởng khoa, Giảng viên chính, Chuyên viên
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
    MaTacGia INT NOT NULL,                        -- Cán bộ biên soạn bài viết
    TieuDe NVARCHAR(255) NOT NULL,                 -- Tiêu đề bài viết
    Slug NVARCHAR(255) NOT NULL CONSTRAINT UQ_TIN_TUC_Slug UNIQUE,
    ChuyenMuc NVARCHAR(100) NOT NULL,              -- Tin hoạt động, Thông báo, Phong trào thi đua, Chăm lo đời sống
    TomTat NVARCHAR(MAX) NULL,                     -- Đoạn tóm tắt (Sapo)
    NoiDung NVARCHAR(MAX) NOT NULL,                -- Nội dung chi tiết bài viết (HTML)
    HinhAnhDaiDien NVARCHAR(255) NULL,             -- URL ảnh bìa
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
    MaNguoiDang INT NOT NULL,                     -- Cán bộ tiếp nhận & upload văn bản
    SoHieuVanBan NVARCHAR(100) NOT NULL,           -- Số hiệu (vd: 15/NQ-CĐ, 08/HD-CĐ, BM-01/CĐ)
    TenVanBan NVARCHAR(255) NOT NULL,              -- Trích yếu nội dung văn bản
    LoaiVanBan NVARCHAR(100) NOT NULL,             -- Nghị quyết, Quyết định, Kế hoạch, Hướng dẫn, Quy chế, Biểu mẫu
    CoQuanBanHanh NVARCHAR(150) NOT NULL,          -- Công đoàn TDMU, LĐLĐ Tỉnh Bình Dương, Tổng LĐLĐ VN
    NgayBanHanh DATE NOT NULL,                    -- Ngày ký ban hành
    NguoiKy NVARCHAR(100) NULL,                    -- Họ tên người ký
    TepDinhKem NVARCHAR(255) NOT NULL,             -- Đường dẫn file (PDF/DOCX)
    GhiChu NVARCHAR(MAX) NULL,                     -- Ghi chú thêm
    NgayDang DATETIME2 NOT NULL CONSTRAINT DF_VAN_BAN_NgayDang DEFAULT SYSDATETIME(),
    CONSTRAINT FK_VAN_BAN_NguoiDang FOREIGN KEY (MaNguoiDang) REFERENCES dbo.NHAN_SU(MaNhanSu)
);
GO

