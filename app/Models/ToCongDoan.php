<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToCongDoan extends Model
{
    protected $table = "TO_CONG_DOAN";
    protected $primaryKey = "MaToCongDoan";
    protected $fillable = ["MaDinhDanh", "TenToCongDoan", "ToTruong", "EmailLienHe", "SoDienThoai", "DiaChiVanPhong", "TrangThai"];

    public function nhanSus()
    {
        return $this->hasMany(NhanSu::class, "MaToCongDoan", "MaToCongDoan");
    }
}