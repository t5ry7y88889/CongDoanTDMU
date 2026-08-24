<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('VAN_BAN', function (Blueprint ) {
            ->id('MaVanBan');
            ->foreignId('MaNguoiDang')->constrained('NHAN_SU', 'MaNhanSu')->onDelete('restrict')->onUpdate('cascade');
            ->string('SoHieuVanBan', 100);
            ->string('TenVanBan', 255);
            ->string('LoaiVanBan', 100);
            ->string('CoQuanBanHanh', 150);
            ->date('NgayBanHanh');
            ->string('NguoiKy', 100)->nullable();
            ->string('TepDinhKem', 255);
            ->text('GhiChu')->nullable();
            ->timestamp('NgayDang')->useCurrent();
        });
    }

    public function down(): void {
        Schema::dropIfExists('VAN_BAN');
    }
};
