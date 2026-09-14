-- =========================================================================
-- MIGRATION: RENAME ALL TABLES & COLUMNS TO ENGLISH IDENTIFIERS
-- Database: TDMU_TradeUnion_DB | Microsoft SQL Server
-- Converts Vietnamese identifiers to English while PRESERVING all data.
-- Idempotent: safe to re-run (guarded by sys.objects / sys.columns checks).
-- =========================================================================
USE TDMU_TradeUnion_DB;
GO

-- =========================================================================
-- TABLE RENAMES
-- =========================================================================
IF OBJECT_ID('dbo.TO_CHUC') IS NOT NULL
EXEC sp_rename 'dbo.TO_CHUC', 'ORGANIZATIONS';
GO

IF OBJECT_ID('dbo.TO_CONG_DOAN') IS NOT NULL
EXEC sp_rename 'dbo.TO_CONG_DOAN', 'UNION_GROUPS';
GO

IF OBJECT_ID('dbo.NHAN_SU') IS NOT NULL
EXEC sp_rename 'dbo.NHAN_SU', 'STAFF';
GO

IF OBJECT_ID('dbo.PHUC_LOI') IS NOT NULL
EXEC sp_rename 'dbo.PHUC_LOI', 'BENEFITS';
GO

IF OBJECT_ID('dbo.DON_TRO_CAP') IS NOT NULL
EXEC sp_rename 'dbo.DON_TRO_CAP', 'WELFARE_APPLICATIONS';
GO

IF OBJECT_ID('dbo.INBOX_FEEDBACK') IS NOT NULL
EXEC sp_rename 'dbo.INBOX_FEEDBACK', 'FEEDBACK';
GO

-- =========================================================================
-- ORGANIZATIONS (was TO_CHUC)
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ORGANIZATIONS') AND name = 'MaToChuc') EXEC sp_rename 'dbo.ORGANIZATIONS.MaToChuc', 'OrganizationId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ORGANIZATIONS') AND name = 'TenToChuc') EXEC sp_rename 'dbo.ORGANIZATIONS.TenToChuc', 'Name', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ORGANIZATIONS') AND name = 'NhiemKy') EXEC sp_rename 'dbo.ORGANIZATIONS.NhiemKy', 'Term', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ORGANIZATIONS') AND name = 'MoTaChucNang') EXEC sp_rename 'dbo.ORGANIZATIONS.MoTaChucNang', 'Description', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ORGANIZATIONS') AND name = 'ThuTuHienThi') EXEC sp_rename 'dbo.ORGANIZATIONS.ThuTuHienThi', 'DisplayOrder', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ORGANIZATIONS') AND name = 'TrangThai') EXEC sp_rename 'dbo.ORGANIZATIONS.TrangThai', 'IsActive', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ORGANIZATIONS') AND name = 'NgayTao') EXEC sp_rename 'dbo.ORGANIZATIONS.NgayTao', 'CreatedDate', 'COLUMN';
GO

-- =========================================================================
-- UNION_GROUPS (was TO_CONG_DOAN)
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'MaToCongDoan') EXEC sp_rename 'dbo.UNION_GROUPS.MaToCongDoan', 'UnionGroupId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'MaDinhDanh') EXEC sp_rename 'dbo.UNION_GROUPS.MaDinhDanh', 'Code', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'TenToCongDoan') EXEC sp_rename 'dbo.UNION_GROUPS.TenToCongDoan', 'Name', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'ToTruong') EXEC sp_rename 'dbo.UNION_GROUPS.ToTruong', 'LeaderName', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'EmailLienHe') EXEC sp_rename 'dbo.UNION_GROUPS.EmailLienHe', 'Email', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'SoDienThoai') EXEC sp_rename 'dbo.UNION_GROUPS.SoDienThoai', 'Phone', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'DiaChiVanPhong') EXEC sp_rename 'dbo.UNION_GROUPS.DiaChiVanPhong', 'OfficeAddress', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'TrangThai') EXEC sp_rename 'dbo.UNION_GROUPS.TrangThai', 'IsActive', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.UNION_GROUPS') AND name = 'NgayTao') EXEC sp_rename 'dbo.UNION_GROUPS.NgayTao', 'CreatedDate', 'COLUMN';
GO

