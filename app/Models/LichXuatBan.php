<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichXuatBan extends Model
{
    protected $table = "LICH_XUAT_BAN";
    protected $primaryKey = "MaLichDang";
    protected $fillable = ["MaTinTuc", "KenhXuatBan", "ThoiGianDang", "TrangThai", "GhiChuLoi"];

    public function tinTuc() { return $this->belongsTo(TinTuc::class, "MaTinTuc", "MaTinTuc"); }
}