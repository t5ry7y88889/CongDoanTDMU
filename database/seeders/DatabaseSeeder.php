<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ToChuc;
use App\Models\ToCongDoan;
use App\Models\NhanSu;
use App\Models\TinTuc;
use App\Models\VanBan;
use App\Models\BaoCaoThang;
use App\Models\LichXuatBan;
use App\Models\NhatKyHeThong;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. TO_CHUC (Cơ cấu tổ chức CĐ Trường TDMU - 5 Ban)
        $tc1 = ToChuc::create(["TenToChuc" => "Ban Thường vụ", "NhiemKy" => "Nhiệm kỳ 2023 - 2028", "MoTaChucNang" => "Lãnh đạo, điều hành toàn diện hoạt động Công đoàn giữa hai kỳ họp BCH", "ThuTuHienThi" => 1]);
        $tc2 = ToChuc::create(["TenToChuc" => "Ban Chấp hành", "NhiemKy" => "Nhiệm kỳ 2023 - 2028", "MoTaChucNang" => "Cơ quan lãnh đạo cao nhất của Công đoàn cơ sở TDMU", "ThuTuHienThi" => 2]);
        $tc3 = ToChuc::create(["TenToChuc" => "Ủy ban Kiểm tra", "NhiemKy" => "Nhiệm kỳ 2023 - 2028", "MoTaChucNang" => "Kiểm tra việc chấp hành Điều lệ Công đoàn và quản lý tài chính", "ThuTuHienThi" => 3]);
        $tc4 = ToChuc::create(["TenToChuc" => "Ban Nữ công", "NhiemKy" => "Nhiệm kỳ 2023 - 2028", "MoTaChucNang" => "Phụ trách phong trào nữ cán bộ giảng viên Giỏi việc trường - Đảm việc nhà", "ThuTuHienThi" => 4]);
        $tc5 = ToChuc::create(["TenToChuc" => "Ban Tuyên giáo - Thi đua", "NhiemKy" => "Nhiệm kỳ 2023 - 2028", "MoTaChucNang" => "Phụ trách công tác truyền thông, học tập chính trị và phong trào thi đua", "ThuTuHienThi" => 5]);

        // 2. TO_CONG_DOAN (16 Tổ Công đoàn)
        $tcdList = [
            ["TCD_01", "Công đoàn 1", "Đ/c Nguyễn Văn A", "tcd01@tdmu.edu.vn", "Phòng A1-101"],
            ["TCD_02", "Công đoàn 2", "Đ/c Trần Thị B", "tcd02@tdmu.edu.vn", "Phòng A1-102"],
            ["TCD_03", "Công đoàn 3", "Đ/c Lê Văn C", "tcd03@tdmu.edu.vn", "Phòng A1-103"],
            ["TCD_04", "Công đoàn 4", "Nguyễn Thị Hương", "tcd04@tdmu.edu.vn", "Phòng A1-104"],
            ["TCD_KCNVH", "Khoa Công nghiệp Văn hóa", "Đ/c Phạm Văn D", "tcd_cnvh@tdmu.edu.vn", "Phòng B2-201"],
            ["TCD_KNN", "Khoa Ngoại ngữ", "Đ/c Hoàng Thị E", "tcd_ngoaingu@tdmu.edu.vn", "Phòng B1-305"],
            ["TCD_KKTXD", "Khoa Kiến trúc - Xây dựng", "Đ/c Vũ Văn F", "tcd_ktxd@tdmu.edu.vn", "Phòng B2-302"],
            ["TCD_VKTCN", "Viện Kỹ thuật công nghệ", "Đ/c Đặng Văn G", "tcd_ktcn@tdmu.edu.vn", "Phòng B1-102"],
            ["TCD_VCNS", "Viện Công nghệ số", "Hồ Ngọc Trung Kiên", "tcd_cns@tdmu.edu.vn", "Phòng B1-204"],
            ["TCD_VCNXBV", "Viện Công nghệ xanh và bền vững", "Đ/c Bùi Thị H", "tcd_cnxbv@tdmu.edu.vn", "Phòng B1-208"],
            ["TCD_TLQL", "Trường Luật và Quản lý", "Huỳnh Thị Lệ Kha", "tcd_luat@tdmu.edu.vn", "Phòng B3-101"],
            ["TCD_SP1", "Sư phạm 1", "Đ/c Ngô Văn I", "tcd_sp1@tdmu.edu.vn", "Phòng C1-201"],
            ["TCD_SP2", "Sư phạm 2", "Đ/c Đỗ Thị K", "tcd_sp2@tdmu.edu.vn", "Phòng C1-202"],
            ["TCD_KTTC1", "Kinh tế tài chính 1", "Đ/c Trương Văn L", "tcd_kttc1@tdmu.edu.vn", "Phòng B2-101"],
            ["TCD_KTTC2", "Kinh tế tài chính 2", "Nguyễn Thụy Bảo Khuyên", "tcd_kttc2@tdmu.edu.vn", "Phòng B2-102"],
            ["TCD_KTTC3", "Kinh tế tài chính 3", "Đ/c Phan Văn M", "tcd_kttc3@tdmu.edu.vn", "Phòng B2-103"],
        ];
        $tcds = [];
        foreach ($tcdList as $item) {
            $tcds[] = ToCongDoan::create([
                "MaDinhDanh" => $item[0], "TenToCongDoan" => $item[1],
                "ToTruong" => $item[2], "EmailLienHe" => $item[3], "DiaChiVanPhong" => $item[4]
            ]);
        }

        // 3. NHAN_SU (Cán bộ 3 Role: ADMIN, EDITOR, CONTRIBUTOR)
        $ns1 = NhanSu::create(["MaToCongDoan" => $tcds[8]->MaToCongDoan, "MaToChuc" => $tc1->MaToChuc, "MaCanBo" => "CB001", "HoVaTen" => "TS. Lê Thị Kim Út", "GioiTinh" => "Nữ", "Email" => "utltk@tdmu.edu.vn", "HocHamHocVi" => "Tiến sĩ", "ChucVuCongDoan" => "Chủ tịch Công đoàn", "ChucVuChuyenMon" => "Giảng viên cao cấp", "VaiTroHeThong" => "Admin"]);
        $ns2 = NhanSu::create(["MaToCongDoan" => $tcds[8]->MaToCongDoan, "MaToChuc" => $tc1->MaToChuc, "MaCanBo" => "CB002", "HoVaTen" => "ThS. Võ Quốc Lương", "GioiTinh" => "Nam", "Email" => "luongvq@tdmu.edu.vn", "HocHamHocVi" => "Thạc sĩ", "ChucVuCongDoan" => "Ủy viên Ban Thường vụ", "ChucVuChuyenMon" => "Giảng viên chính Viện CNS", "VaiTroHeThong" => "Editor"]);
        $ns3 = NhanSu::create(["MaToCongDoan" => $tcds[10]->MaToCongDoan, "MaToChuc" => $tc3->MaToChuc, "MaCanBo" => "CB003", "HoVaTen" => "Huỳnh Thị Lệ Kha", "GioiTinh" => "Nữ", "Email" => "khahl@tdmu.edu.vn", "HocHamHocVi" => "Thạc sĩ", "ChucVuCongDoan" => "Tổ trưởng CĐ Trường Luật", "ChucVuChuyenMon" => "Giảng viên", "VaiTroHeThong" => "Editor"]);
        $ns4 = NhanSu::create(["MaToCongDoan" => $tcds[8]->MaToCongDoan, "MaToChuc" => $tc5->MaToChuc, "MaCanBo" => "CB004", "HoVaTen" => "Hồ Ngọc Trung Kiên", "GioiTinh" => "Nam", "Email" => "kienhnt@tdmu.edu.vn", "HocHamHocVi" => "Thạc sĩ", "ChucVuCongDoan" => "Tổ trưởng CĐ Viện CNS", "ChucVuChuyenMon" => "Giảng viên", "VaiTroHeThong" => "Editor"]);
        $ns5 = NhanSu::create(["MaToCongDoan" => $tcds[14]->MaToCongDoan, "MaToChuc" => null, "MaCanBo" => "CB005", "HoVaTen" => "Nguyễn Thụy Bảo Khuyên", "GioiTinh" => "Nữ", "Email" => "khuyenntb@tdmu.edu.vn", "HocHamHocVi" => "Thạc sĩ", "ChucVuCongDoan" => "Tổ trưởng CĐ KTTC 2", "ChucVuChuyenMon" => "Giảng viên", "VaiTroHeThong" => "Editor"]);
        $ns6 = NhanSu::create(["MaToCongDoan" => $tcds[3]->MaToCongDoan, "MaToChuc" => null, "MaCanBo" => "CB006", "HoVaTen" => "Nguyễn Thị Hương", "GioiTinh" => "Nữ", "Email" => "huongnt@tdmu.edu.vn", "HocHamHocVi" => "Cử nhân", "ChucVuCongDoan" => "Tổ trưởng Công đoàn 4", "ChucVuChuyenMon" => "Chuyên viên", "VaiTroHeThong" => "Editor"]);
        $ns7 = NhanSu::create(["MaToCongDoan" => $tcds[8]->MaToCongDoan, "MaToChuc" => null, "MaCanBo" => "CB007", "HoVaTen" => "Nguyễn Bình Dương", "GioiTinh" => "Nam", "Email" => "2424802010319@student.tdmu.edu.vn", "HocHamHocVi" => "Cử nhân", "ChucVuCongDoan" => "Đoàn viên", "ChucVuChuyenMon" => "CTV Truyền thông", "VaiTroHeThong" => "Contributor"]);

        // 4. TIN_TUC (Bảng trung tâm - Lưu đa kênh + JSON danh sách ảnh + AI Prompt)
        $tin1 = TinTuc::create([
            "MaTacGia" => $ns7->MaNhanSu,
            "MaNguoiBienTap" => $ns2->MaNhanSu,
            "TieuDe" => "Công đoàn TDMU hưởng ứng phong trào Lao động giỏi - Lao động sáng tạo 2026",
            "Slug" => "cong-doan-tdmu-huong-ung-phong-trao-lao-dong-sang-tao-2026",
            "ChuyenMuc" => "Phong trào thi đua",
            "TomTat" => "Đổi mới sáng tạo trong giảng dạy và NCKH của cán bộ giảng viên.",
            "NoiDungWeb" => "<h2>Nội dung chi tiết</h2><p>Công đoàn TDMU đã trao 50 suất quà hỗ trợ đoàn viên có hoàn cảnh khó khăn...</p>",
            "NoiDungFb" => "🔥 [THÁNG CÔNG NHÂN 2026] Công đoàn TDMU phát động chuỗi hoạt động chăm lo đời sống cán bộ giảng viên...",
            "NoiDungZalo" => "Công đoàn TDMU thông báo triển khai Tháng Công nhân 2026. Chi tiết xem tại website.",
            "VideoScript" => "[0-10s] Cảnh lễ phát động. [10-30s] Phỏng vấn đoàn viên nhận hỗ trợ.",
            "AnhDaiDien" => "/storage/news/2026/08/lao-dong-sang-tao.jpg",
            "DanhSachAnh" => ["/storage/news/2026/08/img01.jpg", "/storage/news/2026/08/img02.jpg"],
            "VideoUrl" => "/storage/news/2026/08/clip_phong_su.mp4",
            "AiPrompt" => "Tạo bài đăng Tháng Công nhân TDMU 2026",
            "AiModel" => "gemini-2.5-flash",
            "TrangThai" => "PUBLISHED",
            "LuotXem" => 1250,
            "ThoiGianXuatBan" => now()
        ]);

        // 5. VAN_BAN (Kho tài liệu làm grounding cho AI)
        VanBan::create([
            "MaNguoiDang" => $ns1->MaNhanSu, "SoHieuVanBan" => "15/NQ-CĐ",
            "TenVanBan" => "Nghị quyết Hội nghị Công đoàn cơ sở Trường Đại học Thủ Dầu Một lần thứ X",
            "LoaiVanBan" => "Nghị quyết", "CoQuanBanHanh" => "Công đoàn TDMU", "NgayBanHanh" => "2025-12-25",
            "NguoiKy" => "TS. Lê Thị Kim Út", "TepDinhKem" => "/storage/vanban/15-NQ-CD-2025.pdf"
        ]);
        VanBan::create([
            "MaNguoiDang" => $ns2->MaNhanSu, "SoHieuVanBan" => "08/HD-CĐ",
            "TenVanBan" => "Hướng dẫn đánh giá, phân loại Tổ Công đoàn và Đoàn viên xuất sắc năm học 2026",
            "LoaiVanBan" => "Hướng dẫn", "CoQuanBanHanh" => "Công đoàn TDMU", "NgayBanHanh" => "2026-06-15",
            "NguoiKy" => "TS. Lê Thị Kim Út", "TepDinhKem" => "/storage/vanban/08-HD-CD-2026.pdf"
        ]);

        // 6. BAO_CAO_THANG (Số liệu thật 4 Tổ CĐ)
        BaoCaoThang::create([
            "MaToCongDoan" => $tcds[8]->MaToCongDoan, "MaNguoiBaoCao" => $ns4->MaNhanSu,
            "ThangBaoCao" => 8, "NamBaoCao" => 2026, "TongSoCBNV" => 66, "TongSoDoanVien" => 66, "TongSoNuDoanVien" => 17,
            "SoDoanVienKetNap" => 0, "SoDoanVienUuTuSangDang" => 0, "SoNguoiDuocChamLo" => 3, "TongTienChamLo" => 1500000,
            "NoiDungTuyenTruyen" => "Tuyên truyền kỷ niệm 97 năm ngày thành lập Công đoàn Việt Nam",
            "KeHoachThangToi" => "1. Tổ chức Tết Trung thu; 2. Khám sức khỏe định kỳ", "TrangThai" => "Approved"
        ]);
        BaoCaoThang::create([
            "MaToCongDoan" => $tcds[10]->MaToCongDoan, "MaNguoiBaoCao" => $ns3->MaNhanSu,
            "ThangBaoCao" => 8, "NamBaoCao" => 2026, "TongSoCBNV" => 51, "TongSoDoanVien" => 51, "TongSoNuDoanVien" => 17,
            "SoDoanVienKetNap" => 0, "SoDoanVienUuTuSangDang" => 1, "SoNguoiDuocChamLo" => 3, "TongTienChamLo" => 3800000,
            "NoiDungTuyenTruyen" => "Tuyên truyền Nghị quyết Đại hội Công đoàn TP.HCM lần thứ I",
            "KeHoachThangToi" => "1. Tổ chức Tết Trung thu; 2. Tổ chức sinh nhật Quý 3", "TrangThai" => "Approved"
        ]);
        BaoCaoThang::create([
            "MaToCongDoan" => $tcds[14]->MaToCongDoan, "MaNguoiBaoCao" => $ns5->MaNhanSu,
            "ThangBaoCao" => 8, "NamBaoCao" => 2026, "TongSoCBNV" => 42, "TongSoDoanVien" => 42, "TongSoNuDoanVien" => 31,
            "SoDoanVienKetNap" => 0, "SoDoanVienUuTuSangDang" => 0, "SoNguoiDuocChamLo" => 0, "TongTienChamLo" => 0,
            "NoiDungTuyenTruyen" => "Vận động CĐV tham gia Hiến máu nhân đạo",
            "KeHoachThangToi" => "1. Tham gia hoạt động do CĐCS phát động; 2. Thực hiện chế độ chăm lo", "TrangThai" => "Approved"
        ]);
        BaoCaoThang::create([
            "MaToCongDoan" => $tcds[3]->MaToCongDoan, "MaNguoiBaoCao" => $ns6->MaNhanSu,
            "ThangBaoCao" => 8, "NamBaoCao" => 2026, "TongSoCBNV" => 23, "TongSoDoanVien" => 23, "TongSoNuDoanVien" => 11,
            "SoDoanVienKetNap" => 0, "SoDoanVienUuTuSangDang" => 0, "SoNguoiDuocChamLo" => 15, "TongTienChamLo" => 1900000,
            "NoiDungTuyenTruyen" => "Kỷ niệm 81 năm Ngày Cách mạng tháng Tám và Quốc khánh 2/9",
            "KeHoachThangToi" => "Tiếp tục phối hợp thực hiện các phong trào hoạt động",
            "LinkMinhChung" => "https://drive.google.com/open?id=14uZ3gcXFNrGescFh5neJd-w7KRVS-BX0", "TrangThai" => "Approved"
        ]);

        // 7. LICH_XUAT_BAN
        LichXuatBan::create(["MaTinTuc" => $tin1->MaTinTuc, "KenhXuatBan" => "Website", "ThoiGianDang" => now(), "TrangThai" => "Done"]);

        // 8. NHAT_KY_HE_THONG (Log trace duy nhất, không chứa trạng thái bài)
        NhatKyHeThong::create([
            "MaNhanSu" => $ns7->MaNhanSu,
            "HanhDong" => "TAO_TIN_TUC",
            "DoiTuongTacDong" => "TIN_TUC",
            "IdDoiTuong" => $tin1->MaTinTuc,
            "NoiDungThayDoi" => "Cộng tác viên Nguyễn Bình Dương đã tạo tin nháp bằng AI Studio",
            "DiaChiIP" => "127.0.0.1"
        ]);
        NhatKyHeThong::create([
            "MaNhanSu" => $ns2->MaNhanSu,
            "HanhDong" => "DUYET_TIN_TUC",
            "DoiTuongTacDong" => "TIN_TUC",
            "IdDoiTuong" => $tin1->MaTinTuc,
            "NoiDungThayDoi" => "Cô Võ Quốc Lương đã phê duyệt và xuất bản bài viết #1",
            "DiaChiIP" => "127.0.0.1"
        ]);
    }
}