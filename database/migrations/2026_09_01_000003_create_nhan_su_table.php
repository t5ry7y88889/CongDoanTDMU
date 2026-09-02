<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("NHAN_SU", function (Blueprint $table) {
            $table->id("MaNhanSu");
            $table->foreignId("MaToCongDoan")->constrained("TO_CONG_DOAN", "MaToCongDoan")->onDelete("cascade");
            $table->foreignId("MaToChuc")->nullable()->constrained("TO_CHUC", "MaToChuc")->onDelete("set null");
            $table->string("MaCanBo", 50)->unique();
            $table->string("HoVaTen", 100);
            $table->enum("GioiTinh", ["Nam", "Nữ", "Khác"])->default("Nam");
            $table->date("NgaySinh")->nullable();
            $table->string("Email", 100)->unique();
            $table->string("SoDienThoai", 20)->nullable();
            $table->string("MatKhau", 255)->nullable();
            $table->string("HocHamHocVi", 50)->nullable();
            $table->string("ChucVuCongDoan", 100)->default("Đoàn viên");
            $table->string("ChucVuChuyenMon", 100)->nullable();
            $table->enum("VaiTroHeThong", ["Admin", "Editor", "Contributor", "User"])->default("Contributor");
            $table->tinyInteger("TrangThai")->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("NHAN_SU");
    }
};