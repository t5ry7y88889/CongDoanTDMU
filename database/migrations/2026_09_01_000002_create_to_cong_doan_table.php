<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("TO_CONG_DOAN", function (Blueprint $table) {
            $table->id("MaToCongDoan");
            $table->string("MaDinhDanh", 50)->unique();
            $table->string("TenToCongDoan", 150);
            $table->string("ToTruong", 100)->nullable();
            $table->string("EmailLienHe", 100)->nullable();
            $table->string("SoDienThoai", 20)->nullable();
            $table->string("DiaChiVanPhong", 150)->nullable();
            $table->tinyInteger("TrangThai")->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("TO_CONG_DOAN");
    }
};