<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ToChuc extends Model
{
    protected $table = "TO_CHUC";
    protected $primaryKey = "MaToChuc";
    protected $fillable = ["TenToChuc", "NhiemKy", "MoTaChucNang", "ThuTuHienThi", "TrangThai"];

    public function nhanSus()
    {
        return $this->hasMany(NhanSu::class, "MaToChuc", "MaToChuc");
    }
}