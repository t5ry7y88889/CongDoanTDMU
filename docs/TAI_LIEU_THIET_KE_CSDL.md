# TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU - CHƯƠNG 3 (CHUẨN MẪU BÁO CÁO ĐỒ ÁN)

**Dự án:** Website Truyền Thông Công Đoàn Đại Học Thủ Dầu Một Tích Hợp AI  
**Hệ quản trị CSDL:** Microsoft SQL Server (`TDMU_TradeUnion_DB`)  
**Quy chuẩn định dạng:** Bám sát 100% mẫu báo cáo Đồ án cơ sở ngành (`MauDoAn.pdf`)

---

# CHƯƠNG 3. CƠ SỞ DỮ LIỆU

## 3.1. Sơ đồ quan hệ trong cơ sở dữ liệu

![Hình 3.1: Sơ đồ quan hệ trong cơ sở dữ liệu](Nhom2/Diagram_Database.jpg)

*Hình 3.1: Sơ đồ quan hệ trong cơ sở dữ liệu*

---

## 3.2. Mô tả bảng

### Bảng 3.1: Bảng ORGANIZATIONS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **MaToChuc** | `Int` | Mã tổ chức (Khóa chính, tự tăng) |
| 2 | **TenToChuc** | `Nvarchar(150)` | Tên Ban chuyên môn / Cơ cấu tổ chức cấp Trường |
| 3 | **NhiemKy** | `Nvarchar(50)` | Nhiệm kỳ hoạt động (Mặc định: 'Nhiệm kỳ 2023 - 2028') |
| 4 | **MoTaChucNang** | `Nvarchar(Max)` | Mô tả chức năng, nhiệm vụ và quyền hạn của Ban |
| 5 | **ThuTuHienThi** | `Int` | Thứ tự sắp xếp hiển thị trên sơ đồ tổ chức |
| 6 | **TrangThai** | `Bit` | Trạng thái hoạt động (1: Hoạt động, 0: Khóa) |
| 7 | **NgayTao** | `Datetime2` | Thời điểm tạo bản ghi trong hệ thống |

### Bảng 3.2: Bảng UNION_BRANCHES

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **MaToCongDoan** | `Int` | Mã tổ công đoàn (Khóa chính, tự tăng) |
| 2 | **MaDinhDanh** | `Varchar(50)` | Mã định danh duy nhất (VD: TCD-CNTT, TCD-KT) |
| 3 | **TenToCongDoan** | `Nvarchar(150)` | Tên đầy đủ của Tổ công đoàn cơ sở bộ phận |
| 4 | **ToTruong** | `Nvarchar(100)` | Họ và tên Tổ trưởng đương nhiệm |
| 5 | **EmailLienHe** | `Varchar(100)` | Email liên hệ công vụ của Tổ công đoàn |
| 6 | **SoDienThoai** | `Varchar(20)` | Số điện thoại liên hệ đại diện |
| 7 | **DiaChiVanPhong** | `Nvarchar(150)` | Văn phòng làm việc của Tổ công đoàn |
| 8 | **TrangThai** | `Bit` | Trạng thái hoạt động (1: Hoạt động, 0: Tạm ngưng) |
| 9 | **NgayTao** | `Datetime2` | Thời điểm ghi nhận tổ công đoàn trên hệ thống |

