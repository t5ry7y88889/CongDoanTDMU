# 🇻🇳 WEBSITE TRUYỀN THÔNG CÔNG ĐOÀN TDMU TÍCH HỢP AI

> **ĐỀ TÀI NGHIÊN CỨU KHOA HỌC SINH VIÊN / ĐỒ ÁN CƠ SỞ NGÀNH**  
> **Đơn vị quản lý:** Viện Công Nghệ Số – Trường Đại Học Thủ Dầu Một (TDMU)  
> **Giảng viên hướng dẫn:** ThS. Võ Quốc Lương  
> **Nhóm sinh viên thực hiện (Nhóm 2):**
> 1. **Nguyễn Bình Dương** (Nhóm trưởng) – MSSV: `2424802010319` – Lớp: D24CNTT05
> 2. **Trần Hồng Thanh** – MSSV: `2424802010439` – Lớp: D24CNTT03
> 3. **Phạm Anh Tuấn** – MSSV: `2324802010393` – Lớp: D23CNTT03

---

## 📌 1. GIỚI THIỆU HỆ THỐNG
Hệ thống Website truyền thông chuyên biệt dành cho **Công đoàn Trường Đại học Thủ Dầu Một (TDMU)** bám sát 100% mô hình nghiệp vụ thực tế của nhà trường (`congdoan.tdmu.edu.vn`). Ứng dụng tích hợp sâu **Trí tuệ Nhân tạo (Generative AI)** hỗ trợ cán bộ kiêm nhiệm tự động hóa quy trình sáng tạo, biên tập, xuất bản đa kênh và quản lý tập trung toàn bộ dữ liệu tổ chức đoàn thể.

---

## 🌟 2. CÁC TÍNH NĂNG & MODULE CỐT LÕI

### 🌐 A. Cổng thông tin độc giả (Public Portal)
* **Trang chủ (`index.html`):** Tin tức nổi bật, hoạt động phong trào, banner sự kiện, góc đoàn viên.
* **Cơ cấu Tổ chức (`co-cau-to-chuc.html`):** Danh sách Ban Thường vụ, Ban Chấp hành, Ủy ban Kiểm tra, Ban Nữ công.
* **Tổ Công đoàn (`lien-he.html`):** Danh bạ liên hệ các Tổ Công đoàn trực thuộc các Viện, Khoa, Phòng ban.
* **Kho Văn bản (`van-ban.html`):** Tra cứu và tải về các Nghị quyết, Quyết định, Kế hoạch, Hướng dẫn thi đua.
* **Kho Biểu mẫu (`bieu-mau.html`):** Tải về Lý lịch đoàn viên, Đơn gia nhập công đoàn, Mẫu báo cáo tháng.
* **Chính sách & Phúc lợi (`phuc-loi-doan-vien.html`):** Chế độ thai sản, ốm đau, khen thưởng, vay vốn, chăm lo đời sống.
* **Giới thiệu (`gioi-thieu.html`):** Lịch sử hình thành, truyền thống và các thành tích tiêu biểu của Công đoàn TDMU.

### ⚙️ B. Phân hệ Quản trị CMS & Trợ lý AI Studio (`admin.html`)
1. **Trợ lý AI Sáng tạo Nội dung (AI Studio):**
   * Tự động gợi ý 3 tiêu đề bài viết hấp dẫn, chuẩn phong cách báo chí.
   * Soạn thảo khung bài viết hoàn chỉnh từ các ý chính hoặc nội dung cuộc họp.
   * Tóm tắt văn bản/tin tức dài thành bản tin vắn súc tích.
   * Chuẩn hóa lỗi chính tả và tối ưu văn phong truyền thông Công đoàn.
2. **Quy trình Quản lý & Phê duyệt bài viết (CMS Workflow):**
   * Vòng đời bài viết: *Bản nháp (Draft) -> Chờ duyệt (Pending) -> Đã duyệt (Approved) -> Xuất bản (Published)*.
3. **Lập lịch xuất bản tự động (Scheduler):** Hẹn ngày giờ đăng bài tự động theo các khung giờ tối ưu.
4. **Quản trị Văn bản & Biểu mẫu:** Upload file PDF/Docx, phân loại cơ quan ban hành.
5. **Dashboard Thống kê Tương tác:** Biểu đồ lượt xem (views), lượt tương tác (like/share), bài viết nổi bật.

---

