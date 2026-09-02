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

Hệ thống **Truyền Thông & Quản Trị Công Đoàn TDMU Tích Hợp AI** là nền tảng số hóa toàn diện được thiết kế riêng cho **Công đoàn Cơ sở Trường Đại học Thủ Dầu Một** (congdoan.tdmu.edu.vn). 

Dự án giải quyết triệt để các bài toán thực tiễn của công tác đoàn thể đại học:
1. **Số hóa quy trình tác nghiệp**: Chấm dứt tình trạng nộp báo cáo giấy, phân tán dữ liệu giữa **16 Tổ Công đoàn bộ phận**.
2. **Trợ lý AI Biên tập (AI Content Studio)**: Tích hợp **Manus AI Copilot** hỗ trợ cán bộ viết bài, trau chuốt thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP, kiểm tra chất lượng nội dung và xuất bản đa kênh tự động.
3. **Cơ sở dữ liệu chuẩn 3NF**: Kiến trúc 9 bảng thống nhất, hỗ trợ song song **Microsoft SQL Server (T-SQL)** và **MySQL/MariaDB**, có cơ chế Offline Fallback an toàn tuyệt đối.

---

## 🌟 2. CÁC PHÂN HỆ & TÍNH NĂNG CỐT LÕI

### 🌐 A. Cổng thông tin độc giả (Public Portal)
* **Trang chủ (`index.html`):** Bố cục hiện đại theo nhận diện thương hiệu Đại học Thủ Dầu Một, tin tức tiêu điểm, luồng tin hoạt động phong trào, thông báo nhanh.
* **Chi tiết bài viết & Đọc nhanh (`bai-viet.html`, `tin-tuc.html`):** Hỗ trợ đọc bài toàn văn, xem qua modal tương tác trực tiếp mà không cần chuyển trang.
* **Tủ sách đọc sau (Offline Bookmarks Drawer):** Cho phép đoàn viên lưu bài viết yêu thích để đọc offline ngay trên thiết bị bằng Web Storage & PWA.
* **Cơ cấu Tổ chức (`co-cau-to-chuc.html`):** Sơ đồ nhân sự Ban Thường vụ, Ban Chấp hành, Ủy ban Kiểm tra, Ban Nữ công.
* **Kho Văn bản pháp quy (`van-ban.html`):** Phân loại 4 nhóm chuẩn: *Văn bản Tuyên truyền, Kế hoạch, Luật Công đoàn, Quyết định* kèm chức năng tìm kiếm và tải file PDF/DOCX.
* **Kho Biểu mẫu (`bieu-mau.html`):** Danh mục biểu mẫu hành chính đoàn thể chuẩn phục vụ cán bộ, đoàn viên.
* **Chính sách & Phúc lợi (`phuc-loi-doan-vien.html`):** Chế độ chăm lo, thăm hỏi ốm đau, hiếu hỉ, vay vốn, học bổng con em đoàn viên.
* **Danh bạ 16 Tổ Công đoàn (`lien-he.html`):** Thông tin liên hệ, email, số điện thoại và văn phòng làm việc của 16 Tổ CĐ.

---

### 🤖 B. Tòa soạn AI Content Studio & Quản trị CMS (`admin.html`)

1. **Trợ lý Trực tuyến Manus AI Copilot:**
   - **Tương tác ngữ cảnh thời gian thực**: Tự động nhận diện đoạn văn bản đang bôi đen (`Context Pill`) để giải thích, viết tiếp hoặc gọt giũa.
   - **Nút nổi thông minh**: Nổi lên ngay trên con trỏ chuột (`✨ Hỏi Copilot sửa đoạn này`).
   - **Chỉnh sửa trực tiếp (Direct In-place Edit)**: Đề xuất phương án sửa và cung cấp nút **`✨ Áp Dụng (Apply)`** thay thế thẳng vào văn bản Word.
   - **Gợi ý nhanh 1-Click**: `💡 Đánh giá bài`, `✍️ Viết Kết Bài`, `🔍 Soát Chính Tả`, `🏛️ Hành Chính Hóa`.

2. **Hệ thống Tiến / Lùi (Undo / Redo) Đồng Bộ với AI & Bộ Nhớ Ngữ Cảnh:**
   - Cặp nút **`Lùi (Ctrl+Z)`** và **`Tiến (Ctrl+Y)`** trên thanh công cụ Ribbon.
   - **Đồng bộ tuyệt đối với AI**: Bất kỳ khi nào AI sửa (Copilot apply, nút Hành chính hóa, Mở rộng), hệ thống đều lưu snapshot trước và sau.
   - **Bộ nhớ AI hoàn tác (Memory Rollback)**: Khi người dùng bấm Undo hoặc bấm nút *"Hoàn tác"* trong chat, ngữ cảnh bộ nhớ của Copilot tự động quay ngược về thời điểm trước khi sửa, không bị lệch ngữ cảnh.

