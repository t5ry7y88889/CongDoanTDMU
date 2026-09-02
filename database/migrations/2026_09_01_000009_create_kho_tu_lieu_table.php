<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("KHO_TU_LIEU", function (Blueprint $table) {
            $table->id("MaTuLieu");
            $table->foreignId("MaNguoiNop")->constrained("NHAN_SU", "MaNhanSu")->onDelete("cascade");
            $table->string("TenFile", 255);
            $table->string("DuongDan", 500);
            $table->string("LoaiFile", 50)->default("image/jpeg");
            $table->string("DungLuong", 50)->default("2.0 MB");
            $table->string("ChuDeTag", 150)->nullable();
            $table->integer("AiTriageScore")->default(85);
            $table->enum("TrangThai", ["Active", "Archived"])->default("Active");
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("KHO_TU_LIEU");
    }
};
