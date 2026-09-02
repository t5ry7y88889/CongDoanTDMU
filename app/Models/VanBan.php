<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VanBan extends Model
{
    protected $table = "VAN_BAN";
    protected $primaryKey = "MaVanBan";
    protected $fillable = [
        "MaNguoiDang", "SoHieuVanBan", "TenVanBan", "LoaiVanBan",
        "CoQuanBanHanh", "NgayBanHanh", "NguoiKy", "TepDinhKem", "GhiChu"
    ];

    public function nguoiDang()
    {
        return $this->belongsTo(NhanSu::class, "MaNguoiDang", "MaNhanSu");
    }
}