## 🗄️ 3. KIẾN TRÚC CƠ SỞ DỮ LIỆU (5 BẢNG CỐT LÕI)

Hệ thống được thiết kế theo chuẩn **3NF** bám sát mô hình thực tế của Công đoàn TDMU:

| Bảng | Tên bảng SQL | Chức năng chính |
| :---: | :--- | :--- |
| **1** | `TO_CHUC` | Quản lý Ban Thường vụ, Ban Chấp hành, UB Kiểm tra, Ban Nữ công cấp trường. |
| **2** | `TO_CONG_DOAN` | Quản lý các Tổ Công đoàn trực thuộc (Viện CNS, Khoa Kinh tế, Phòng Đào tạo...). |
| **3** | `NHAN_SU` | Hồ sơ cán bộ, giảng viên, đoàn viên toàn trường & tài khoản phân quyền. |
| **4** | `TIN_TUC` | Quản lý bài viết, tin tức sự kiện, thông báo phong trào thi đua. |
| **5** | `VAN_BAN` | Kho văn bản chỉ đạo, nghị quyết, quy chế, kế hoạch và biểu mẫu hành chính. |

*File SQL đã được cung cấp sẵn trong thư mục `database/`:*
* `database/schema_5_tables_mssql.sql` (Cho Microsoft SQL Server / SSMS)
* `database/schema_5_tables_mysql.sql` (Cho MySQL / phpMyAdmin / XAMPP)

---

## 🛠️ 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY ỨNG DỤNG

### Bước 1: Cài đặt thư viện dependencies
Mở Terminal tại thư mục `tdmu-congdoan-web`:
```bash
npm install
```

### Bước 2: Khởi động Server
```bash
npm start
# hoặc: node server/server.js
```

### Bước 3: Truy cập hệ thống trên trình duyệt
* **Cổng thông tin người đọc:** `http://localhost:3000`
* **Trang Quản trị CMS & AI Studio:** `http://localhost:3000/admin.html`

---

## 📂 5. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
tdmu-congdoan-web/
├── database/                        # Cơ sở dữ liệu & Migrations
│   ├── migrations/                  # 5 file Laravel Migrations chuẩn
│   ├── schema_5_tables_mssql.sql    # Bản SQL cho SQL Server (SSMS)
│   └── schema_5_tables_mysql.sql    # Bản SQL cho MySQL (phpMyAdmin)
├── public/                          # Frontend giao diện người dùng
│   ├── index.html                   # Trang chủ Portal truyền thông TDMU
│   ├── admin.html                   # Trang Quản trị CMS & AI Studio
│   ├── co-cau-to-chuc.html          # Trang Cơ cấu Tổ chức BCH
│   ├── van-ban.html                 # Trang Kho Văn bản chỉ đạo
│   ├── bieu-mau.html                # Trang Biểu mẫu hành chính
│   ├── phuc-loi-doan-vien.html      # Trang Chăm lo đời sống & Phúc lợi
│   ├── gioi-thieu.html              # Trang Giới thiệu Công đoàn TDMU
│   ├── lien-he.html                 # Trang Danh bạ Tổ Công đoàn
│   ├── css/
│   │   └── style.css                # CSS giao diện chuẩn nhận diện TDMU
│   ├── js/
│   │   ├── admin.js                 # Logic Quản trị, Editor & Kết nối AI
│   │   ├── api.js                   # Module gọi RESTful API
│   │   └── app.js                   # Logic Portal người đọc
│   └── images/                      # Logo TDMU, ảnh banner & sự kiện
├── server/                          # Backend API Server
│   ├── server.js                    # Node.js / Express Server & AI Routes
│   └── database.json                # CSDL mẫu dạng JSON phục vụ API
├── .env                             # Biến môi trường & API Key
├── .gitignore                       # Cấu hình bỏ qua file nhạy cảm
├── package.json                     # Thông tin gói thư viện
└── README.md                        # Tài liệu hướng dẫn dự án
```

---

## 💻 6. CÔNG NGHỆ SỬ DỤNG
* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5, FontAwesome 6.
* **Backend:** Node.js, Express.js (RESTful APIs).
* **Database:** MySQL 8.0 / Microsoft SQL Server 2022, Laravel Migrations.
* **Trí tuệ Nhân tạo (AI):** OpenAI GPT API / Google Gemini API / Groq LLaMA 3.
* **Mạng xã hội:** Facebook Graph API v19.0+.