3. **Hệ thống Kiểm Tra Chất Lượng Nội Dung AI (Audit Scorecard):**
   - Chấm điểm chất lượng toàn diện thang điểm **100**.
   - Kiểm tra 4 tiêu chí cốt lõi:
     - *Chính tả & Ngữ pháp tiếng Việt*.
     - *Chuẩn mực văn phong hành chính Công đoàn TDMU*.
     - *Tính nhất quán & Độ tin cậy số liệu*.
     - *Cấu trúc bố cục & Độ hấp dẫn độc giả*.
   - Khuyến nghị tối ưu hóa thông minh trước khi gửi Ban Thường Vụ phê duyệt.

4. **Biên tập Đồ họa Canvas Studio:**
   - Thiết kế Banner báo chí kích thước chuẩn 600x340px.
   - Kéo thả tiêu đề, phụ đề trực tiếp bằng chuột trên Canvas.
   - Xuất file ảnh chất lượng cao đính kèm bài viết.

5. **Quy trình Xuất bản Đa Kênh (4-Step Pipeline):**
   - *Bước 1*: Nhập sự kiện / Yêu cầu $\rightarrow$ *Bước 2*: Lựa chọn 3 Tiêu đề báo chí $\rightarrow$ *Bước 3*: Soạn thảo chuẩn Word & Copilot $\rightarrow$ *Bước 4*: Đóng gói đa kênh (Website, Facebook Caption, Zalo OA, Kịch bản Video ngắn 60s).

6. **Phân hệ Báo Cáo Tháng & Thi Đua 16 Tổ Công đoàn:**
   - **Subtab 1 - Bảng Tổng Hợp & Xếp Loại**: Bảng số liệu của toàn bộ 16 Tổ CĐ, KPI tổng hợp, xếp hạng thi đua (với 4 tổ dẫn đầu Loại A xuất sắc: Tổ 9, 11, 15, 4), modal xem chi tiết báo cáo và link Google Drive minh chứng.
   - **Subtab 2 - Biểu Mẫu Điện Tử (BM-02/CĐ)**: Biểu mẫu nhập trực tiếp 5 phần báo cáo nộp vào CSDL.
   - **Subtab 3 - Google Form Nhúng Trực Tiếp**: Nhúng bản Google Form khảo sát chính thức của Trường.

---

## 🗄️ 3. KIẾN TRÚC CƠ SỞ DỮ LIỆU TOÀN DIỆN 15 BẢNG (15 TABLES 3NF ENTERPRISE SCHEMA)

Hệ thống được thiết kế theo chuẩn chuẩn hóa dữ liệu **3NF** (Third Normal Form), đảm bảo không dư thừa, tối ưu truy vấn và bảo đảm toàn vẹn tham chiếu với các ràng buộc khóa ngoại `ON DELETE CASCADE` và `ON DELETE SET NULL`.

Toàn bộ hệ thống 15 bảng được cấu trúc thành **2 Nhóm chức năng** bổ trợ nhau hoàn chỉnh:

```
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
| **3** | `NHAN_SU` | Hồ sơ 13 cán bộ BCH, UBKT và giảng viên đoàn viên toàn trường. |
| **4** | `CATEGORIES` | Danh mục chuyên đề bài viết (*Hoạt động phong trào, Thông báo, Gương sáng, Chăm lo, Nữ công*). |
| **5** | `ARTICLES` | Quản lý bài báo, nội dung đa kênh AI (Web HTML, Facebook Caption, Zalo OA, Video 60s), cờ AI, lượt xem. |
| **6** | `DOCUMENTS` | Kho văn bản chỉ đạo 4 loại (*Tuyên truyền, Kế hoạch, Luật Công đoàn, Quyết định*), file PDF/DOCX. |
| **7** | `MONTHLY_REPORTS` | **Báo cáo định kỳ & Đánh giá thi đua 16 Tổ CĐ** (khớp 100% mẫu BM-02/CĐ và Google Forms thực tế). |
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
Tạo file `.env` tại thư mục gốc (hoặc dùng file mẫu):
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

### Bước 4: Khởi tạo Cơ Sở Dữ Liệu (Tùy chọn MSSQL hoặc MySQL)
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
* 🌐 **Cổng thông tin người đọc (Portal):** `http://localhost:3000`
* ⚙️ **Phòng Biên tập AI & Quản trị CMS:** `http://localhost:3000/admin.html`
* 📊 **Module Báo Cáo Tháng:** `http://localhost:3000/admin.html#reports`

---

