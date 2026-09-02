<?php

namespace AppModels;

use IlluminateDatabaseEloquentFactoriesHasFactory;
use IlluminateDatabaseEloquentModel;
use IlluminateDatabaseEloquentRelationsBelongsTo;

class KhoTuLieu extends Model
{
    use HasFactory;

    protected $table = 'KHO_TU_LIEU';
    protected $primaryKey = 'MaTuLieu';

    protected $fillable = [
        'MaNguoiNop',
        'TenFile',
        'DuongDan',
        'LoaiFile',
        'DungLuong',
        'ChuDeTag',
        'AiTriageScore',
        'TrangThai'
    ];

    public function nguoiNop(): BelongsTo
    {
        return $this->belongsTo(NhanSu::class, 'MaNguoiNop', 'MaNhanSu');
    }
}