### Bảng 3.3: Bảng MEMBERS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **MaNhanSu** | `Int` | Mã nhân sự (Khóa chính, tự tăng) |
| 2 | **MaToCongDoan** | `Int` | Khóa ngoại tham chiếu UNION_BRANCHES(MaToCongDoan) |
| 3 | **MaToChuc** | `Int` | Khóa ngoại tham chiếu ORGANIZATIONS(MaToChuc) |
| 4 | **MaCanBo** | `Varchar(50)` | Mã số cán bộ / giảng viên TDMU (Duy nhất) |
| 5 | **HoVaTen** | `Nvarchar(100)` | Họ và tên đầy đủ của cán bộ đoàn viên |
| 6 | **GioiTinh** | `Nvarchar(10)` | Giới tính (Nam / Nữ / Khác) |
| 7 | **NgaySinh** | `Date` | Ngày tháng năm sinh của cán bộ |
| 8 | **Email** | `Varchar(100)` | Email công vụ @tdmu.edu.vn (Duy nhất) |
| 9 | **SoDienThoai** | `Varchar(20)` | Số điện thoại di động liên hệ |
| 10 | **HocHamHocVi** | `Nvarchar(50)` | Học hàm học vị (GS, PGS, TS, ThS, CN) |
| 11 | **ChucVuCongDoan** | `Nvarchar(100)` | Chức vụ CĐ (Chủ tịch, UV BTV, Tổ trưởng, Đoàn viên) |
| 12 | **ChucVuChuyenMon** | `Nvarchar(100)` | Chức vụ chính quyền (Trưởng khoa, Phó phòng, GV) |
| 13 | **TrangThai** | `Bit` | Tình trạng sinh hoạt (1: Đang công tác, 0: Đã chuyển) |
| 14 | **NgayTao** | `Datetime2` | Thời điểm tạo hồ sơ đoàn viên |

### Bảng 3.4: Bảng CATEGORIES

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **CategoryId** | `Int` | Mã chuyên mục (Khóa chính, tự tăng) |
| 2 | **TenChuyenMuc** | `Nvarchar(100)` | Tên chuyên mục tin tức truyền thông |
| 3 | **Slug** | `Varchar(120)` | Đường dẫn định danh chuẩn SEO (Duy nhất) |
| 4 | **MoTa** | `Nvarchar(Max)` | Mô tả phạm vi nội dung chuyên mục |
| 5 | **ThuTu** | `Int` | Thứ tự sắp xếp hiển thị trên Menu điều hướng |
| 6 | **TrangThai** | `Bit` | Trạng thái hiển thị (1: Bật, 0: Ẩn) |
| 7 | **NgayTao** | `Datetime2` | Thời điểm tạo chuyên mục |

### Bảng 3.5: Bảng ARTICLES

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **ArticleId** | `Int` | Mã bài viết (Khóa chính, tự tăng) |
| 2 | **MaTacGia** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) |
| 3 | **CategoryId** | `Int` | Khóa ngoại tham chiếu CATEGORIES(CategoryId) |
| 4 | **TieuDe** | `Nvarchar(255)` | Tiêu đề chính của bài viết truyền thông |
| 5 | **Slug** | `Varchar(255)` | Đường dẫn thân thiện phục vụ SEO (Duy nhất) |
| 6 | **TomTat** | `Nvarchar(Max)` | Đoạn văn ngắn tóm tắt nội dung chính (Lead) |
| 7 | **NoiDung** | `Nvarchar(Max)` | Nội dung bài viết đầy đủ (Rich Text / HTML) |
| 8 | **HinhAnhDaiDien** | `Varchar(500)` | Đường dẫn ảnh đại diện Thumbnail bài viết |
| 9 | **NoiDungFB** | `Nvarchar(Max)` | Bản tin Facebook Fanpage do AI tối ưu |
| 10 | **NoiDungZalo** | `Nvarchar(Max)` | Nội dung tin nhắn Zalo OA do AI tạo |
| 11 | **VideoScript** | `Nvarchar(Max)` | Kịch bản video ngắn TikTok/Reels do AI phân cảnh |
| 12 | **IsAiGenerated** | `Bit` | Cờ đánh dấu có AI hỗ trợ tạo nội dung (1: Có, 0: Không) |
| 13 | **AiPrompt** | `Nvarchar(Max)` | Câu lệnh Prompt gửi AI sinh nội dung bài viết |
| 14 | **TrangThai** | `Varchar(20)` | Trạng thái bài: draft, pending_review, approved, published |
| 15 | **LuotXem** | `Int` | Tổng lượt truy cập đọc bài viết |
| 16 | **LuotThich** | `Int` | Số lượt tương tác yêu thích bài viết |
| 17 | **LuotVoTay** | `Int` | Số lượt vỗ tay tán thành (Clap tương tác) |
| 18 | **NgayXuatBan** | `Datetime2` | Thời điểm bài viết được phát hành công khai |
| 19 | **NgayTao** | `Datetime2` | Thời điểm bắt đầu soạn thảo bài viết |
| 20 | **NgayCapNhat** | `Datetime2` | Thời điểm cập nhật chỉnh sửa bài viết lần cuối |

