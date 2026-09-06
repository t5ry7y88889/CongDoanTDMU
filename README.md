# 🇻🇳 HỆ THỐNG TRUYỀN THÔNG CÔNG ĐOÀN ĐẠI HỌC THỦ DẦU MỘT (TDMU) TÍCH HỢP TRÍ TUỆ NHÂN TẠO (AI)

> **ĐỀ TÀI NGHIÊN CỨU KHOA HỌC SINH VIÊN / ĐỒ ÁN CƠ SỞ NGÀNH**  
> **Đơn vị quản lý:** Viện Công Nghệ Số – Trường Đại Học Thủ Dầu Một (TDMU)  
> **Giảng viên hướng dẫn:** ThS. Võ Quốc Lương  
> **Nhóm sinh viên thực hiện (Nhóm 2):**
> 1. **Nguyễn Bình Dương** (Nhóm trưởng) – MSSV: 2424802010319 – Lớp: D24CNTT05
> 2. **Trần Hồng Thanh** – MSSV: 2424802010439 – Lớp: D24CNTT03
> 3. **Phạm Anh Tuấn** – MSSV: 2324802010393 – Lớp: D23CNTT03
> 
> **Mã nguồn GitHub:** [https://github.com/t5ry7y88889/CongDoanTDMU.git](https://github.com/t5ry7y88889/CongDoanTDMU.git)

---

## 📌 1. TỔNG QUAN DỰ ÁN

Hệ thống **Truyền Thông & Quản Trị Công Đoàn TDMU Tích Hợp AI** là nền tảng số hóa toàn diện được thiết kế riêng cho **Công đoàn Cơ sở Trường Đại học Thủ Dầu Một** (`congdoan.tdmu.edu.vn`).

Dự án giải quyết triệt để các bài toán thực tiễn của công tác đoàn thể đại học:
1. **Số hóa quy trình tác nghiệp**: Chấm dứt tình trạng nộp báo cáo giấy, phân tán dữ liệu giữa **16 Tổ Công đoàn bộ phận**.
2. **Trợ lý AI Biên tập (AI Content Studio 2.0)**: 
   - Kiến trúc **Multi-Pass SSE Streaming** (Server-Sent Events) tạo nội dung đồng thời cho 5 kênh truyền thông: *Website báo chí, Facebook Fanpage, Zalo OA, Kịch bản Video 60s TikTok/Reels, Tóm tắt Infographic*.
   - **Manus AI Copilot** hỗ trợ cán bộ trau chuốt thể thức văn bản hành chính theo **Nghị định 30/2020/NĐ-CP**, so sánh chênh lệch (Safe-Zone Diff) trực quan trong Sidebar không phá vỡ DOM, tích hợp cơ chế ngắt tức thì `AbortController`.
   - **Sinh ảnh báo chí tự động (Flux AI / Pollinations)**: Miễn phí 100%, tỷ lệ chuẩn 16:9 kèm chú thích báo chí chuẩn mực.
3. **Cơ sở dữ liệu chuẩn 3NF**: Kiến trúc 15 bảng thống nhất, hỗ trợ song song **Microsoft SQL Server (T-SQL)**, **MySQL/MariaDB** và cơ chế **JSON Embedded DB Fallback** an toàn tuyệt đối.

---

## 🌟 2. CÁC PHÂN HỆ & TÍNH NĂNG ĐỘT PHÁ

### 🤖 A. Tòa soạn AI Content Studio & Quản trị CMS (`admin.html`)

#### 1. Ma Trận Xuất Bản Đa Kênh Tự Động (Multi-Pass SSE Streaming Pipeline)
- **Kiến trúc luồng sự kiện thời gian thực (Server-Sent Events - SSE):** Người dùng nhập ý tưởng / tóm tắt thô, AI lập tức "gõ máy tính" trực tiếp ra bài báo Website theo thời gian thực (typewriter effect).
- **Phân tách luồng chuyên biệt (Decoupled Multi-Pass):**
  - **Kênh 1: Website Báo Chí**: Bố cục chuẩn mực 5W1H (Sapo, Thân bài tiêu đề H2, Trích dẫn blockquote, Kết bài).
  - **Kênh 2: Facebook Fanpage**: Hook thu hút, emoji sinh động, hashtags chuẩn nhận diện TDMU.
  - **Kênh 3: Zalo Official Account**: Định dạng súc tích, câu từ cô đọng dưới 400 ký tự.
  - **Kênh 4: Kịch Bản Video Ngắn 60s**: Phân chia chi tiết Visual (Hình ảnh/Góc quay) và Audio (Giọng đọc Voiceover).
  - **Kênh 5: Tóm Tắt Số Liệu Infographic**: 3–5 điểm nhấn số liệu trọng tâm của sự kiện phong trào.

#### 2. Trợ Lý Trực Tuyến Manus AI Copilot 2.0
- **Nút nổi "Đũa Thần ✨" siêu tối giản:** Bôi đen đoạn văn bản trên màn hình soạn thảo Word, một nút đũa thần nhỏ xuất hiện gọn gàng cạnh con trỏ chuột, tự động chuyển đoạn trích sang Sidebar Copilot mà không che khuất chữ.
- **Vùng So Sánh An Toàn (Safe-Zone Diff Container):** 
  - Không chèn trực tiếp thẻ rác `<del>` và `<ins>` vào bài viết làm vỡ DOM `contenteditable`.
  - Sidebar hiển thị song song **Bản Gốc (Đỏ)** và **Bản AI Đề Xuất (Xanh)** to rõ, dễ đọc.
  - Cán bộ bấm **`[Thay Thế]`**, hệ thống sử dụng Range DOM API chuẩn để ghi đè sạch sẽ 100%.
- **Cơ chế Khóa Request & Nút Dừng Khẩn Cấp (AbortController):**
  - Khóa nút click trùng lặp khi AI đang xử lý.
  - Nút **`[🛑 DỪNG AI]`** màu đỏ cho phép ngắt kết nối stream ngay tức thì.
- **Gợi ý nhanh 1-Click:** `💡 Đánh giá bài`, `✍️ Viết Kết Bài`, `🔍 Soát Chính Tả`, `🏛️ Hành Chính Hóa`.

#### 3. Chèn Ảnh Báo Chí & Studio Đồ Họa Thông Minh
- **Tự động sinh ảnh minh họa Flux AI:** Tích hợp mô hình sinh ảnh chất lượng cao 16:9 từ mô tả sự kiện.
- **Bảo lưu con trỏ chuột (`savedImageInsertRange`):** Tự động ghi nhớ vị trí con trỏ đang soạn thảo, chèn ảnh thẻ `<figure>` kèm chú thích `<figcaption>` chính xác tuyệt đối.
- **Biên tập Banner Canvas Studio:** Tự động vẽ banner nhận diện thương hiệu TDMU chuẩn 600x340px, hỗ trợ tải về hoặc chèn thẳng vào bài báo.

#### 4. Hệ Thống Hoàn Tác Đồng Bộ (Undo / Redo Multi-Level)
- Bộ nhớ lưu trữ đa tầng theo dõi mọi biến đổi (gõ tay, áp dụng AI, chèn ảnh).
- Hỗ trợ phím tắt `Ctrl+Z` (Lùi lại) và `Ctrl+Y` (Tiến tới) mượt mà trên thanh công cụ Ribbon chuẩn Microsoft Word.

#### 5. Kiểm Tra Chất Lượng AI (Audit Scorecard)
- Chấm điểm bài viết theo thang điểm **100** dựa trên 4 tiêu chí khắt khe của văn bản báo chí đoàn thể.

#### 6. Phân Hệ Báo Cáo Tháng & Thi Đua 16 Tổ Công Đoàn
- **Subtab 1 - Bảng Tổng Hợp & Xếp Loại**: Bảng số liệu của toàn bộ 16 Tổ CĐ, KPI tổng hợp, xếp hạng thi đua (với 4 tổ dẫn đầu Loại A xuất sắc: Tổ 9, 11, 15, 4), modal xem chi tiết báo cáo và link Google Drive minh chứng.
- **Subtab 2 - Biểu Mẫu Điện Tử (BM-02/CĐ)**: Biểu mẫu nhập trực tiếp 5 phần báo cáo nộp vào CSDL.
- **Subtab 3 - Google Form Nhúng Trực Tiếp**: Nhúng bản Google Form khảo sát chính thức của Trường.

---

### 🌐 B. Cổng Thông Tin Độc Giả (Public Portal)
* **Trang chủ (`index.html`):** Bố cục hiện đại theo nhận diện thương hiệu Đại học Thủ Dầu Một, tin tức tiêu điểm, luồng tin hoạt động phong trào, thông báo nhanh.
* **Chi tiết bài viết & Đọc nhanh (`bai-viet.html`, `tin-tuc.html`):** Hỗ trợ đọc bài toàn văn, xem qua modal tương tác trực tiếp mà không cần chuyển trang.
* **Tủ sách đọc sau (Offline Bookmarks Drawer):** Cho phép đoàn viên lưu bài viết yêu thích để đọc offline ngay trên thiết bị bằng Web Storage & PWA Service Worker.
* **Cơ cấu Tổ chức (`co-cau-to-chuc.html`):** Sơ đồ nhân sự Ban Thường vụ, Ban Chấp hành, Ủy ban Kiểm tra, Ban Nữ công.
* **Kho Văn bản pháp quy (`van-ban.html`):** Phân loại 4 nhóm chuẩn: *Văn bản Tuyên truyền, Kế hoạch, Luật Công đoàn, Quyết định* kèm chức năng tìm kiếm và tải file PDF/DOCX.
* **Kho Biểu mẫu (`bieu-mau.html`):** Danh mục biểu mẫu hành chính đoàn thể chuẩn phục vụ cán bộ, đoàn viên.
* **Chính sách & Phúc lợi (`phuc-loi-doan-vien.html`):** Chế độ chăm lo, thăm hỏi ốm đau, hiếu hỉ, vay vốn, học bổng con em đoàn viên.
* **Danh bạ 16 Tổ Công đoàn (`lien-he.html`):** Thông tin liên hệ, email, số điện thoại và văn phòng làm việc của 16 Tổ CĐ.

---

## 🗄️ 3. KIẾN TRÚC CƠ SỞ DỮ LIỆU CHUẨN 3NF (15 BẢNG)

Hệ thống được thiết kế theo chuẩn chuẩn hóa dữ liệu **3NF** (Third Normal Form), đảm bảo không dư thừa, tối ưu truy vấn và bảo đảm toàn vẹn tham chiếu với các ràng buộc khóa ngoại `ON DELETE CASCADE` và `ON DELETE SET NULL`.

```text
                            +--------------------+
                            |      TO_CHUC       |
                            +--------------------+
                                      | 1
                                      |
                                      | n
+--------------------+ 1    n +--------------------+ 1    n +--------------------+
|    TO_CONG_DOAN    |--------|      NHAN_SU       |--------|      ARTICLES      |
+--------------------+        +--------------------+        +--------------------+
          | 1                           | 1                   | 1     | 1     | 1
          |                             |                     |       |       |
          | n                           | n                   | n     | n     | n
+--------------------+        +--------------------+        +-----+ +-----+ +-----+
|  MONTHLY_REPORTS   |        |     DOCUMENTS      |        | SCH | | COM | | BMK |
+--------------------+        +--------------------+        +-----+ +-----+ +-----+
                                        | 1                    |       |       |
                                        |                   Lịch   Bình    Tủ sách
                                        | n                  đăng   luận   cá nhân
                              +--------------------+
                              |       USERS        |
                              +--------------------+
                                        | 1
                                        | n
                              +--------------------+
                              |   ARTICLE_AUDITS   |
                              +--------------------+

             [ PHÂN HỆ CHĂM LO PHÚC LỢI & Ý KIẾN ĐOÀN VIÊN ]
        +--------------------+ 1      n +--------------------+
        |      PHUC_LOI      |----------|     DON_TRO_CAP    |
        +--------------------+          +--------------------+
                                                  |
                                                  | (NhanSu / DoanVien)
                                        +--------------------+
                                        |   INBOX_FEEDBACK   |
                                        +--------------------+
```

### 🏛️ Nhóm 1: 8 Bảng Quản Trị Cốt Lõi (Core Governance & Media)
| STT | Tên Bảng | Ý Nghĩa Nghiệp Vụ Trong Hệ Thống TDMU |
|:---:|:---|:---|
| **1** | `TO_CHUC` | Quản lý 5 Ban chuyên môn cấp Trường (BTV, BCH, UBKT, Ban Nữ công, Ban Tuyên giáo). |
| **2** | `TO_CONG_DOAN` | Danh mục **16 Tổ Công đoàn cơ sở trực thuộc** (Khối Hiệu bộ, Viện CNS, Trường Luật, Sư phạm...). |
| **3** | `NHAN_SU` | Hồ sơ cán bộ BCH, UBKT và giảng viên đoàn viên toàn trường. |
| **4** | `CATEGORIES` | Danh mục chuyên đề bài viết (*Hoạt động phong trào, Thông báo, Gương sáng, Chăm lo, Nữ công*). |
| **5** | `ARTICLES` | Quản lý bài báo, nội dung đa kênh AI (Web HTML, Facebook Caption, Zalo OA, Video 60s), cờ AI, lượt xem. |
| **6** | `DOCUMENTS` | Kho văn bản chỉ đạo 4 loại (*Tuyên truyền, Kế hoạch, Luật Công đoàn, Quyết định*), file PDF/DOCX. |
| **7** | `MONTHLY_REPORTS` | **Báo cáo định kỳ & Đánh giá thi đua 16 Tổ CĐ** (khớp 100% mẫu BM-02/CĐ). |
| **8** | `SCHEDULES` | Lập lịch hẹn giờ Cronjob tự động & xuất bản đa kênh. |

### 🌟 Nhóm 2: 7 Bảng Bổ Trợ Tương Tác, Phúc Lợi & Kiểm Toán (Interactive Portal & Welfare)
| STT | Tên Bảng | Ý Nghĩa Nghiệp Vụ Trong Hệ Thống TDMU |
|:---:|:---|:---|
| **9** | `USERS` | Tài khoản xác thực & phân quyền 3 Role (`Admin`, `Editor`, `Contributor`). |
| **10**| `ARTICLE_AUDITS`| Lịch sử tác nghiệp & vết duyệt bài (ai tạo, ai sửa, ai duyệt, IP tác nghiệp). |
| **11**| `COMMENTS` | Ý kiến đóng góp, phản hồi và bình luận của đoàn viên dưới bài viết. |
| **12**| `BOOKMARKS` | **Tủ sách đọc sau cá nhân** (lưu trữ bài viết yêu thích đọc offline qua PWA). |
| **13**| `PHUC_LOI` | Danh mục các chương trình phúc lợi (*Quà tết, Hỗ trợ thai sản nữ công, Trợ cấp ốm đau, Vay CEP*). |
| **14**| `DON_TRO_CAP` | Hồ sơ tiếp nhận đơn đề nghị trợ cấp khó khăn & theo dõi tiến độ giải ngân kinh phí. |
| **15**| `INBOX_FEEDBACK`| Hòm thư tư liệu, phản ánh kiến nghị & đóng góp xây dựng Công đoàn gửi về BTV. |

*File kịch bản SQL 15 bảng đã được cung cấp sẵn trong thư mục `database/`:*
* `database/schema_15_tables_mssql.sql` & `database/seed_15_tables_mssql.sql` (Microsoft SQL Server / SSMS)
* `database/schema_15_tables_mysql.sql` & `database/seed_15_tables_mysql.sql` (MySQL / MariaDB / phpMyAdmin)

---

## 🛠️ 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Bước 1: Clone Repository từ GitHub
```bash
git clone https://github.com/t5ry7y88889/CongDoanTDMU.git
cd CongDoanTDMU
```

### Bước 2: Cài đặt Dependencies
```bash
npm install
```

### Bước 3: Cấu hình Môi trường (`.env`)
Tạo file `.env` tại thư mục gốc:
```env
PORT=3000

# Microsoft SQL Server (Tùy chọn kết nối SSMS)
DB_SERVER=localhost
DB_DATABASE=TDMU_TradeUnion_DB
DB_USER=sa
DB_PASSWORD=YourPassword123

# Cấu hình AI Engines
GEMINI_API_KEY=AIzaSy...
GROQ_API_KEY=gsk_...
```

### Bước 4: Khởi tạo Cơ Sở Dữ Liệu
* **Cách 1: Microsoft SQL Server (SSMS)**:
  - Mở SSMS, mở và chạy file `database/schema_15_tables_mssql.sql`.
  - Chạy tiếp file nạp dữ liệu mẫu: `database/seed_15_tables_mssql.sql`.
* **Cách 2: MySQL / MariaDB (XAMPP / phpMyAdmin)**:
  - Import file `database/schema_15_tables_mysql.sql`.
  - Import tiếp file nạp dữ liệu mẫu: `database/seed_15_tables_mysql.sql`.
* **Cách 3: Chế độ Tự Động (JSON Database Fallback)**:
  - Hệ thống tích hợp sẵn engine CSDL `server/database.json`. Nếu không cài SQL Server, hệ thống tự động chạy chế độ Offline NLP Fallback mà không gặp bất kỳ lỗi nào!

### Bước 5: Khởi động Server
```bash
node server/server.js
```

### Bước 6: Truy cập Ứng Dụng
* 🌐 **Cổng thông tin người đọc (Portal):** [http://localhost:3000](http://localhost:3000)
* ⚙️ **Phòng Biên tập AI Studio & Quản trị CMS:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
* 📊 **Module Báo Cáo Tháng 16 Tổ:** [http://localhost:3000/admin.html#reports](http://localhost:3000/admin.html#reports)

---

## 📂 5. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
tdmu-congdoan-web/
├── database/                                  # Cơ sở dữ liệu & Migrations
│   ├── schema_15_tables_mssql.sql             # Schema DDL 15 bảng chuẩn 3NF (Microsoft SQL Server)
│   ├── seed_15_tables_mssql.sql               # Seed Data 15 bảng: 16 tổ, bài viết, phúc lợi (MSSQL)
│   ├── schema_15_tables_mysql.sql             # Schema DDL 15 bảng chuẩn (MySQL/MariaDB)
│   ├── seed_15_tables_mysql.sql               # Seed Data 15 bảng chuẩn (MySQL)
│   └── migrations/                            # Laravel Migrations
├── public/                                    # Giao diện người dùng & Portal
│   ├── index.html                             # Trang chủ Portal truyền thông TDMU
│   ├── admin.html                             # Phòng Biên tập AI Studio & Quản trị CMS
│   ├── tin-tuc.html                           # Trang Tin tức & Hoạt động
│   ├── bai-viet.html                          # Trang đọc chi tiết bài viết
│   ├── co-cau-to-chuc.html                    # Trang Cơ cấu Tổ chức BCH & các Ban
│   ├── van-ban.html                           # Trang Kho Văn bản pháp quy
│   ├── bieu-mau.html                          # Trang Kho Biểu mẫu hành chính
│   ├── phuc-loi-doan-vien.html                # Trang Chăm lo đời sống & Phúc lợi
│   ├── gioi-thieu.html                        # Trang Lịch sử & Truyền thống TDMU
│   ├── lien-he.html                           # Danh bạ 16 Tổ Công đoàn bộ phận
│   ├── manifest.json                          # Cấu hình PWA (Progressive Web App)
│   ├── sw.js                                  # Service Worker hỗ trợ offline caching
│   ├── css/
│   │   ├── style.css                          # Style hệ thống Admin & AI Studio
│   │   └── portal.css                         # Style giao diện Portal người đọc
│   ├── js/
│   │   ├── admin.js                           # Logic Manus Copilot, Undo/Redo, SSE Streaming & CMS
│   │   ├── api.js                             # Module kết nối RESTful API
│   │   ├── bookmarks.js                       # Logic Tủ sách đọc sau (Bookmarks Drawer)
│   │   └── app.js                             # Logic hiển thị Portal
│   └── uploads/                               # Thư mục chứa tài liệu PDF & hình ảnh
├── server/                                    # Backend REST API Server
│   ├── server.js                              # Node.js Express Server & Multi-Pass SSE Streaming
│   ├── mssql_db.js                            # Module kết nối Microsoft SQL Server
│   └── database.json                          # CSDL nhúng dự phòng (JSON Fallback Engine)
├── .env                                       # Biến môi trường
├── .gitignore                                 # Danh mục loại trừ Git
├── package.json                               # Khai báo thư viện phụ thuộc
└── README.md                                  # Tài liệu hướng dẫn toàn diện của dự án
```

---

## 💻 6. CÔNG NGHỆ ÁP DỤNG

* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, FontAwesome 6, Canvas 2D API, PWA Service Worker.
* **Backend:** Node.js, Express.js (RESTful Architecture), Server-Sent Events (SSE).
* **Database:** Microsoft SQL Server 2019/2022 (T-SQL, Stored Procedures, Views), MySQL 8.0, JSON Embedded DB Engine.
* **Trí tuệ Nhân tạo (Generative AI):**
  - **Google Gemini 2.5 Flash API**: Tốc độ sinh bài vượt trội, hỗ trợ native content streaming (`generateContentStream`).
  - **Groq LLaMA 3.3 70B Versatile API**: Tốc độ phản hồi cực cao (800+ tokens/giây), tự động fallback.
  - **Flux AI / Pollinations**: Sinh ảnh nghệ thuật và ảnh tư liệu báo chí tỷ lệ 16:9 tự động.
  - **Local NLP Heuristic Engine**: Cơ chế đệm offline tự động xử lý khi không có internet hoặc thiếu API key.
* **Tiêu chuẩn Thiết kế:** Đáp ứng 100% hướng dẫn thể thức văn bản hành chính theo **Nghị định 30/2020/NĐ-CP** và **Điều lệ Công đoàn Việt Nam**.

---

## 👥 7. THÔNG TIN NHÓM THỰC HIỆN

| Họ và Tên | MSSV | Lớp | Vai Trò |
|:---|:---:|:---:|:---|
| **Nguyễn Bình Dương** | 2424802010319 | D24CNTT05 | Trưởng nhóm - Thiết kế CSDL, Backend API, Tích hợp AI Studio, SSE Pipeline & Copilot |
| **Trần Hồng Thanh** | 2424802010439 | D24CNTT03 | Thành viên - Phát triển Giao diện Portal, Hệ thống Báo Cáo Tháng, Responsive PWA |
| **Phạm Anh Tuấn** | 2324802010393 | D23CNTT03 | Thành viên - Quản trị Kho Văn bản, Kho Tư liệu DAM, Báo cáo kiểm thử hệ thống |

*Đề tài Nghiên cứu Khoa học Sinh viên / Đồ án Cơ sở ngành - Viện Công nghệ số, Trường Đại học Thủ Dầu Một (2026).*
