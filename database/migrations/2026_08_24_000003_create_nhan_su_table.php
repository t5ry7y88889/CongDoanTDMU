<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('NHAN_SU', function (Blueprint ) {
            ->id('MaNhanSu');
            ->foreignId('MaToCongDoan')->constrained('TO_CONG_DOAN', 'MaToCongDoan')->onDelete('restrict')->onUpdate('cascade');
            ->foreignId('MaToChuc')->nullable()->constrained('TO_CHUC', 'MaToChuc')->onDelete('set null')->onUpdate('cascade');
            ->string('MaCanBo', 50)->unique();
            ->string('HoVaTen', 100);
            ->enum('GioiTinh', ['Nam', 'Nữ', 'Khác'])->default('Nam');
            ->date('NgaySinh')->nullable();
            ->string('Email', 100)->unique();
            ->string('SoDienThoai', 20)->nullable();
            ->string('MatKhau', 255)->nullable();
            ->string('HocHamHocVi', 50)->nullable();
            ->string('ChucVuCongDoan', 100)->default('Đoàn viên');
            ->string('ChucVuChuyenMon', 100)->nullable();
            ->enum('VaiTroHeThong', ['Admin', 'Editor', 'Contributor', 'User'])->default('Contributor');
            ->boolean('TrangThai')->default(true);
            ->timestamp('NgayTao')->useCurrent();
        });
    }

    public function down(): void {
        Schema::dropIfExists('NHAN_SU');
    }
};
