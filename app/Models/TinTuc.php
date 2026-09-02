<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TinTuc extends Model
{
    protected $table = "TIN_TUC";
    protected $primaryKey = "MaTinTuc";
    protected $fillable = [
        "MaTacGia", "MaNguoiBienTap", "TieuDe", "Slug", "ChuyenMuc", "TomTat",
        "NoiDungWeb", "NoiDungFb", "NoiDungZalo", "VideoScript",
        "AnhDaiDien", "DanhSachAnh", "VideoUrl", "AiPrompt", "AiModel",
        "AiGeneratedData", "TrangThai", "LuotXem", "ThoiGianXuatBan"
    ];

    protected $casts = [
        "DanhSachAnh" => "array",
        "AiGeneratedData" => "array",
        "ThoiGianXuatBan" => "datetime",
    ];

    public function tacGia() { return $this->belongsTo(NhanSu::class, "MaTacGia", "MaNhanSu"); }
    public function nguoiBienTap() { return $this->belongsTo(NhanSu::class, "MaNguoiBienTap", "MaNhanSu"); }
}