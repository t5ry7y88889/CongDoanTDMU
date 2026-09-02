<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NhatKyHeThong extends Model
{
    protected $table = "NHAT_KY_HE_THONG";
    protected $primaryKey = "MaNhatKy";
    protected $fillable = ["MaNhanSu", "HanhDong", "DoiTuongTacDong", "IdDoiTuong", "NoiDungThayDoi", "DiaChiIP"];

    public function nhanSu() { return $this->belongsTo(NhanSu::class, "MaNhanSu", "MaNhanSu"); }
}