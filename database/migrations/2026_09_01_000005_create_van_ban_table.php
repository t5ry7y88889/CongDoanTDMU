<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("VAN_BAN", function (Blueprint $table) {
            $table->id("MaVanBan");
            $table->foreignId("MaNguoiDang")->constrained("NHAN_SU", "MaNhanSu")->onDelete("cascade");
            $table->string("SoHieuVanBan", 100);
            $table->string("TenVanBan", 255);
            $table->string("LoaiVanBan", 100);
            $table->string("CoQuanBanHanh", 150);
            $table->date("NgayBanHanh");
            $table->string("NguoiKy", 100)->nullable();
            $table->string("TepDinhKem", 255);
            $table->text("GhiChu")->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("VAN_BAN");
    }
};