## 📂 5. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
tdmu-congdoan-web/
├── database/                                  # Cơ sở dữ liệu & Migrations
│   ├── schema_15_tables_mssql.sql             # Schema DDL 15 bảng chuẩn 3NF (Microsoft SQL Server)
│   ├── seed_15_tables_mssql.sql               # Seed Data 15 bảng: 16 tổ, bài viết, phúc lợi (MSSQL)
│   ├── schema_15_tables_mysql.sql             # Schema DDL 15 bảng chuẩn (MySQL/MariaDB)
│   ├── seed_15_tables_mysql.sql               # Seed Data 15 bảng chuẩn (MySQL)
│   ├── schema_unified_9_tables_mssql.sql      # Bản rút gọn 9 bảng cốt lõi (MSSQL)
│   ├── schema_unified_9_tables_mysql.sql      # Bản rút gọn 9 bảng cốt lõi (MySQL)
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
│   │   ├── admin.js                           # Logic Manus Copilot, Undo/Redo, Canvas & CMS
│   │   ├── api.js                             # Module kết nối RESTful API
│   │   ├── bookmarks.js                       # Logic Tủ sách đọc sau (Bookmarks Drawer)
│   │   └── app.js                             # Logic hiển thị Portal
│   └── uploads/                               # Thư mục chứa tài liệu PDF & hình ảnh
├── server/                                    # Backend REST API Server
│   ├── server.js                              # Node.js Express Server & Điều phối AI Engines
│   ├── mssql_db.js                            # Module kết nối Microsoft SQL Server
│   └── database.json                          # CSDL nhúng dự phòng (JSON Fallback Engine)
├── .env                                       # Biến môi trường
├── .gitignore                                 # Danh mục loại trừ Git
├── package.json                               # Khai báo thư viện phụ thuộc
└── README.md                                  # Tài liệu hướng dẫn toàn diện của dự án
```

---

## 💻 6. CÔNG NGHỆ ÁP DỤNG

* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.3, FontAwesome 6, Canvas API, PWA Service Worker.
* **Backend:** Node.js, Express.js (RESTful Architecture), Laravel 10 (Dual Framework Support).
* **Database:** Microsoft SQL Server 2019/2022 (T-SQL, Stored Procedures, Views), MySQL 8.0, JSON Embedded DB.
* **Trí tuệ Nhân tạo (Generative AI):**
  - **Google Gemini 2.5 Flash API**: Tốc độ sinh bài vượt trội, hỗ trợ phân tích đa kênh.
  - **Groq LLaMA 3.1 70B Versatile API**: Siêu tốc độ (800+ tokens/giây), chuyển đổi dự phòng tự động.
  - **Local NLP Heuristic Engine**: Cơ chế đệm offline tự động xử lý khi không có internet hoặc API key.
* **Tiêu chuẩn Thiết kế:** Đáp ứng 100% hướng dẫn thể thức văn bản hành chính theo Nghị định 30/2020/NĐ-CP và Điều lệ Công đoàn Việt Nam.

---

## 👥 7. THÔNG TIN NHÓM THỰC HIỆN

| Họ và Tên | MSSV | Lớp | Vai Trò |
|:---|:---:|:---:|:---|
| **Nguyễn Bình Dương** | 2424802010319 | D24CNTT05 | Trưởng nhóm - Thiết kế CSDL, Backend API, Tích hợp AI Studio & Copilot |
| **Trần Hồng Thanh** | 2424802010439 | D24CNTT03 | Thành viên - Phát triển Giao diện Portal, Hệ thống Báo Cáo Tháng, Responsive PWA |
| **Phạm Anh Tuấn** | 2324802010393 | D23CNTT03 | Thành viên - Quản trị Kho Văn bản, Kho Tư liệu DAM, Báo cáo kiểm thử hệ thống |

*Đề tài Nghiên cứu Khoa học Sinh viên / Đồ án Cơ sở ngành - Viện Công nghệ số, Trường Đại học Thủ Dầu Một (2026).*
DMU
│   ├── lien-he.html                 # Trang Danh bạ 16 Tổ Công đoàn
│   ├── css/
│   │   └── style.css                # CSS giao diện chuẩn nhận diện TDMU
│   ├── js/
│   │   ├── admin.js                 # Logic Quản trị, Editor & Kết nối AI
│   │   ├── api.js                   # Module gọi RESTful API
│   │   └── app.js                   # Logic Portal người đọc
│   └── images/                      # Logo TDMU, ảnh banner & sự kiện
├── server/                          # Backend API Server
│   ├── server.js                    # Node.js / Express Server & AI Routes
│   └── database.json                # CSDL nhúng dạng JSON phục vụ API
├── .env                             # Biến môi trường & API Key
├── .gitignore                       # Cấu hình bỏ qua file nhạy cảm
├── package.json                     # Thông tin gói thư viện
└── README.md                        # Tài liệu hướng dẫn dự án
```


---

## 💻 6. CÔNG NGHỆ SỬ DỤNG
* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, FontAwesome 6.
* **Backend:** Node.js, Express.js (RESTful APIs).
* **Database:** Microsoft SQL Server 2019/2022 (T-SQL), MySQL 8.0, Laravel Migrations.
* **Trí tuệ Nhân tạo (AI):** OpenAI GPT API / Google Gemini API / Groq LLaMA 3.3.
* **Mạng xã hội:** Facebook Graph API v19.0+.