-- =========================================================================
-- STAFF (was NHAN_SU)
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'MaNhanSu') EXEC sp_rename 'dbo.STAFF.MaNhanSu', 'StaffId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'MaToCongDoan') EXEC sp_rename 'dbo.STAFF.MaToCongDoan', 'UnionGroupId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'MaToChuc') EXEC sp_rename 'dbo.STAFF.MaToChuc', 'OrganizationId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'MaCanBo') EXEC sp_rename 'dbo.STAFF.MaCanBo', 'StaffCode', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'HoVaTen') EXEC sp_rename 'dbo.STAFF.HoVaTen', 'FullName', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'GioiTinh') EXEC sp_rename 'dbo.STAFF.GioiTinh', 'Gender', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'NgaySinh') EXEC sp_rename 'dbo.STAFF.NgaySinh', 'DateOfBirth', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'SoDienThoai') EXEC sp_rename 'dbo.STAFF.SoDienThoai', 'Phone', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'HocHamHocVi') EXEC sp_rename 'dbo.STAFF.HocHamHocVi', 'AcademicTitle', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'ChucVuCongDoan') EXEC sp_rename 'dbo.STAFF.ChucVuCongDoan', 'UnionRole', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'ChucVuChuyenMon') EXEC sp_rename 'dbo.STAFF.ChucVuChuyenMon', 'ProfessionalRole', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'TrangThai') EXEC sp_rename 'dbo.STAFF.TrangThai', 'IsActive', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.STAFF') AND name = 'NgayTao') EXEC sp_rename 'dbo.STAFF.NgayTao', 'CreatedDate', 'COLUMN';
GO

-- =========================================================================
-- CATEGORIES
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CATEGORIES') AND name = 'TenChuyenMuc') EXEC sp_rename 'dbo.CATEGORIES.TenChuyenMuc', 'Name', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CATEGORIES') AND name = 'MoTa') EXEC sp_rename 'dbo.CATEGORIES.MoTa', 'Description', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CATEGORIES') AND name = 'ThuTu') EXEC sp_rename 'dbo.CATEGORIES.ThuTu', 'DisplayOrder', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CATEGORIES') AND name = 'TrangThai') EXEC sp_rename 'dbo.CATEGORIES.TrangThai', 'IsActive', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CATEGORIES') AND name = 'NgayTao') EXEC sp_rename 'dbo.CATEGORIES.NgayTao', 'CreatedDate', 'COLUMN';
GO

-- =========================================================================
-- ARTICLES
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'MaTacGia') EXEC sp_rename 'dbo.ARTICLES.MaTacGia', 'AuthorId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'TieuDe') EXEC sp_rename 'dbo.ARTICLES.TieuDe', 'Title', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'TomTat') EXEC sp_rename 'dbo.ARTICLES.TomTat', 'Summary', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'NoiDung') EXEC sp_rename 'dbo.ARTICLES.NoiDung', 'Content', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'HinhAnhDaiDien') EXEC sp_rename 'dbo.ARTICLES.HinhAnhDaiDien', 'FeaturedImage', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'NoiDungFB') EXEC sp_rename 'dbo.ARTICLES.NoiDungFB', 'FacebookContent', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'NoiDungZalo') EXEC sp_rename 'dbo.ARTICLES.NoiDungZalo', 'ZaloContent', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'TrangThai') EXEC sp_rename 'dbo.ARTICLES.TrangThai', 'Status', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'LuotXem') EXEC sp_rename 'dbo.ARTICLES.LuotXem', 'ViewCount', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'LuotThich') EXEC sp_rename 'dbo.ARTICLES.LuotThich', 'LikeCount', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'NgayXuatBan') EXEC sp_rename 'dbo.ARTICLES.NgayXuatBan', 'PublishedDate', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'NgayTao') EXEC sp_rename 'dbo.ARTICLES.NgayTao', 'CreatedDate', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLES') AND name = 'NgayCapNhat') EXEC sp_rename 'dbo.ARTICLES.NgayCapNhat', 'UpdatedDate', 'COLUMN';
GO

