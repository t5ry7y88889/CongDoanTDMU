# 🇻🇳 WEBSITE TRUYỀN THÔNG CÔNG ĐOÀN TDMU TÍCH HỢP AI

> **ĐỀ TÀI NGHIÊN CỨU KHOA HỌC SINH VIÊN / ĐỒ ÁN CƠ SỞ NGÀNH**  
> **Đơn vị quản lý:** Viện Công Nghệ Số – Trường Đại Học Thủ Dầu Một (TDMU)  
> **Giảng viên hướng dẫn:** ThS. Võ Quốc Lương  
> **Nhóm sinh viên thực hiện (Nhóm 2):**
> 1. **Nguyễn Bình Dương** (Nhóm trưởng) – MSSV: 2424802010319 – Lớp: D24CNTT05
> 2. **Trần Hồng Thanh** – MSSV: 2424802010439 – Lớp: D24CNTT03
> 3. **Phạm Anh Tuấn** – MSSV: 2324802010393 – Lớp: D23CNTT03

---

## 📌 1. GIỚI THIỆU HỆ THỐNG
Hệ thống Website truyền thông chuyên biệt dành cho **Công đoàn Trường Đại học Thủ Dầu Một (TDMU)** bám sát 100% mô hình nghiệp vụ thực tế của nhà trường (congdoan.tdmu.edu.vn). Ứng dụng tích hợp sâu **Trí tuệ Nhân tạo (Generative AI)** hỗ trợ cán bộ kiêm nhiệm tự động hóa quy trình sáng tạo bài viết, biên tập tin tức, báo cáo thi đua định kỳ của **16 Tổ Công đoàn**, xuất bản đa kênh và quản lý tập trung toàn bộ dữ liệu tổ chức đoàn thể.

---

## 🌟 2. CÁC TÍNH NĂNG & PHÂN HỆ CỐT LÕI

### 🌐 A. Cổng thông tin độc giả (Public Portal)
* **Trang chủ (index.html):** Tin tức nổi bật, hoạt động phong trào, banner sự kiện, góc đoàn viên.
* **Cơ cấu Tổ chức (co-cau-to-chuc.html):** Ban Thường vụ, Ban Chấp hành, Ủy ban Kiểm tra, Ban Nữ công.
* **Danh bạ 16 Tổ Công đoàn (lien-he.html):** Thông tin liên hệ và văn phòng làm việc của 16 Tổ Công đoàn toàn trường.
* **Kho Văn bản (an-ban.html):** Tra cứu Nghị quyết, Quyết định, Kế hoạch, Hướng dẫn thi đua.
* **Kho Biểu mẫu (ieu-mau.html):** Tải về Lý lịch đoàn viên, Đơn gia nhập công đoàn, Mẫu báo cáo tháng.
* **Chính sách & Phúc lợi (phuc-loi-doan-vien.html):** Chế độ thai sản, ốm đau, khen thưởng, chăm lo đời sống.
* **Giới thiệu (gioi-thieu.html):** Lịch sử hình thành, truyền thống và thành tích tiêu biểu của Công đoàn TDMU.

### ⚙️ B. Phân hệ Quản trị CMS & Trợ lý AI Studio (dmin.html)
1. **Trợ lý AI Sáng tạo Nội dung (AI Studio):**
   * Tự động gợi ý 3 tiêu đề bài viết hấp dẫn, chuẩn phong cách báo chí.
   * Soạn thảo khung bài viết hoàn chỉnh từ các ý chính hoặc nội dung cuộc họp.
   * Tóm tắt văn bản/tin tức dài thành bản tin vắn súc tích (50 từ).
   * Chuẩn hóa lỗi chính tả và tối ưu văn phong truyền thông Công đoàn.
   * Tự động lưu vết Prompts, số Token và Model AI (LICH_SU_AI).
2. **Quy trình Quản lý & Phê duyệt bài viết (CMS Workflow):**
   * Vòng đời bài viết: *Bản nháp (Draft) -> Chờ duyệt (Pending) -> Đã duyệt (Approved) -> Xuất bản (Published)*.
3. **Quản lý Báo cáo Tháng & Thi đua 16 Tổ Công đoàn:**
   * Tự động hóa tiếp nhận số liệu báo cáo định kỳ: đoàn viên mới, số nữ, chăm lo bệnh hiểm nghèo, số tiền chi, tuyên truyền, kế hoạch tháng tới.
4. **Lập lịch xuất bản tự động & Đăng tải Fanpage Facebook:**
   * Hẹn ngày giờ đăng bài tự động và đồng bộ qua Facebook Graph API v19.0.
5. **Dashboard Thống kê Tương tác:**
   * Biểu đồ lượt xem, tương tác, phân bố số liệu theo từng Tổ Công đoàn.

---

## 🗄️ 3. KIẾN TRÚC CƠ SỞ DỮ LIỆU TOÀN DIỆN (12 BẢNG ENTERPRISE)

