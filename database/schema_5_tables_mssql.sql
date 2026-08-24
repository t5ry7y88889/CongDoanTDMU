-- ========================================================================================
-- HỆ THỐNG CƠ SỞ DỮ LIỆU TOÀN DIỆN (ENTERPRISE PRODUCTION GRADE)
-- WEBSITE TRUYỀN THÔNG CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT (TDMU) TÍCH HỢP AI
-- Đơn vị: Viện Công nghệ số - Trường Đại học Thủ Dầu Một
-- Hệ quản trị: Microsoft SQL Server (T-SQL) - Database: TDMU_CongDoan_DB
-- ========================================================================================

USE master;
GO

IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = N'TDMU_CongDoan_DB')
BEGIN
    CREATE DATABASE [TDMU_CongDoan_DB];
END
GO

USE [TDMU_CongDoan_DB];
GO

-- 1. XÓA CÁC ĐỐI TƯỢNG CŨ THEO THỨ TỰ RÀNG BUỘC
IF OBJECT_ID(N'dbo.sp_ThongKe_TongQuan_Dashboard', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_ThongKe_TongQuan_Dashboard;
IF OBJECT_ID(N'dbo.sp_NopBaoCaoThang_ToCongDoan', N'P') IS NOT NULL DROP PROCEDURE dbo.sp_NopBaoCaoThang_ToCongDoan;
IF OBJECT_ID(N'dbo.V_BaoCaoThang_TongHop_16To', N'V') IS NOT NULL DROP VIEW dbo.V_BaoCaoThang_TongHop_16To;
IF OBJECT_ID(N'dbo.V_TinTuc_XuatBan_TrangChu', N'V') IS NOT NULL DROP VIEW dbo.V_TinTuc_XuatBan_TrangChu;
IF OBJECT_ID(N'dbo.V_ThongKe_16ToCongDoan', N'V') IS NOT NULL DROP VIEW dbo.V_ThongKe_16ToCongDoan;

IF OBJECT_ID(N'dbo.NHAT_KY_HE_THONG', N'U') IS NOT NULL DROP TABLE dbo.NHAT_KY_HE_THONG;
IF OBJECT_ID(N'dbo.LICH_DANG_BAI', N'U') IS NOT NULL DROP TABLE dbo.LICH_DANG_BAI;
IF OBJECT_ID(N'dbo.BINH_LUAN', N'U') IS NOT NULL DROP TABLE dbo.BINH_LUAN;
IF OBJECT_ID(N'dbo.LICH_SU_AI', N'U') IS NOT NULL DROP TABLE dbo.LICH_SU_AI;
IF OBJECT_ID(N'dbo.BAO_CAO_THANG', N'U') IS NOT NULL DROP TABLE dbo.BAO_CAO_THANG;
IF OBJECT_ID(N'dbo.VAN_BAN', N'U') IS NOT NULL DROP TABLE dbo.VAN_BAN;
IF OBJECT_ID(N'dbo.LOAI_VAN_BAN', N'U') IS NOT NULL DROP TABLE dbo.LOAI_VAN_BAN;
IF OBJECT_ID(N'dbo.TIN_TUC', N'U') IS NOT NULL DROP TABLE dbo.TIN_TUC;
IF OBJECT_ID(N'dbo.CHUYEN_MUC', N'U') IS NOT NULL DROP TABLE dbo.CHUYEN_MUC;
IF OBJECT_ID(N'dbo.NHAN_SU', N'U') IS NOT NULL DROP TABLE dbo.NHAN_SU;
IF OBJECT_ID(N'dbo.TO_CONG_DOAN', N'U') IS NOT NULL DROP TABLE dbo.TO_CONG_DOAN;
IF OBJECT_ID(N'dbo.TO_CHUC', N'U') IS NOT NULL DROP TABLE dbo.TO_CHUC;
GO

-- ========================================================================================
-- PHẦN 1: CÁC BẢNG CƠ CẤU TỔ CHỨC, NHÂN SỰ & DANH MỤC CỐT LÕI
-- ========================================================================================

-- 1. BẢNG TO_CHUC (Cơ cấu Ban Thường vụ, BCH, UBKT, Ban Nữ công, Ban Tuyên giáo cấp Trường)
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

-- 2. BẢNG TO_CONG_DOAN (16 Tổ Công đoàn cơ sở chính thức tại TDMU)
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

-- 3. BẢNG NHAN_SU (Hồ sơ Cán bộ, Giảng viên, Đoàn viên & Tài khoản Phân quyền)
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

-- 4. BẢNG CHUYEN_MUC (Danh mục chuyên đề tin tức & truyền thông)
CREATE TABLE dbo.CHUYEN_MUC (
    MaChuyenMuc INT IDENTITY(1,1) PRIMARY KEY,
    TenChuyenMuc NVARCHAR(150) NOT NULL,
    Slug NVARCHAR(150) NOT NULL CONSTRAINT UQ_CHUYEN_MUC_Slug UNIQUE,
    MoTa NVARCHAR(500) NULL,
    ThuTuHienThi INT NOT NULL CONSTRAINT DF_CHUYEN_MUC_ThuTu DEFAULT 1,
    TrangThai BIT NOT NULL CONSTRAINT DF_CHUYEN_MUC_TrangThai DEFAULT 1
);
GO

-- 5. BẢNG TIN_TUC (Quản trị Bài viết, Tin tức sự kiện, Phong trào thi đua)
CREATE TABLE dbo.TIN_TUC (
    MaTinTuc INT IDENTITY(1,1) PRIMARY KEY,
    MaTacGia INT NOT NULL,
    MaChuyenMuc INT NOT NULL,
    TieuDe NVARCHAR(255) NOT NULL,
    Slug NVARCHAR(255) NOT NULL CONSTRAINT UQ_TIN_TUC_Slug UNIQUE,
    TomTat NVARCHAR(MAX) NULL,
    NoiDung NVARCHAR(MAX) NOT NULL,
    HinhAnhDaiDien NVARCHAR(255) NULL,
    CoAIHoTro BIT NOT NULL CONSTRAINT DF_TIN_TUC_CoAI DEFAULT 0,
    TrangThai NVARCHAR(50) NOT NULL CONSTRAINT DF_TIN_TUC_TrangThai DEFAULT 'Draft' CONSTRAINT CK_TIN_TUC_TrangThai CHECK (TrangThai IN ('Draft', 'Pending', 'Approved', 'Published', 'Archived')),
    LuotXem INT NOT NULL CONSTRAINT DF_TIN_TUC_LuotXem DEFAULT 0,
    LuotTuongTac INT NOT NULL CONSTRAINT DF_TIN_TUC_LuotTuongTac DEFAULT 0,
    NgayXuatBan DATETIME2 NULL,
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_TIN_TUC_NgayTao DEFAULT SYSDATETIME(),
    NgayCapNhat DATETIME2 NOT NULL CONSTRAINT DF_TIN_TUC_NgayCapNhat DEFAULT SYSDATETIME(),
    CONSTRAINT FK_TIN_TUC_TacGia FOREIGN KEY (MaTacGia) REFERENCES dbo.NHAN_SU(MaNhanSu),
    CONSTRAINT FK_TIN_TUC_ChuyenMuc FOREIGN KEY (MaChuyenMuc) REFERENCES dbo.CHUYEN_MUC(MaChuyenMuc)
);
GO

-- 6. BẢNG LOAI_VAN_BAN (Phân loại văn bản pháp quy, quy chế, biểu mẫu)
CREATE TABLE dbo.LOAI_VAN_BAN (
    MaLoaiVanBan INT IDENTITY(1,1) PRIMARY KEY,
    TenLoaiVanBan NVARCHAR(150) NOT NULL,
    MoTa NVARCHAR(500) NULL,
    ThuTuHienThi INT NOT NULL CONSTRAINT DF_LOAI_VAN_BAN_ThuTu DEFAULT 1
);
GO

-- 7. BẢNG VAN_BAN (Kho Văn bản chỉ đạo, Nghị quyết, Kế hoạch, Biểu mẫu tải về)
CREATE TABLE dbo.VAN_BAN (
    MaVanBan INT IDENTITY(1,1) PRIMARY KEY,
    MaNguoiDang INT NOT NULL,
    MaLoaiVanBan INT NOT NULL,
    SoHieuVanBan NVARCHAR(100) NOT NULL,
    TenVanBan NVARCHAR(255) NOT NULL,
    CoQuanBanHanh NVARCHAR(150) NOT NULL,
    NgayBanHanh DATE NOT NULL,
    NguoiKy NVARCHAR(100) NULL,
    TepDinhKem NVARCHAR(255) NOT NULL,
    GhiChu NVARCHAR(MAX) NULL,
    NgayDang DATETIME2 NOT NULL CONSTRAINT DF_VAN_BAN_NgayDang DEFAULT SYSDATETIME(),
    CONSTRAINT FK_VAN_BAN_NguoiDang FOREIGN KEY (MaNguoiDang) REFERENCES dbo.NHAN_SU(MaNhanSu),
    CONSTRAINT FK_VAN_BAN_LoaiVanBan FOREIGN KEY (MaLoaiVanBan) REFERENCES dbo.LOAI_VAN_BAN(MaLoaiVanBan)
);
GO

-- ========================================================================================
-- PHẦN 2: CÁC BẢNG MỞ RỘNG THỰC TẾ (BÁO CÁO THÁNG 16 TỔ, AI, BÌNH LUẬN, LẬP LỊCH, AUDIT)
-- ========================================================================================

-- 8. BẢNG BAO_CAO_THANG (Báo cáo định kỳ & Đánh giá thi đua 16 Tổ Công đoàn theo Biểu mẫu thực tế)
CREATE TABLE dbo.BAO_CAO_THANG (
    MaBaoCao INT IDENTITY(1,1) PRIMARY KEY,
    MaToCongDoan INT NOT NULL,
    ThangBaoCao INT NOT NULL CONSTRAINT CK_BAO_CAO_THANG_Thang CHECK (ThangBaoCao BETWEEN 1 AND 12),
    NamBaoCao INT NOT NULL,
    HoTenNguoiBaoCao NVARCHAR(100) NOT NULL,
    EmailNguoiBaoCao NVARCHAR(100) NULL,
    ThoiGianGui DATETIME2 NOT NULL CONSTRAINT DF_BAO_CAO_THANG_ThoiGianGui DEFAULT SYSDATETIME(),
    
    -- Nhóm 1: Tình hình đoàn viên & Xây dựng Đảng
    TongSoCBNV_NLD INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_TongCBNV DEFAULT 0,
    TongSoDoanVien INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_TongDV DEFAULT 0,
    TongSoNuDoanVien INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_NuDV DEFAULT 0,
    SoDoanVienKetNap INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_KetNap DEFAULT 0,
    SoDoanVienGiamNghiViec INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_Giam DEFAULT 0,
    SoDoanVienUuTuSangDang INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_CamTinhDang DEFAULT 0,
    SoDoanVienKetNapDang INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_VaoDang DEFAULT 0,
    
    -- Nhóm 2: Chăm lo đời sống & An toàn lao động
    SoNguoiBenhHiemNgheo INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_HiemNgheo DEFAULT 0,
    SoNguoiDuocChamLo INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_DuocChamLo DEFAULT 0,
    TongTienChamLo DECIMAL(18,2) NOT NULL CONSTRAINT DF_BAO_CAO_THANG_TienChamLo DEFAULT 0,
    SoVuTaiNanLaoDong INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_TaiNan DEFAULT 0,
    SoNguoiChetTaiNan INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_ChetTaiNan DEFAULT 0,
    
    -- Nhóm 3: Kiểm tra, Tuyên truyền & Hoạt động phong trào
    SoBuoiKiemTra INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_KiemTra DEFAULT 0,
    NoiDungKiemTra NVARCHAR(MAX) NULL,
    KetQuaKiemTra NVARCHAR(MAX) NULL,
    SoBuoiTuyenTruyen INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_TuyenTruyen DEFAULT 0,
    SoNguoiThamDuTuyenTruyen INT NOT NULL CONSTRAINT DF_BAO_CAO_THANG_NguoiTuyenTruyen DEFAULT 0,
    NoiDungTuyenTruyen NVARCHAR(MAX) NULL,
    HoatDongKhac NVARCHAR(MAX) NULL,
    MinhChungUrl NVARCHAR(500) NULL,
    
    -- Nhóm 4: Kế hoạch tháng tới & Kiến nghị
    KeHoachThangToi NVARCHAR(MAX) NULL,
    KienNghiDeXuat NVARCHAR(MAX) NULL,
    TrangThaiDuyet NVARCHAR(50) NOT NULL CONSTRAINT DF_BAO_CAO_THANG_TrangThai DEFAULT 'Submitted' CONSTRAINT CK_BAO_CAO_THANG_TrangThai CHECK (TrangThaiDuyet IN ('Submitted', 'Reviewed', 'Approved')),
    CONSTRAINT FK_BAO_CAO_THANG_ToCongDoan FOREIGN KEY (MaToCongDoan) REFERENCES dbo.TO_CONG_DOAN(MaToCongDoan)
);
GO

-- 9. BẢNG LICH_SU_AI (Lưu vết Prompt, Model AI, Tokens & Nội dung tạo sinh)
CREATE TABLE dbo.LICH_SU_AI (
    MaLichSu INT IDENTITY(1,1) PRIMARY KEY,
    MaNhanSu INT NOT NULL,
    MaTinTuc INT NULL,
    LoaiTacVu NVARCHAR(50) NOT NULL, -- SinhBaiViet, GoiYTiêuĐề, TomTatSapo, SuaChinhTa
    PromptYeuCau NVARCHAR(MAX) NOT NULL,
    KetQuaTraVe NVARCHAR(MAX) NOT NULL,
    ModelSuDung NVARCHAR(100) NOT NULL, -- Gemini 1.5 Pro, LLaMA 3.3 70B, GPT-4o
    TokensTieuThu INT NULL,
    ThoiGianThucThi DATETIME2 NOT NULL CONSTRAINT DF_LICH_SU_AI_ThoiGian DEFAULT SYSDATETIME(),
    CONSTRAINT FK_LICH_SU_AI_NhanSu FOREIGN KEY (MaNhanSu) REFERENCES dbo.NHAN_SU(MaNhanSu),
    CONSTRAINT FK_LICH_SU_AI_TinTuc FOREIGN KEY (MaTinTuc) REFERENCES dbo.TIN_TUC(MaTinTuc) ON DELETE SET NULL
);
GO

-- 10. BẢNG BINH_LUAN (Tương tác hai chiều & Đóng góp ý kiến của Đoàn viên)
CREATE TABLE dbo.BINH_LUAN (
    MaBinhLuan INT IDENTITY(1,1) PRIMARY KEY,
    MaTinTuc INT NOT NULL,
    MaNhanSu INT NULL,
    HoTenNguoiBinhLuan NVARCHAR(100) NOT NULL,
    EmailNguoiBinhLuan NVARCHAR(100) NULL,
    NoiDungBinhLuan NVARCHAR(MAX) NOT NULL,
    TrangThaiDuyet BIT NOT NULL CONSTRAINT DF_BINH_LUAN_TrangThai DEFAULT 1,
    NgayBinhLuan DATETIME2 NOT NULL CONSTRAINT DF_BINH_LUAN_Ngay DEFAULT SYSDATETIME(),
    CONSTRAINT FK_BINH_LUAN_TinTuc FOREIGN KEY (MaTinTuc) REFERENCES dbo.TIN_TUC(MaTinTuc) ON DELETE CASCADE,
    CONSTRAINT FK_BINH_LUAN_NhanSu FOREIGN KEY (MaNhanSu) REFERENCES dbo.NHAN_SU(MaNhanSu) ON DELETE SET NULL
);
GO

-- 11. BẢNG LICH_DANG_BAI (Lập lịch tự động Cronjob & Đăng tải Fanpage Facebook)
CREATE TABLE dbo.LICH_DANG_BAI (
    MaLichDang INT IDENTITY(1,1) PRIMARY KEY,
    MaTinTuc INT NOT NULL,
    ThoiGianHenGio DATETIME2 NOT NULL,
    DangLenWeb BIT NOT NULL CONSTRAINT DF_LICH_DANG_Web DEFAULT 1,
    DangLenFacebook BIT NOT NULL CONSTRAINT DF_LICH_DANG_FB DEFAULT 0,
    FacebookPostID NVARCHAR(100) NULL,
    TrangThai NVARCHAR(50) NOT NULL CONSTRAINT DF_LICH_DANG_TrangThai DEFAULT 'Pending' CONSTRAINT CK_LICH_DANG_TrangThai CHECK (TrangThai IN ('Pending', 'Executed', 'Failed')),
    NhatKyThucThi NVARCHAR(MAX) NULL,
    NgayTao DATETIME2 NOT NULL CONSTRAINT DF_LICH_DANG_NgayTao DEFAULT SYSDATETIME(),
    CONSTRAINT FK_LICH_DANG_TinTuc FOREIGN KEY (MaTinTuc) REFERENCES dbo.TIN_TUC(MaTinTuc) ON DELETE CASCADE
);
GO

-- 12. BẢNG NHAT_KY_HE_THONG (Audit Logs - Lưu vết An ninh & Thao tác Quản trị)
CREATE TABLE dbo.NHAT_KY_HE_THONG (
    MaNhatKy INT IDENTITY(1,1) PRIMARY KEY,
    MaNhanSu INT NULL,
    HanhDong NVARCHAR(100) NOT NULL, -- DangNhap, ThemBaiViet, DuyetBai, XoaVanBan, XuatBan
    DoiTuongTacDong NVARCHAR(100) NOT NULL, -- TIN_TUC, VAN_BAN, BAO_CAO_THANG, NHAN_SU
    MaDoiTuong INT NULL,
    ChiTietThaoTac NVARCHAR(MAX) NULL,
    DiaChiIP NVARCHAR(50) NULL,
    ThoiGian DATETIME2 NOT NULL CONSTRAINT DF_NHAT_KY_ThoiGian DEFAULT SYSDATETIME(),
    CONSTRAINT FK_NHAT_KY_NhanSu FOREIGN KEY (MaNhanSu) REFERENCES dbo.NHAN_SU(MaNhanSu) ON DELETE SET NULL
);
GO

-- ========================================================================================
-- PHẦN 3: ĐÁNH CHỈ MỤC TỐI ƯU HIỆU NĂNG TRUY VẤN (INDEXING)
-- ========================================================================================

CREATE NONCLUSTERED INDEX IX_TIN_TUC_TrangThai_XuatBan ON dbo.TIN_TUC (TrangThai, NgayXuatBan DESC) INCLUDE (TieuDe, Slug, MaChuyenMuc, HinhAnhDaiDien, LuotXem);
CREATE NONCLUSTERED INDEX IX_NHAN_SU_ToCongDoan ON dbo.NHAN_SU (MaToCongDoan) INCLUDE (HoVaTen, Email, ChucVuCongDoan, VaiTroHeThong);
CREATE NONCLUSTERED INDEX IX_VAN_BAN_Loai_Ngay ON dbo.VAN_BAN (MaLoaiVanBan, NgayBanHanh DESC) INCLUDE (SoHieuVanBan, TenVanBan, TepDinhKem);
CREATE NONCLUSTERED INDEX IX_BAO_CAO_THANG_ThangNam ON dbo.BAO_CAO_THANG (NamBaoCao DESC, ThangBaoCao DESC, MaToCongDoan);
GO

-- ========================================================================================
-- PHẦN 4: DỮ LIỆU MẪU THỰC TẾ TỪ CÔNG ĐOÀN TRƯỜNG ĐẠI HỌC THỦ DẦU MỘT
-- ========================================================================================

-- 1. Insert TO_CHUC
INSERT INTO dbo.TO_CHUC (TenToChuc, NhiemKy, MoTaChucNang, ThuTuHienThi) VALUES
(N'Ban Thường vụ', N'Nhiệm kỳ 2023 - 2028', N'Lãnh đạo, điều hành toàn diện hoạt động Công đoàn giữa hai kỳ họp BCH', 1),
(N'Ban Chấp hành', N'Nhiệm kỳ 2023 - 2028', N'Cơ quan lãnh đạo cao nhất của Công đoàn cơ sở TDMU', 2),
(N'Ủy ban Kiểm tra', N'Nhiệm kỳ 2023 - 2028', N'Kiểm tra việc chấp hành Điều lệ Công đoàn và quản lý tài chính', 3),
(N'Ban Nữ công', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách phong trào nữ cán bộ giảng viên Giỏi việc trường - Đảm việc nhà', 4),
(N'Ban Tuyên giáo - Thi đua', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách công tác truyền thông, học tập chính trị và phong trào thi đua', 5);

-- 2. Insert 16 TO_CONG_DOAN
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

-- 3. Insert NHAN_SU
INSERT INTO dbo.NHAN_SU (MaToCongDoan, MaToChuc, MaCanBo, HoVaTen, GioiTinh, Email, HocHamHocVi, ChucVuCongDoan, ChucVuChuyenMon, VaiTroHeThong) VALUES
(9, 1, N'CB001', N'TS. Lê Thị Kim Út', N'Nữ', N'utltk@tdmu.edu.vn', N'Tiến sĩ', N'Chủ tịch Công đoàn', N'Giảng viên cao cấp', 'Admin'),
(9, 1, N'CB002', N'ThS. Võ Quốc Lương', N'Nam', N'luongvq@tdmu.edu.vn', N'Thạc sĩ', N'Ủy viên Ban Thường vụ', N'Giảng viên chính Viện CNS', 'Editor'),
(11, 3, N'CB003', N'Huỳnh Thị Lệ Kha', N'Nữ', N'khahl@tdmu.edu.vn', N'Thạc sĩ', N'Tổ trưởng CĐ Trường Luật', N'Giảng viên', 'Editor'),
(9, 5, N'CB004', N'Hồ Ngọc Trung Kiên', N'Nam', N'kienhnt@tdmu.edu.vn', N'Thạc sĩ', N'Tổ trưởng CĐ Viện CNS', N'Giảng viên', 'Editor'),
(15, NULL, N'CB005', N'Nguyễn Thụy Bảo Khuyên', N'Nữ', N'khuyenntb@tdmu.edu.vn', N'Thạc sĩ', N'Tổ trưởng CĐ KTTC 2', N'Giảng viên', 'Editor'),
(4, NULL, N'CB006', N'Nguyễn Thị Hương', N'Nữ', N'huongnt@tdmu.edu.vn', N'Cử nhân', N'Tổ trưởng Công đoàn 4', N'Chuyên viên', 'Editor'),
(9, NULL, N'CB007', N'Nguyễn Bình Dương', N'Nam', N'2424802010319@student.tdmu.edu.vn', N'Cử nhân', N'Đoàn viên', N'Cộng tác viên truyền thông', 'Contributor');

-- 4. Insert CHUYEN_MUC
INSERT INTO dbo.CHUYEN_MUC (TenChuyenMuc, Slug, MoTa, ThuTuHienThi) VALUES
(N'Tin hoạt động Công đoàn', N'tin-hoat-dong', N'Tin tức sự kiện và hoạt động điều hành của Công đoàn TDMU', 1),
(N'Thông báo - Chỉ đạo', N'thong-bao-chi-dao', N'Các thông báo khẩn, kế hoạch và chỉ đạo của Ban Chấp hành', 2),
(N'Phong trào thi đua', N'phong-trao-thi-dua', N'Lao động giỏi, sáng tạo, hội thao và văn hóa văn nghệ', 3),
(N'Chăm lo đời sống & Phúc lợi', N'cham-lo-doi-song', N'Chế độ chính sách, bảo hiểm, thăm hỏi ốm đau, hiếu hỉ', 4);

-- 5. Insert TIN_TUC
INSERT INTO dbo.TIN_TUC (MaTacGia, MaChuyenMuc, TieuDe, Slug, TomTat, NoiDung, HinhAnhDaiDien, CoAIHoTro, TrangThai, LuotXem, LuotTuongTac, NgayXuatBan) VALUES
(2, 3, N'Công đoàn TDMU hưởng ứng phong trào Lao động giỏi - Lao động sáng tạo 2026', N'cong-doan-tdmu-huong-ung-phong-trao-lao-dong-sang-tao-2026', N'Công đoàn Trường ĐH Thủ Dầu Một tích cực phát động phong trào đổi mới sáng tạo trong giảng dạy và NCKH.', N'<p>Nội dung chi tiết về phong trào thi đua sáng tạo của các cán bộ giảng viên...</p>', N'/images/lao-dong-sang-tao.jpg', 1, 'Published', 1250, 86, '2026-08-20 08:30:00'),
(4, 2, N'Báo cáo hoạt động Công đoàn tháng 8/2026 của Viện Công nghệ số và các Tổ Công đoàn', N'bao-cao-hoat-dong-cong-doan-thang-8-2026', N'Tổng hợp kết quả công tác tuyên truyền và chăm lo đời sống đoàn viên các Tổ Công đoàn tháng 8/2026.', N'<p>Kế hoạch chi tiết và báo cáo thi đua của 16 Tổ Công đoàn toàn trường...</p>', N'/images/hoi-thao.jpg', 1, 'Published', 980, 54, '2026-08-24 09:00:00');

-- 6. Insert LOAI_VAN_BAN
INSERT INTO dbo.LOAI_VAN_BAN (TenLoaiVanBan, MoTa, ThuTuHienThi) VALUES
(N'Nghị quyết', N'Nghị quyết Đại hội và Hội nghị Công đoàn các cấp', 1),
(N'Quyết định', N'Quyết định chuẩn y, thành lập, khen thưởng', 2),
(N'Kế hoạch - Hướng dẫn', N'Kế hoạch hoạt động năm học và hướng dẫn thi đua', 3),
(N'Biểu mẫu hành chính', N'Đơn gia nhập, lý lịch đoàn viên, mẫu báo cáo', 4);

-- 7. Insert VAN_BAN
INSERT INTO dbo.VAN_BAN (MaNguoiDang, MaLoaiVanBan, SoHieuVanBan, TenVanBan, CoQuanBanHanh, NgayBanHanh, NguoiKy, TepDinhKem) VALUES
(1, 1, N'15/NQ-CĐ', N'Nghị quyết Hội nghị Công đoàn cơ sở Trường Đại học Thủ Dầu Một lần thứ X', N'Công đoàn TDMU', '2025-12-25', N'TS. Lê Thị Kim Út', N'/uploads/van-ban/15-NQ-CD-2025.pdf'),
(2, 3, N'08/HD-CĐ', N'Hướng dẫn đánh giá, phân loại Tổ Công đoàn và Đoàn viên xuất sắc năm học 2026', N'Công đoàn TDMU', '2026-06-15', N'TS. Lê Thị Kim Út', N'/uploads/van-ban/08-HD-CD-2026.pdf'),
(2, 4, N'BM-01/CĐ', N'Mẫu phiếu Lý lịch Công đoàn viên và Đơn xin gia nhập Công đoàn TDMU (Cập nhật 2026)', N'Ban Thường vụ Công đoàn TDMU', '2026-01-10', N'Ban Thường vụ', N'/uploads/van-ban/BM-01-LyLichDoanVien.docx');

-- 8. Insert DỮ LIỆU THỰC TẾ 4 BÁO CÁO THÁNG 8/2026 TỪ CÁC TỔ CÔNG ĐOÀN
INSERT INTO dbo.BAO_CAO_THANG (
    MaToCongDoan, ThangBaoCao, NamBaoCao, HoTenNguoiBaoCao, ThoiGianGui,
    TongSoCBNV_NLD, TongSoDoanVien, TongSoNuDoanVien, SoDoanVienKetNap, SoDoanVienGiamNghiViec, SoDoanVienUuTuSangDang, SoDoanVienKetNapDang,
    SoNguoiBenhHiemNgheo, SoNguoiDuocChamLo, TongTienChamLo, SoVuTaiNanLaoDong, SoNguoiChetTaiNan,
    SoBuoiKiemTra, SoBuoiTuyenTruyen, SoNguoiThamDuTuyenTruyen, NoiDungTuyenTruyen, HoatDongKhac, MinhChungUrl, KeHoachThangToi, KienNghiDeXuat, TrangThaiDuyet
) VALUES
(9, 8, 2026, N'Hồ Ngọc Trung Kiên', '2026-08-24 07:58:17', 66, 66, 17, 0, 0, 0, 0, 1, 3, 1500000, 0, 0, 0, 2, 66, N'- Tuyên truyền kỷ niệm 97 năm ngày thành lập Công đoàn Việt Nam; - Tuyên truyền Nghị quyết Đại hội Công đoàn TP.HCM lần thứ I (2025-2030).', N'Hoàn thành đánh giá thi đua năm học.', NULL, N'1. Tổ chức Tết Trung thu; 2. Tổ chức khám sức khỏe CĐV theo kế hoạch Công đoàn Trường.', N'Không', 'Approved'),
(11, 8, 2026, N'Huỳnh Thị Lệ Kha', '2026-08-24 08:27:20', 51, 51, 17, 0, 0, 1, 0, 0, 3, 3800000, 0, 0, 0, 3, 51, N'- Tuyên truyền Nghị quyết Đại hội Công đoàn TP.HCM lần thứ I; - 97 năm ngày thành lập Công đoàn Việt Nam (27/8/1929 - 27/8/2026).', N'1. 30 CĐV cam kết làm theo Bác; 2. Tham dự Tọa đàm Dinh dưỡng lành mạnh.', NULL, N'1. Phối hợp Viện CN Xanh tổ chức Tết Trung thu; 2. Sinh nhật CĐV Quý 3.', N'Không', 'Approved'),
(15, 8, 2026, N'Nguyễn Thụy Bảo Khuyên', '2026-08-24 08:32:01', 42, 42, 31, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 42, N'Vận động CĐV tham gia Hiến máu nhân đạo (16/8).', N'1. Họp xét thi đua công đoàn NH 2025-2026; 2. Phối hợp trường KTTC họp xét thi đua.', NULL, N'1. Tham gia các hoạt động CĐCS phát động; 2. Chăm lo CĐV theo quy định.', N'Không', 'Approved'),
(4, 8, 2026, N'Nguyễn Thị Hương', '2026-08-24 08:44:45', 23, 23, 11, 0, 0, 0, 0, 0, 15, 1900000, 0, 0, 0, 2, 23, N'Kỷ niệm 81 năm Cách mạng tháng Tám và Quốc khánh 2/9.', N'Minh chứng hoạt động gửi qua link Drive.', N'https://drive.google.com/open?id=14uZ3gcXFNrGescFh5neJd-w7KRVS-BX0', N'Tiếp tục phối hợp thực hiện các phong trào Công đoàn Trường.', N'Không', 'Approved');

-- 9. Insert LICH_SU_AI
INSERT INTO dbo.LICH_SU_AI (MaNhanSu, MaTinTuc, LoaiTacVu, PromptYeuCau, KetQuaTraVe, ModelSuDung, TokensTieuThu) VALUES
(2, 1, N'SinhBaiViet', N'Viết bài tuyên truyền phong trào Lao động giỏi Lao động sáng tạo Công đoàn TDMU 2026', N'Nội dung chi tiết bài viết chuẩn văn phong Công đoàn...', N'Groq LLaMA 3.3 70B', 850),
(2, 2, N'TomTatSapo', N'Tóm tắt báo cáo thi đua tháng 8 của 16 tổ công đoàn thành 50 từ', N'Tổng hợp kết quả công tác tuyên truyền và chăm lo đời sống đoàn viên các Tổ Công đoàn tháng 8/2026.', N'Gemini 1.5 Pro', 210);
GO

-- ========================================================================================
-- PHẦN 5: CÁC KHUNG NHÌN THỐNG KÊ (VIEWS)
-- ========================================================================================

-- View 1: Thống kê số lượng đoàn viên 16 Tổ Công đoàn
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

-- View 2: Bài viết xuất bản hiển thị Trang chủ
CREATE OR ALTER VIEW dbo.V_TinTuc_XuatBan_TrangChu
AS
SELECT 
    tt.MaTinTuc,
    tt.TieuDe,
    tt.Slug,
    cm.TenChuyenMuc,
    tt.TomTat,
    tt.HinhAnhDaiDien,
    tt.CoAIHoTro,
    tt.LuotXem,
    tt.LuotTuongTac,
    tt.NgayXuatBan,
    ns.HoVaTen AS TenTacGia,
    tcd.TenToCongDoan AS DonViTacGia
FROM dbo.TIN_TUC tt
INNER JOIN dbo.CHUYEN_MUC cm ON tt.MaChuyenMuc = cm.MaChuyenMuc
INNER JOIN dbo.NHAN_SU ns ON tt.MaTacGia = ns.MaNhanSu
INNER JOIN dbo.TO_CONG_DOAN tcd ON ns.MaToCongDoan = tcd.MaToCongDoan
WHERE tt.TrangThai = 'Published' AND (tt.NgayXuatBan <= SYSDATETIME() OR tt.NgayXuatBan IS NULL);
GO

-- View 3: Bảng Tổng hợp Kết quả Báo cáo Tháng của 16 Tổ Công đoàn
CREATE OR ALTER VIEW dbo.V_BaoCaoThang_TongHop_16To
AS
SELECT 
    bc.MaBaoCao,
    tcd.MaDinhDanh,
    tcd.TenToCongDoan,
    bc.ThangBaoCao,
    bc.NamBaoCao,
    bc.HoTenNguoiBaoCao,
    bc.ThoiGianGui,
    bc.TongSoCBNV_NLD,
    bc.TongSoDoanVien,
    bc.TongSoNuDoanVien,
    bc.SoNguoiDuocChamLo,
    bc.TongTienChamLo,
    bc.SoBuoiTuyenTruyen,
    bc.SoNguoiThamDuTuyenTruyen,
    bc.NoiDungTuyenTruyen,
    bc.KeHoachThangToi,
    bc.TrangThaiDuyet
FROM dbo.BAO_CAO_THANG bc
INNER JOIN dbo.TO_CONG_DOAN tcd ON bc.MaToCongDoan = tcd.MaToCongDoan;
GO

-- ========================================================================================
-- PHẦN 6: THỦ TỤC LƯU TRỮ (STORED PROCEDURES)
-- ========================================================================================

-- Procedure 1: Lấy số liệu Thống kê Dashboard toàn hệ thống
CREATE OR ALTER PROCEDURE dbo.sp_ThongKe_TongQuan_Dashboard
AS
BEGIN
    SET NOCOUNT ON;
    SELECT 
        (SELECT COUNT(*) FROM dbo.TO_CONG_DOAN WHERE TrangThai = 1) AS TongSoToCongDoan,
        (SELECT COUNT(*) FROM dbo.NHAN_SU WHERE TrangThai = 1) AS TongSoDoanVien,
        (SELECT COUNT(*) FROM dbo.TIN_TUC WHERE TrangThai = 'Published') AS TongSoTinDaDang,
        (SELECT COUNT(*) FROM dbo.VAN_BAN) AS TongSoVanBan,
        (SELECT COUNT(*) FROM dbo.BAO_CAO_THANG) AS TongSoBaoCaoThangDaNop,
        (SELECT ISNULL(SUM(TongTienChamLo), 0) FROM dbo.BAO_CAO_THANG) AS TongKinhPhiChamLoThang,
        (SELECT ISNULL(SUM(LuotXem), 0) FROM dbo.TIN_TUC) AS TongLuotXemTinTuc;
END;
GO