-- =========================================================================
-- DOCUMENTS
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'MaNguoiDang') EXEC sp_rename 'dbo.DOCUMENTS.MaNguoiDang', 'UploadedById', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'SoHieuVanBan') EXEC sp_rename 'dbo.DOCUMENTS.SoHieuVanBan', 'ReferenceNumber', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'TenVanBan') EXEC sp_rename 'dbo.DOCUMENTS.TenVanBan', 'Title', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'LoaiVanBan') EXEC sp_rename 'dbo.DOCUMENTS.LoaiVanBan', 'DocumentType', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'CoQuanBanHanh') EXEC sp_rename 'dbo.DOCUMENTS.CoQuanBanHanh', 'IssuingAgency', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'NgayBanHanh') EXEC sp_rename 'dbo.DOCUMENTS.NgayBanHanh', 'IssueDate', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'NguoiKy') EXEC sp_rename 'dbo.DOCUMENTS.NguoiKy', 'SignerName', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'TepDinhKem') EXEC sp_rename 'dbo.DOCUMENTS.TepDinhKem', 'Attachment', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'DungLuong') EXEC sp_rename 'dbo.DOCUMENTS.DungLuong', 'FileSize', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'LuotTai') EXEC sp_rename 'dbo.DOCUMENTS.LuotTai', 'DownloadCount', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'GhiChu') EXEC sp_rename 'dbo.DOCUMENTS.GhiChu', 'Notes', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.DOCUMENTS') AND name = 'NgayDang') EXEC sp_rename 'dbo.DOCUMENTS.NgayDang', 'PublishedDate', 'COLUMN';
GO

-- =========================================================================
-- MONTHLY_REPORTS
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'MaToCongDoan') EXEC sp_rename 'dbo.MONTHLY_REPORTS.MaToCongDoan', 'UnionGroupId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'MaNguoiBaoCao') EXEC sp_rename 'dbo.MONTHLY_REPORTS.MaNguoiBaoCao', 'ReporterId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'ThangBaoCao') EXEC sp_rename 'dbo.MONTHLY_REPORTS.ThangBaoCao', 'Month', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'NamBaoCao') EXEC sp_rename 'dbo.MONTHLY_REPORTS.NamBaoCao', 'Year', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'TongSoCBNV') EXEC sp_rename 'dbo.MONTHLY_REPORTS.TongSoCBNV', 'TotalStaff', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'TongSoDoanVien') EXEC sp_rename 'dbo.MONTHLY_REPORTS.TongSoDoanVien', 'TotalMembers', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'TongSoNuDoanVien') EXEC sp_rename 'dbo.MONTHLY_REPORTS.TongSoNuDoanVien', 'TotalFemaleMembers', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'SoDoanVienKetNap') EXEC sp_rename 'dbo.MONTHLY_REPORTS.SoDoanVienKetNap', 'NewMembers', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'SoDoanVienUuTuSangDang') EXEC sp_rename 'dbo.MONTHLY_REPORTS.SoDoanVienUuTuSangDang', 'MembersJoiningParty', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'SoNguoiDuocChamLo') EXEC sp_rename 'dbo.MONTHLY_REPORTS.SoNguoiDuocChamLo', 'MembersSupported', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'TongTienChamLo') EXEC sp_rename 'dbo.MONTHLY_REPORTS.TongTienChamLo', 'TotalSupportAmount', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'NoiDungTuyenTruyen') EXEC sp_rename 'dbo.MONTHLY_REPORTS.NoiDungTuyenTruyen', 'PropagandaContent', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'HoatDongKhac') EXEC sp_rename 'dbo.MONTHLY_REPORTS.HoatDongKhac', 'OtherActivities', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'KeHoachThangToi') EXEC sp_rename 'dbo.MONTHLY_REPORTS.KeHoachThangToi', 'NextMonthPlan', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'KienNghiNhaTruong') EXEC sp_rename 'dbo.MONTHLY_REPORTS.KienNghiNhaTruong', 'Recommendations', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'LinkMinhChung') EXEC sp_rename 'dbo.MONTHLY_REPORTS.LinkMinhChung', 'EvidenceLink', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'TuDanhGia') EXEC sp_rename 'dbo.MONTHLY_REPORTS.TuDanhGia', 'SelfAssessment', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'BtvXepLoai') EXEC sp_rename 'dbo.MONTHLY_REPORTS.BtvXepLoai', 'BoardRating', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'TrangThai') EXEC sp_rename 'dbo.MONTHLY_REPORTS.TrangThai', 'Status', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.MONTHLY_REPORTS') AND name = 'NgayNop') EXEC sp_rename 'dbo.MONTHLY_REPORTS.NgayNop', 'SubmittedDate', 'COLUMN';
GO

