<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class NhanSu extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = "NHAN_SU";
    protected $primaryKey = "MaNhanSu";
    protected $fillable = [
        "MaToCongDoan", "MaToChuc", "MaCanBo", "HoVaTen", "GioiTinh", "NgaySinh",
        "Email", "SoDienThoai", "MatKhau", "HocHamHocVi", "ChucVuCongDoan",
        "ChucVuChuyenMon", "VaiTroHeThong", "TrangThai"
    ];
    protected $hidden = ["MatKhau"];

    public function toCongDoan()
    {
        return $this->belongsTo(ToCongDoan::class, "MaToCongDoan", "MaToCongDoan");
    }

    public function toChuc()
    {
        return $this->belongsTo(ToChuc::class, "MaToChuc", "MaToChuc");
    }

    public function tinTucs()
    {
        return $this->hasMany(TinTuc::class, "MaTacGia", "MaNhanSu");
    }
}