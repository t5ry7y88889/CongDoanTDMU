<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('TO_CHUC', function (Blueprint ) {
            ->id('MaToChuc');
            ->string('TenToChuc', 150);
            ->string('NhiemKy', 50);
            ->text('MoTaChucNang')->nullable();
            ->integer('ThuTuHienThi')->default(1);
            ->boolean('TrangThai')->default(true);
            ->timestamp('NgayTao')->useCurrent();
        });
    }

    public function down(): void {
        Schema::dropIfExists('TO_CHUC');
    }
};
