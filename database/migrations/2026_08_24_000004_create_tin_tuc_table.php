<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('TIN_TUC', function (Blueprint ) {
            ->id('MaTinTuc');
            ->foreignId('MaTacGia')->constrained('NHAN_SU', 'MaNhanSu')->onDelete('restrict')->onUpdate('cascade');
            ->string('TieuDe', 255);
            ->string('Slug', 255)->unique();
            ->string('ChuyenMuc', 100);
            ->text('TomTat')->nullable();
            ->longText('NoiDung');
            ->string('HinhAnhDaiDien', 255)->nullable();
            ->enum('TrangThai', ['Draft', 'Pending', 'Approved', 'Published', 'Archived'])->default('Draft');
            ->integer('LuotXem')->default(0);
            ->dateTime('NgayXuatBan')->nullable();
            ->timestamp('NgayTao')->useCurrent();
            ->timestamp('NgayCapNhat')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void {
        Schema::dropIfExists('TIN_TUC');
    }
};