-- =========================================================================
-- SCHEDULES
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SCHEDULES') AND name = 'KenhXuatBan') EXEC sp_rename 'dbo.SCHEDULES.KenhXuatBan', 'Channel', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SCHEDULES') AND name = 'ThoiGianDang') EXEC sp_rename 'dbo.SCHEDULES.ThoiGianDang', 'PublishAt', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SCHEDULES') AND name = 'TrangThai') EXEC sp_rename 'dbo.SCHEDULES.TrangThai', 'Status', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SCHEDULES') AND name = 'GhiChuLoi') EXEC sp_rename 'dbo.SCHEDULES.GhiChuLoi', 'ErrorNote', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.SCHEDULES') AND name = 'NgayTao') EXEC sp_rename 'dbo.SCHEDULES.NgayTao', 'CreatedDate', 'COLUMN';
GO

-- =========================================================================
-- USERS
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.USERS') AND name = 'MaNhanSu') EXEC sp_rename 'dbo.USERS.MaNhanSu', 'StaffId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.USERS') AND name = 'HoTen') EXEC sp_rename 'dbo.USERS.HoTen', 'FullName', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.USERS') AND name = 'VaiTro') EXEC sp_rename 'dbo.USERS.VaiTro', 'Role', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.USERS') AND name = 'TrangThai') EXEC sp_rename 'dbo.USERS.TrangThai', 'IsActive', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.USERS') AND name = 'NgayTao') EXEC sp_rename 'dbo.USERS.NgayTao', 'CreatedDate', 'COLUMN';
GO

-- =========================================================================
-- ARTICLE_AUDITS
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLE_AUDITS') AND name = 'HanhDong') EXEC sp_rename 'dbo.ARTICLE_AUDITS.HanhDong', 'Action', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLE_AUDITS') AND name = 'GhiChu') EXEC sp_rename 'dbo.ARTICLE_AUDITS.GhiChu', 'Note', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.ARTICLE_AUDITS') AND name = 'NgayThucHien') EXEC sp_rename 'dbo.ARTICLE_AUDITS.NgayThucHien', 'PerformedAt', 'COLUMN';
GO

-- =========================================================================
-- COMMENTS
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.COMMENTS') AND name = 'HoTen') EXEC sp_rename 'dbo.COMMENTS.HoTen', 'AuthorName', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.COMMENTS') AND name = 'ChucVu') EXEC sp_rename 'dbo.COMMENTS.ChucVu', 'Title', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.COMMENTS') AND name = 'NoiDung') EXEC sp_rename 'dbo.COMMENTS.NoiDung', 'Content', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.COMMENTS') AND name = 'TrangThai') EXEC sp_rename 'dbo.COMMENTS.TrangThai', 'Status', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.COMMENTS') AND name = 'NgayTao') EXEC sp_rename 'dbo.COMMENTS.NgayTao', 'CreatedDate', 'COLUMN';
GO

-- =========================================================================
-- BOOKMARKS
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BOOKMARKS') AND name = 'MaCanBo') EXEC sp_rename 'dbo.BOOKMARKS.MaCanBo', 'StaffCode', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BOOKMARKS') AND name = 'TieuDe') EXEC sp_rename 'dbo.BOOKMARKS.TieuDe', 'Title', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BOOKMARKS') AND name = 'GhiChu') EXEC sp_rename 'dbo.BOOKMARKS.GhiChu', 'Note', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BOOKMARKS') AND name = 'NgayLuu') EXEC sp_rename 'dbo.BOOKMARKS.NgayLuu', 'SavedDate', 'COLUMN';
GO

