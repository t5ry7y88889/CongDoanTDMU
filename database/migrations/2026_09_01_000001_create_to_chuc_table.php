<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("TO_CHUC", function (Blueprint $table) {
            $table->id("MaToChuc");
            $table->string("TenToChuc", 150);
            $table->string("NhiemKy", 50);
            $table->text("MoTaChucNang")->nullable();
            $table->integer("ThuTuHienThi")->default(1);
            $table->tinyInteger("TrangThai")->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("TO_CHUC");
    }
};