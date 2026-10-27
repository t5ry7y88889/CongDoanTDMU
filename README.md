# Website Truyền Thông & Quản Trị Công Đoàn TDMU

Cổng thông tin điện tử và hệ thống quản trị truyền thông của **Công đoàn Cơ sở Trường Đại học Thủ Dầu Một** (`congdoan.tdmu.edu.vn`), hỗ trợ đăng tải tin tức, tra cứu cơ cấu tổ chức, văn bản, biểu mẫu, tiếp nhận ý kiến đoàn viên và quản lý nghiệp vụ công đoàn.

---

## 👥 Nhóm Thực Hiện (Nhóm 2)
* **Giảng viên hướng dẫn:** ThS. Võ Quốc Lương
* **Sinh viên thực hiện:**
  1. **Nguyễn Bình Dương** (Nhóm trưởng) – MSSV: `2424802010319`
  2. **Trần Hồng Thanh** – MSSV: `2424802010439`
  3. **Phạm Anh Tuấn** – MSSV: `2324802010393`

---

## 💻 Công Nghệ Sử Dụng
* **Backend:** Node.js, Express.js (RESTful API).
* **Frontend:** HTML5, CSS3, JavaScript (ES6+), Bootstrap 5.
* **Cơ sở dữ liệu:** Microsoft SQL Server 2022 (tự động chuyển sang JSON Database dự phòng nếu chưa kết nối SQL Server).

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Cài đặt thư viện
Mở terminal tại thư mục dự án và chạy:
```bash
npm install
```

### Bước 2: Cấu hình môi trường (Tùy chọn)
Hệ thống đã có sẵn file `.env.example`. Nếu sử dụng Microsoft SQL Server, cấu hình file `.env`:
```env
PORT=3001
DB_HOST=127.0.0.1
DB_PORT=56205
DB_DATABASE=TDMU_TradeUnion_DB
DB_USER=node_app
DB_PASSWORD=TDMUNode@2026
```
*(Nếu chưa cài đặt SQL Server, hệ thống sẽ tự động vận hành ở chế độ CSDL JSON dự phòng).*

### Bước 3: Khởi chạy website
```bash
npm start
```
Truy cập website tại: **[http://localhost:3001](http://localhost:3001)**

---

## 🔑 Tài Khoản Thử Nghiệm (Demo)
* **Trang quản trị:** `http://localhost:3001/admin.html`
* **Email:** `admin@tdmu.edu.vn`
* **Mật khẩu:** `123456`

---

## 📂 Cấu Trúc Mã Nguồn Chính
```
├── public/                 # Giao diện người dùng & trang quản trị
│   ├── index.html          # Trang chủ
│   ├── tin-tuc.html        # Trang tin tức, sự kiện (có phân trang)
│   ├── co-cau-to-chuc.html # Cơ cấu tổ chức & 16 tổ công đoàn
│   ├── van-ban.html        # Kho văn bản, nghị quyết
│   ├── bieu-mau.html       # Kho biểu mẫu công đoàn
│   ├── lien-he.html        # Hòm thư góp ý & tra cứu phản hồi
│   ├── admin.html          # Bảng điều khiển quản trị (Admin Studio)
│   ├── css/                # CSS giao diện
│   └── js/                 # JavaScript xử lý tương tác & gọi API
├── server/                 # Backend Node.js
│   ├── server.js           # Điểm khởi chạy server chính (Port 3001)
│   ├── mssql_db.js         # Kết nối CSDL SQL Server
│   ├── db.js               # Quản lý CSDL JSON dự phòng
│   └── routes/             # Các API điều hướng (bài viết, tổ chức, góp ý...)
├── package.json            # Cấu hình dự án & thư viện npm
└── README.md               # Hướng dẫn dự án
```