-- =========================================================================
-- BENEFITS (was PHUC_LOI)
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'PhucLoiId') EXEC sp_rename 'dbo.BENEFITS.PhucLoiId', 'BenefitId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'MaPhucLoi') EXEC sp_rename 'dbo.BENEFITS.MaPhucLoi', 'Code', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'TieuDe') EXEC sp_rename 'dbo.BENEFITS.TieuDe', 'Title', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'ChuyenMuc') EXEC sp_rename 'dbo.BENEFITS.ChuyenMuc', 'Category', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'DoiTuongHuong') EXEC sp_rename 'dbo.BENEFITS.DoiTuongHuong', 'EligibleSubjects', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'MucHoTro') EXEC sp_rename 'dbo.BENEFITS.MucHoTro', 'SupportAmount', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'MoTa') EXEC sp_rename 'dbo.BENEFITS.MoTa', 'Description', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'TrangThai') EXEC sp_rename 'dbo.BENEFITS.TrangThai', 'Status', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.BENEFITS') AND name = 'NgayTao') EXEC sp_rename 'dbo.BENEFITS.NgayTao', 'CreatedDate', 'COLUMN';
GO

-- =========================================================================
-- WELFARE_APPLICATIONS (was DON_TRO_CAP)
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'DonId') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.DonId', 'ApplicationId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'MaNhanSu') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.MaNhanSu', 'StaffId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'PhucLoiId') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.PhucLoiId', 'BenefitId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'HoTen') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.HoTen', 'ApplicantName', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'DonVi') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.DonVi', 'Department', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'LoaiTroCap') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.LoaiTroCap', 'SupportType', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'SoTienDeXuat') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.SoTienDeXuat', 'RequestedAmount', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'SoTienPheDuyet') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.SoTienPheDuyet', 'ApprovedAmount', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'LyDo') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.LyDo', 'Reason', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'TepMinhChung') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.TepMinhChung', 'SupportingDocument', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'TrangThai') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.TrangThai', 'Status', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'NguoiDuyet') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.NguoiDuyet', 'ReviewerName', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'GhiChu') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.GhiChu', 'Note', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.WELFARE_APPLICATIONS') AND name = 'NgayNop') EXEC sp_rename 'dbo.WELFARE_APPLICATIONS.NgayNop', 'SubmittedDate', 'COLUMN';
GO

-- =========================================================================
-- FEEDBACK (was INBOX_FEEDBACK)
-- =========================================================================
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'MaNhanSu') EXEC sp_rename 'dbo.FEEDBACK.MaNhanSu', 'StaffId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'NguoiXuLy') EXEC sp_rename 'dbo.FEEDBACK.NguoiXuLy', 'HandlerId', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'HoTen') EXEC sp_rename 'dbo.FEEDBACK.HoTen', 'FullName', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'SoDienThoai') EXEC sp_rename 'dbo.FEEDBACK.SoDienThoai', 'Phone', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'DonVi') EXEC sp_rename 'dbo.FEEDBACK.DonVi', 'Department', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'ChuDe') EXEC sp_rename 'dbo.FEEDBACK.ChuDe', 'Topic', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'TieuDe') EXEC sp_rename 'dbo.FEEDBACK.TieuDe', 'Subject', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'NoiDung') EXEC sp_rename 'dbo.FEEDBACK.NoiDung', 'Content', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'TepDinhKem') EXEC sp_rename 'dbo.FEEDBACK.TepDinhKem', 'Attachment', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'TrangThai') EXEC sp_rename 'dbo.FEEDBACK.TrangThai', 'Status', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'TraLoi') EXEC sp_rename 'dbo.FEEDBACK.TraLoi', 'Reply', 'COLUMN';
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.FEEDBACK') AND name = 'NgayGui') EXEC sp_rename 'dbo.FEEDBACK.NgayGui', 'SubmittedDate', 'COLUMN';
GO

PRINT 'English rename migration completed.';
GO