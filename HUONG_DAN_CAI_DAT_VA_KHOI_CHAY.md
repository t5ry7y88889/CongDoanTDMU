# HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY HỆ THỐNG
## Website Truyền Thông Công Đoàn Trường Đại Học Thủ Dầu Một Tích Hợp AI Đa Kênh

---

### 1. Yêu cầu môi trường
- **Node.js**: Phiên bản `>= 18.x` (khuyến nghị Node 20.x hoặc 24.x)
- **NPM**: Phiên bản `>= 9.x`
- **Hệ điều hành**: Windows 10/11, macOS hoặc Linux
- **Cơ sở dữ liệu (tùy chọn)**: Microsoft SQL Server (nếu không cài MSSQL, hệ thống tự động chuyển sang chế độ dự phòng JSON Live Database cực kỳ linh hoạt và an toàn).

---

### 2. Các bước cài đặt nhanh

#### Bước 1: Cài đặt thư viện phụ thuộc
Mở Command Prompt / PowerShell tại thư mục dự án và chạy:
```bash
npm install
```

*(Tùy chọn nếu muốn phát triển thêm frontend React)*:
```bash
cd frontend
npm install
cd ..
```

#### Bước 2: Cấu hình biến môi trường
Kiểm tra tệp `.env` (nếu chưa có, sao chép từ `.env.example`):
```bash
cp .env.example .env
```
Điền các thông số kết nối CSDL và các khóa API tương ứng.

#### Bước 3: Khởi tạo Cơ sở dữ liệu MSSQL (Nếu sử dụng MSSQL)
Nếu bạn cài đặt Microsoft SQL Server cục bộ:
1. Mở SQL Server Management Studio (SSMS).
2. Chạy tệp kịch bản `database/schema_15_tables_mssql.sql` để tạo cấu trúc 15 bảng chuẩn 3NF.
3. Chạy tệp kịch bản `database/seed_15_tables_mssql.sql` để nạp dữ liệu mẫu ban đầu.

---

### 3. Khởi chạy hệ thống

#### Cách 1: Sử dụng tệp thực thi tự động (Khuyên dùng trên Windows)
Nhấp đúp chuột vào tệp:
```
Khoi_Dong_He_Thong.bat
```
hoặc chạy:
```
Chay_Website_CongDoan_TDMU.bat
```

#### Cách 2: Khởi chạy thủ công qua lệnh
```bash
npm start
# hoặc: node server/server.js
```

---

### 4. Truy cập hệ thống trên trình duyệt

- **Cổng thông tin Công đoàn TDMU:** [http://localhost:3001](http://localhost:3001)
- **Phòng biên tập Studio AI & Quản trị:** [http://localhost:3001/admin.html](http://localhost:3001/admin.html)
- **Tin tức & Sự kiện:** [http://localhost:3001/tin-tuc.html](http://localhost:3001/tin-tuc.html)
- **Cơ cấu tổ chức:** [http://localhost:3001/co-cau-to-chuc.html](http://localhost:3001/co-cau-to-chuc.html)
- **Hòm thư & Ý kiến đoàn viên:** [http://localhost:3001/lien-he.html](http://localhost:3001/lien-he.html)
- **Chăm lo phúc lợi:** [http://localhost:3001/phuc-loi-doan-vien.html](http://localhost:3001/phuc-loi-doan-vien.html)

---

### 5. Cấu trúc thư mục mã nguồn
```
tdmu-congdoan-web/
├── database/                # Kịch bản tạo bảng & seed CSDL MSSQL
├── server/                  # Mã nguồn Backend Node.js Express
│   ├── config/              # Cấu hình môi trường & kết nối CSDL
│   ├── controllers/         # Bộ điều khiển xử lý nghiệp vụ
│   ├── routes/              # Định tuyến API RESTful
│   ├── services/            # Tác nhân AI, Đa kênh, Xuất file Word/PDF
│   ├── mssql_db.js          # Tầng truy xuất CSDL MSSQL
│   └── server.js            # Điểm khởi chạy chính của Backend
├── public/                  # Giao diện Cổng thông tin (HTML/CSS/JS)
│   ├── css/                 # CSS phong cách TDMU
│   ├── js/                  # JS logic & Admin modules
│   ├── images/              # Logo, icon, baner nhận diện
│   └── uploads/             # Tệp hình ảnh sự kiện thực tế
├── frontend/                # Mã nguồn mở rộng React Vite (nếu dùng)
├── Khoi_Dong_He_Thong.bat   # Script khởi chạy 1-click
├── package.json             # Danh mục thư viện phụ thuộc
├── .env.example             # Mẫu cấu hình môi trường
└── README.md                # Tài liệu tổng quan dự án
```