### Bảng 3.6: Bảng DOCUMENTS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **DocId** | `Int` | Mã văn bản (Khóa chính, tự tăng) |
| 2 | **SoHieu** | `Nvarchar(50)` | Số hiệu văn bản (Duy nhất, VD: 1630/CV-BTG) |
| 3 | **TieuDe** | `Nvarchar(255)` | Trích yếu tóm lược nội dung văn bản |
| 4 | **LoaiVanBan** | `Nvarchar(50)` | Loại văn bản (Kế hoạch, Quyết định, Thông tri, Công văn) |
| 5 | **CoQuanBanHanh** | `Nvarchar(100)` | Cơ quan ban hành (LĐLĐ Tỉnh, BCH Công đoàn Trường) |
| 6 | **NgayBanHanh** | `Date` | Ngày ký ban hành văn bản chính thức |
| 7 | **FileUrl** | `Varchar(500)` | Đường dẫn tải tệp đính kèm (PDF / DOCX) |
| 8 | **MaNguoiDang** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) |
| 9 | **TrangThai** | `Bit` | Trạng thái phát hành (1: Công khai, 0: Nội bộ) |
| 10 | **NgayTao** | `Datetime2` | Thời điểm tải văn bản lên hệ thống |

### Bảng 3.7: Bảng MONTHLY_REPORTS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **ReportId** | `Int` | Mã báo cáo thi đua (Khóa chính, tự tăng) |
| 2 | **MaToCongDoan** | `Int` | Khóa ngoại tham chiếu UNION_BRANCHES(MaToCongDoan) |
| 3 | **Thang** | `Int` | Tháng báo cáo nghiệp vụ (1 - 12) |
| 4 | **Nam** | `Int` | Năm báo cáo hoạt động (VD: 2026) |
| 5 | **TieuDe** | `Nvarchar(255)` | Tiêu đề báo cáo định kỳ hàng tháng |
| 6 | **TongDoanVien** | `Int` | Tổng số đoàn viên thực tế tại Tổ |
| 7 | **NuDoanVien** | `Int` | Số lượng nữ đoàn viên |
| 8 | **DangVien** | `Int` | Số lượng đảng viên trong Tổ |
| 9 | **SoCuocHop** | `Int` | Số cuộc họp tổ công đoàn tổ chức trong tháng |
| 10 | **SoNguoiKhoKhan** | `Int` | Số đoàn viên có hoàn cảnh đặc biệt khó khăn |
| 11 | **HoatDongNoiBat** | `Nvarchar(Max)` | Tóm tắt các hoạt động nổi bật trong kỳ |
| 12 | **DeXuatKienNghi** | `Nvarchar(Max)` | Kiến nghị đề xuất gửi Công đoàn cấp trên |
| 13 | **FileDinhKem** | `Varchar(500)` | Đường dẫn tệp báo cáo kèm minh chứng |
| 14 | **DiemTuDanhGia** | `Float` | Điểm thi đua do Tổ tự chấm |
| 15 | **DiemChinhThuc** | `Float` | Điểm thi đua do Ban Thi đua chấm duyệt |
| 16 | **TrangThai** | `Varchar(20)` | Trạng thái báo cáo: draft, submitted, approved, rejected |
| 17 | **NguoiDuyet** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) |
| 18 | **NgayDuyet** | `Datetime2` | Thời điểm duyệt và chốt điểm báo cáo |
| 19 | **NgayTao** | `Datetime2` | Thời điểm Tổ công đoàn nộp báo cáo |

