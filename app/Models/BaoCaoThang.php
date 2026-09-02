<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BaoCaoThang extends Model
{
    protected $table = "BAO_CAO_THANG";
    protected $primaryKey = "MaBaoCao";
    protected $fillable = [
        "MaToCongDoan", "MaNguoiBaoCao", "ThangBaoCao", "NamBaoCao",
        "TongSoCBNV", "TongSoDoanVien", "TongSoNuDoanVien", "SoDoanVienKetNap",
        "SoDoanVienUuTuSangDang", "SoNguoiDuocChamLo", "TongTienChamLo",
        "NoiDungTuyenTruyen", "HoatDongKhac", "KeHoachThangToi", "KienNghiNhaTruong",
        "LinkMinhChung", "TrangThai"
    ];

    public function toCongDoan() { return $this->belongsTo(ToCongDoan::class, "MaToCongDoan", "MaToCongDoan"); }
    public function nguoiBaoCao() { return $this->belongsTo(NhanSu::class, "MaNguoiBaoCao", "MaNhanSu"); }
}