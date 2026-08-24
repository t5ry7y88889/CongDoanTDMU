<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('TO_CONG_DOAN', function (Blueprint ) {
            ->id('MaToCongDoan');
            ->string('MaDinhDanh', 50)->unique();
            ->string('TenToCongDoan', 150);
            ->string('ToTruong', 100)->nullable();
            ->string('EmailLienHe', 100)->nullable();
            ->string('SoDienThoai', 20)->nullable();
            ->string('DiaChiVanPhong', 150)->nullable();
            ->boolean('TrangThai')->default(true);
            ->timestamp('NgayTao')->useCurrent();
        });
    }

    public function down(): void {
        Schema::dropIfExists('TO_CONG_DOAN');
    }
};