### Bảng 3.8: Bảng SCHEDULES

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **ScheduleId** | `Int` | Mã lịch công tác (Khóa chính, tự tăng) |
| 2 | **TieuDe** | `Nvarchar(255)` | Tiêu đề cuộc họp / sự kiện công đoàn |
| 3 | **ThoiGianBatDau** | `Datetime2` | Thời gian bắt đầu sự kiện |
| 4 | **ThoiGianKetThuc** | `Datetime2` | Thời gian kết thúc sự kiện |
| 5 | **DiaDiem** | `Nvarchar(255)` | Địa điểm tổ chức (Hội trường, phòng họp, Online) |
| 6 | **ThanhPhan** | `Nvarchar(Max)` | Thành phần triệu tập tham dự |
| 7 | **ChuTri** | `Nvarchar(100)` | Người chủ trì cuộc họp |
| 8 | **NoiDungChuChot** | `Nvarchar(Max)` | Nội dung trọng tâm của sự kiện |
| 9 | **MaNguoiTao** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) |
| 10 | **TrangThai** | `Varchar(20)` | Trạng thái lịch: scheduled, completed, cancelled |
| 11 | **NgayTao** | `Datetime2` | Thời điểm khởi tạo lịch công tác |

### Bảng 3.9: Bảng USERS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **UserId** | `Int` | Mã tài khoản (Khóa chính, tự tăng) |
| 2 | **MaNhanSu** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) (Duy nhất) |
| 3 | **Username** | `Varchar(50)` | Tên đăng nhập hệ thống (Duy nhất) |
| 4 | **PasswordHash** | `Varchar(255)` | Mật khẩu băm bảo mật (BCrypt / Argon2) |
| 5 | **Role** | `Varchar(20)` | Vai trò phân quyền RBAC (Admin, Editor, Contributor) |
| 6 | **IsActive** | `Bit` | Trạng thái tài khoản (1: Kích hoạt, 0: Khóa) |
| 7 | **LastLogin** | `Datetime2` | Thời điểm đăng nhập hệ thống gần nhất |
| 8 | **NgayTao** | `Datetime2` | Thời điểm tạo tài khoản |

### Bảng 3.10: Bảng ARTICLE_AUDITS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **AuditId** | `Int` | Mã nhật ký kiểm toán (Khóa chính, tự tăng) |
| 2 | **ArticleId** | `Int` | Khóa ngoại tham chiếu ARTICLES(ArticleId) |
| 3 | **UserId** | `Int` | Khóa ngoại tham chiếu USERS(UserId) |
| 4 | **HanhDong** | `Varchar(50)` | Hành động thực hiện (create, edit, approve, publish, reject) |
| 5 | **TrangThaiCu** | `Varchar(20)` | Trạng thái bài viết trước khi thao tác |
| 6 | **TrangThaiMoi** | `Varchar(20)` | Trạng thái bài viết sau khi hoàn thành thao tác |
| 7 | **GhiChu** | `Nvarchar(Max)` | Ghi chú ý kiến thẩm định duyệt bài |
| 8 | **ThoiGian** | `Datetime2` | Thời điểm ghi nhận hành động kiểm toán |

### Bảng 3.11: Bảng COMMENTS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **CommentId** | `Int` | Mã bình luận (Khóa chính, tự tăng) |
| 2 | **ArticleId** | `Int` | Khóa ngoại tham chiếu ARTICLES(ArticleId) |
| 3 | **MaNhanSu** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) |
| 4 | **NoiDung** | `Nvarchar(Max)` | Nội dung ý kiến phản hồi, đóng góp |
| 5 | **TrangThai** | `Varchar(20)` | Trạng thái kiểm duyệt: pending, approved, hidden |
| 6 | **NgayTao** | `Datetime2` | Thời điểm gửi bình luận |

### Bảng 3.12: Bảng BOOKMARKS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **BookmarkId** | `Int` | Mã dấu trang (Khóa chính, tự tăng) |
| 2 | **MaNhanSu** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) |
| 3 | **ArticleId** | `Int` | Khóa ngoại tham chiếu ARTICLES(ArticleId) |
| 4 | **NgayLuu** | `Datetime2` | Thời điểm đánh dấu lưu bài viết |

