-- =========================================================================
-- DỮ LIỆU KHỞI TẠO MẪU 15 BẢNG (15 TABLES SEED DATA)
-- MICROSOFT SQL SERVER 2019/2022 | Database: TDMU_TradeUnion_DB
-- =========================================================================

USE TDMU_TradeUnion_DB;
GO

-- 1. Nạp TO_CHUC
IF NOT EXISTS (SELECT 1 FROM dbo.TO_CHUC)
BEGIN
    INSERT INTO dbo.TO_CHUC (TenToChuc, NhiemKy, MoTaChucNang, ThuTuHienThi) VALUES
    (N'Ban Thường vụ', N'Nhiệm kỳ 2023 - 2028', N'Lãnh đạo, điều hành toàn diện hoạt động Công đoàn giữa hai kỳ họp BCH', 1),
    (N'Ban Chấp hành', N'Nhiệm kỳ 2023 - 2028', N'Cơ quan lãnh đạo cao nhất của Công đoàn cơ sở TDMU', 2),
    (N'Ủy ban Kiểm tra', N'Nhiệm kỳ 2023 - 2028', N'Kiểm tra việc chấp hành Điều lệ Công đoàn và quản lý tài chính', 3),
    (N'Ban Nữ công', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách phong trào nữ cán bộ giảng viên Giỏi việc trường - Đảm việc nhà', 4),
    (N'Ban Tuyên giáo - Thi đua', N'Nhiệm kỳ 2023 - 2028', N'Phụ trách công tác truyền thông, học tập chính trị và phong trào thi đua', 5);
END
GO

-- 2. Nạp TO_CONG_DOAN (Đủ 16 Tổ công đoàn bộ phận)
IF NOT EXISTS (SELECT 1 FROM dbo.TO_CONG_DOAN)
BEGIN
    INSERT INTO dbo.TO_CONG_DOAN (MaDinhDanh, TenToCongDoan, ToTruong, EmailLienHe) VALUES
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

-- 3. Nạp NHAN_SU
IF NOT EXISTS (SELECT 1 FROM dbo.NHAN_SU)
BEGIN
    INSERT INTO dbo.NHAN_SU (MaToCongDoan, MaToChuc, MaCanBo, HoVaTen, Email, ChucVuCongDoan) VALUES
    (1, 1, 'CB_001', N'TS. Lê Thị Kim Út', 'admin@tdmu.edu.vn', N'Chủ tịch Công đoàn'),
    (2, 5, 'CB_002', N'ThS. Trần Thị B', 'editor@tdmu.edu.vn', N'Trưởng Ban Tuyên giáo'),
    (3, NULL, 'CB_003', N'ThS. Lê Văn C', 'contributor@tdmu.edu.vn', N'Tổ trưởng Tổ 3'),
    (4, 3, 'CB_004', N'ThS. Nguyễn Thị Hương', 'huongnt@tdmu.edu.vn', N'Ủy viên UBKT - Tổ trưởng Tổ 4'),
    (9, NULL, 'CB_009', N'KTS. Bùi Thị Lan', 'lanbt@tdmu.edu.vn', N'Tổ trưởng Tổ 9'),
    (11, NULL, 'CB_011', N'ThS. Ngô Thị Bích', 'bichnt@tdmu.edu.vn', N'Tổ trưởng Tổ 11'),
    (15, NULL, 'CB_015', N'ThS. Mai Thị Ngọc', 'ngocmt@tdmu.edu.vn', N'Tổ trưởng Tổ 15'),
    (11, NULL, 'CB_018', N'ThS. Huỳnh Thị Lệ Kha', 'khatl@tdmu.edu.vn', N'Đoàn viên - Giảng viên Khoa Luật'),
    (3, NULL, 'CB_019', N'ThS. Hồ Ngọc Trung Kiên', 'kienhnt@tdmu.edu.vn', N'Đoàn viên - Viện CNS');
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
    (1, 1, N'Tọa đàm "Dinh dưỡng lành mạnh vì sức khỏe gia đình"', 'toa-dam-dinh-duong-lanh-manh-vi-suc-khoe-gia-dinh', N'Hướng tới Ngày Gia đình Việt Nam, Công đoàn TDMU tổ chức tọa đàm dinh dưỡng lành mạnh cho cán bộ nữ.', N'<p>Hướng tới kỷ niệm Ngày Gia đình Việt Nam, Công đoàn Trường Đại học Thủ Dầu Một đã tổ chức tọa đàm với chủ đề "Dinh dưỡng lành mạnh vì sức khỏe gia đình", thu hút đông đảo nữ cán bộ, giảng viên tham gia thảo luận về chế độ ăn uống khoa học và cân bằng cuộc sống.</p>', 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800', 'published', 147, '2026-06-26'),
    (1, 2, N'Chào mừng Đại hội XIV Công đoàn Việt Nam nhiệm kỳ 2026 – 2031', 'chao-mung-dai-hoi-xiv-cong-doan-viet-nam', N'Toàn thể đoàn viên TDMU ra sức thi đua lập thành tích xuất sắc chào mừng Đại hội XIV Công đoàn Việt Nam.', N'<p>Đại hội XIV Công đoàn Việt Nam là sự kiện chính trị quan trọng của giai cấp công nhân và tổ chức Công đoàn Việt Nam. Ban Thường vụ Công đoàn trường kêu gọi toàn thể đoàn viên phát huy tinh thần trách nhiệm, sáng tạo, hoàn thành xuất sắc nhiệm vụ chính trị và chuyên môn.</p>', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', 'published', 140, '2026-06-01'),
    (2, 3, N'Đại học Thủ Dầu Một được tuyên dương điển hình tiên tiến trong học tập và làm theo Bác', 'tdmu-duoc-tuyen-duong-dien-hinh-tien-tien', N'Trường ĐH Thủ Dầu Một vinh dự nhận Bằng khen tập thể điển hình tiên tiến giai đoạn 2021–2026.', N'<p>Trường Đại học Thủ Dầu Một vinh dự được trao tặng Bằng khen dành cho tập thể điển hình tiên tiến có thành tích tiêu biểu giai đoạn 2021–2026 trong phong trào học tập và làm theo tư tưởng, đạo đức, phong cách Hồ Chí Minh.</p>', 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800', 'published', 306, '2026-05-08'),
    (1, 4, N'Phiên chợ Tết “Ngựa ô đón Tết – Rước lộc về dinh” chào xuân 2026', 'phien-cho-tet-ngua-o-don-tet-2026', N'Phiên chợ Tết nghĩa tình phục vụ cán bộ viên chức và sinh viên có hoàn cảnh khó khăn.', N'<p>Trong không khí rộn ràng đón Tết Bính Ngọ 2026, Công đoàn TDMU tổ chức Phiên chợ Tết với nhiều gian hàng ẩm thực, quà tết trợ giá và các suất quà nghĩa tình cho đoàn viên, người lao động.</p>', 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=800', 'published', 911, '2026-01-30'),
    (1, 1, N'Công đoàn TDMU phát động phong trào thi đua "Lao động giỏi - Lao động sáng tạo" năm 2026', 'cong-doan-tdmu-phat-dong-thi-dua-2026', N'Quyết tâm thực hiện thắng lợi các mục tiêu nghiên cứu khoa học và đổi mới phương pháp giảng dạy.', N'<p>Ban Thường vụ Công đoàn Trường Đại học Thủ Dầu Một chính thức phát động đợt thi đua cao điểm năm 2026 với trọng tâm nâng cao chất lượng đào tạo và công bố quốc tế.</p>', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800', 'published', 452, '2026-08-10'),
    (1, 2, N'Ban Thường vụ Công đoàn Trường Thông Báo Kết Quả Xếp Loại Thi Đua Tháng 8/2026', 'thong-bao-ket-qua-xep-loai-thi-dua-thang-8-2026', N'Khen ngợi 4 Tổ Công đoàn xuất sắc dẫn đầu đạt Loại A: Tổ 9, 11, 15 và Tổ 4.', N'<p>Căn cứ kết quả thẩm tra báo cáo công tác tháng 8/2026, Ban Thường vụ Công đoàn Trường Đại học Thủ Dầu Một biểu dương 4 Tổ Công đoàn đạt danh hiệu Loại A xuất sắc dẫn đầu phong trào thi đua.</p>', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=800', 'published', 680, '2026-09-01');
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

-- 13. Nạp PHUC_LOI (4 Gói phúc lợi chính thức)
IF NOT EXISTS (SELECT 1 FROM dbo.PHUC_LOI)
BEGIN
    INSERT INTO dbo.PHUC_LOI (MaPhucLoi, TieuDe, ChuyenMuc, DoiTuongHuong, MucHoTro, MoTa, Icon) VALUES
    ('PL-01', N'Chăm Lo Quà Tặng Dịp Lễ, Tết & Kỷ Niệm', 'le_tet', N'100% Cán bộ, Giảng viên, Đoàn viên Công đoàn', N'500.000đ - 1.500.000đ / suất', N'Tặng quà Tết Nguyên đán, Quốc tế Phụ nữ 8/3, Ngày Nhà giáo Việt Nam 20/11.', 'fa-gift'),
    ('PL-02', N'Chính Sách Chăm Lo Nữ Công & Trẻ Em', 'nu_cong', N'Nữ cán bộ sinh con & con cán bộ đạt học sinh giỏi', N'1.000.000đ - 2.000.000đ / suất', N'Hỗ trợ thai sản, khen thưởng con cán bộ đạt giải quốc gia, học bổng khuyến học.', 'fa-person-breastfeeding'),
    ('PL-03', N'Trợ Cấp Khó Khăn & Bệnh Hiểm Nghèo', 'tro_cap', N'Đoàn viên gặp tai nạn lao động hoặc bệnh hiểm nghèo', N'2.000.000đ - 10.000.000đ / đợt', N'Thăm hỏi ốm đau dài ngày, phẫu thuật, hỗ trợ kinh phí điều trị đặc biệt.', 'fa-hand-holding-medical'),
    ('PL-04', N'Hỗ Trợ Vay Vốn Quỹ Trợ Vốn CEP', 'vay_von', N'Đoàn viên có nhu cầu phát triển kinh tế gia đình', N'Tối đa 50.000.000đ / đoàn viên', N'Vay vốn lãi suất ưu đãi qua Quỹ Trợ vốn CEP của Liên đoàn Lao động tỉnh Bình Dương.', 'fa-sack-dollar');
END
GO

-- 14. Nạp DON_TRO_CAP
IF NOT EXISTS (SELECT 1 FROM dbo.DON_TRO_CAP)
BEGIN
    INSERT INTO dbo.DON_TRO_CAP (MaNhanSu, HoTen, DonVi, LoaiTroCap, SoTienDeXuat, LyDo, TrangThai, NguoiDuyet, GhiChu) VALUES
    (8, N'ThS. Huỳnh Thị Lệ Kha', N'Khoa Luật', N'Chế độ nghỉ dưỡng thai sản', 2000000, N'Thực hiện chế độ chăm lo nữ công thai sản quý 3', 'approved', N'TS. Lê Thị Kim Út', N'Đã duyệt chi chuyển khoản qua KHTC');
END
GO

-- 15. Nạp INBOX_FEEDBACK
IF NOT EXISTS (SELECT 1 FROM dbo.INBOX_FEEDBACK)
BEGIN
    INSERT INTO dbo.INBOX_FEEDBACK (HoTen, Email, SoDienThoai, DonVi, ChuDe, TieuDe, NoiDung, TrangThai, TraLoi) VALUES
    (N'ThS. Hồ Ngọc Trung Kiên', 'kienhnt@tdmu.edu.vn', '0977.797.378', N'Viện Công nghệ số', N'Đề xuất chuyển đổi số', N'Đề xuất tích hợp biểu mẫu điện tử cho 16 Tổ công đoàn', N'Kính gửi Ban Thường vụ, Viện CNS đề xuất tích hợp chữ ký số và biểu mẫu trực tuyến để giảm thiểu in ấn giấy tờ báo cáo tháng.', 'processed', N'Ban Thường vụ đã ghi nhận và giao Ban Tuyên giáo triển khai trên Cổng thông tin mới.');
END
GO