Hệ thống được thiết kế theo chuẩn **3NF**, có đầy đủ Ràng buộc toàn vẹn, Non-Clustered Indexes, Views thống kê tự động và Stored Procedures:

| STT | Bảng dữ liệu | Chức năng thực tế trong hệ thống TDMU |
| :---: | :--- | :--- |
| **1** | TO_CHUC | Quản lý Ban Thường vụ, Ban Chấp hành, UB Kiểm tra, Ban Nữ công cấp trường. |
| **2** | TO_CONG_DOAN | Quản lý **16 Tổ Công đoàn cơ sở** (CĐ 1-4, Viện CNS, Trường Luật, Sư phạm, KTTC...). |
| **3** | NHAN_SU | Hồ sơ cán bộ, giảng viên, đoàn viên toàn trường & tài khoản phân quyền. |
| **4** | CHUYEN_MUC | Danh mục chuyên đề bài viết (*Tin hoạt động, Thông báo, Phong trào, Chăm lo*). |
| **5** | TIN_TUC | Quản trị bài viết, hình ảnh, cờ AI, quy trình duyệt bài và số lượt xem. |
| **6** | LOAI_VAN_BAN | Phân loại văn bản (*Nghị quyết, Quyết định, Kế hoạch, Biểu mẫu hành chính*). |
| **7** | VAN_BAN | Kho văn bản chỉ đạo, nghị quyết, quy chế và biểu mẫu file tải về (PDF/Docx). |
| **8** | BAO_CAO_THANG | **Báo cáo định kỳ & Đánh giá thi đua 16 Tổ CĐ** (khớp 100% biểu mẫu thực tế). |
| **9** | LICH_SU_AI | Lưu vết AI: Prompts, Model (Gemini/GPT/LLaMA), Tokens và kết quả sinh nội dung. |
| **10**| BINH_LUAN | Ý kiến đóng góp, phản hồi và bình luận của đoàn viên dưới bài viết. |
| **11**| LICH_DANG_BAI | Lập lịch Cronjob tự động & Đẩy bài lên Fanpage Facebook qua Graph API. |
| **12**| NHAT_KY_HE_THONG | Audit Logs lưu vết an ninh: ai sửa gì, ai duyệt bài, đăng nhập từ IP nào. |

*File SQL đã được cung cấp sẵn trong thư mục database/:*
* database/schema_5_tables_mssql.sql (Cho Microsoft SQL Server / SSMS / LocalDB)
* database/schema_5_tables_mysql.sql (Cho MySQL / phpMyAdmin / XAMPP)

---

## 🛠️ 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Bước 1: Cài đặt thư viện dependencies
Mở Terminal tại thư mục 	dmu-congdoan-web:
`ash
npm install
`

### Bước 2: Khởi động Server
`ash
npm start
# hoặc: node server/server.js
`

### Bước 3: Truy cập hệ thống trên trình duyệt
* **Cổng thông tin người đọc:** http://localhost:3000
* **Trang Quản trị CMS & AI Studio:** http://localhost:3000/admin.html

### Bước 4: Kết nối CSDL SQL Server (SSMS)
* **Server Name:** (localdb)\MSSQLLocalDB *(hoặc . / localhost)*
* **Authentication:** Windows Authentication
* **Database:** TDMU_CongDoan_DB

---

## 📂 5. CẤU TRÚC THƯ MỤC DỰ ÁN

`	ext
tdmu-congdoan-web/
├── database/                        # Cơ sở dữ liệu & Migrations
│   ├── migrations/                  # 5 file Laravel Migrations chuẩn
│   ├── schema_5_tables_mssql.sql    # Bản SQL Server Enterprise (12 Bảng + Views + SP)
│   └── schema_5_tables_mysql.sql    # Bản MySQL / phpMyAdmin
├── public/                          # Frontend giao diện người dùng
│   ├── index.html                   # Trang chủ Portal truyền thông TDMU
│   ├── admin.html                   # Trang Quản trị CMS & AI Studio
│   ├── co-cau-to-chuc.html          # Trang Cơ cấu Tổ chức BCH
│   ├── van-ban.html                 # Trang Kho Văn bản chỉ đạo
│   ├── bieu-mau.html                # Trang Biểu mẫu hành chính
│   ├── phuc-loi-doan-vien.html      # Trang Chăm lo đời sống & Phúc lợi
│   ├── gioi-thieu.html              # Trang Giới thiệu Công đoàn TDMU
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
`

---

## 💻 6. CÔNG NGHỆ SỬ DỤNG
* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, FontAwesome 6.
* **Backend:** Node.js, Express.js (RESTful APIs).
* **Database:** Microsoft SQL Server 2019/2022 (T-SQL), MySQL 8.0, Laravel Migrations.
* **Trí tuệ Nhân tạo (AI):** OpenAI GPT API / Google Gemini API / Groq LLaMA 3.3.
* **Mạng xã hội:** Facebook Graph API v19.0+.