### Bảng 3.13: Bảng WELFARE_PROGRAMS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **WelfareId** | `Int` | Mã chương trình phúc lợi (Khóa chính, tự tăng) |
| 2 | **TenChuongTrinh** | `Nvarchar(255)` | Tên chương trình chăm lo / phúc lợi công đoàn |
| 3 | **LoaiPhucLoi** | `Nvarchar(50)` | Phân loại: Trợ cấp khó khăn, Học bổng, Quà Tết |
| 4 | **KinhPhiDuKien** | `Decimal(18,2)` | Định mức kinh phí dự kiến cho mỗi suất (VNĐ) |
| 5 | **MoTaDoiTuong** | `Nvarchar(Max)` | Tiêu chí đối tượng đoàn viên được hưởng |
| 6 | **NgayBatDau** | `Date` | Ngày bắt đầu tiếp nhận hồ sơ đề xuất |
| 7 | **NgayKetThuc** | `Date` | Ngày kết thúc tiếp nhận hồ sơ |
| 8 | **TrangThai** | `Bit` | Trạng thái chương trình (1: Đang mở, 0: Đã đóng) |
| 9 | **NgayTao** | `Datetime2` | Thời điểm khởi tạo chương trình phúc lợi |

### Bảng 3.14: Bảng AID_REQUESTS

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **RequestId** | `Int` | Mã đơn trợ cấp (Khóa chính, tự tăng) |
| 2 | **WelfareId** | `Int` | Khóa ngoại tham chiếu WELFARE_PROGRAMS(WelfareId) |
| 3 | **MaNhanSu** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) |
| 4 | **LyDoHoanCanh** | `Nvarchar(Max)` | Mô tả chi tiết hoàn cảnh khó khăn đề xuất hỗ trợ |
| 5 | **TepMinhChung** | `Varchar(500)` | Đường dẫn tải tệp chứng từ, bệnh án, giấy xác nhận |
| 6 | **SoTienDeXuat** | `Decimal(18,2)` | Số tiền đoàn viên đề xuất xin trợ cấp (VNĐ) |
| 7 | **SoTienPheDuyet** | `Decimal(18,2)` | Số tiền chính thức được Ban Thường vụ duyệt (VNĐ) |
| 8 | **TrangThai** | `Varchar(20)` | Trạng thái: pending, verified, approved, rejected |
| 9 | **NguoiDuyet** | `Int` | Khóa ngoại tham chiếu MEMBERS(MaNhanSu) |
| 10 | **GhiChuPheDuyet** | `Nvarchar(Max)` | Ý kiến nhận xét của Hội đồng thẩm định trợ cấp |
| 11 | **NgayDuyet** | `Datetime2` | Thời điểm hoàn tất phê duyệt |
| 12 | **NgayTao** | `Datetime2` | Thời điểm đoàn viên nộp đơn trực tuyến |

### Bảng 3.15: Bảng INBOX_FEEDBACK

| STT | NAME | TYPE | DESCRIPTION |
| :---: | :--- | :--- | :--- |
| 1 | **FeedbackId** | `Int` | Mã thư góp ý phản ánh (Khóa chính, tự tăng) |
| 2 | **HoTen** | `Nvarchar(100)` | Họ và tên người gửi ý kiến phản ánh |
| 3 | **Email** | `Varchar(100)` | Địa chỉ email liên hệ người gửi |
| 4 | **TieuDe** | `Nvarchar(255)` | Tiêu đề nội dung góp ý phản ánh |
| 5 | **NoiDung** | `Nvarchar(Max)` | Nội dung thư phản ánh kiến nghị |
| 6 | **TrangThai** | `Varchar(20)` | Tình trạng xử lý: unread, in_progress, resolved |
| 7 | **TraLoi** | `Nvarchar(Max)` | Ý kiến phản hồi chính thức từ BCH Công đoàn |
| 8 | **NgayGui** | `Datetime2` | Thời điểm gửi thư vào hòm thư góp ý |

