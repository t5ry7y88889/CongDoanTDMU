<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("NHAT_KY_HE_THONG", function (Blueprint $table) {
            $table->id("MaNhatKy");
            $table->foreignId("MaNhanSu")->constrained("NHAN_SU", "MaNhanSu")->onDelete("cascade");
            $table->string("HanhDong", 100);
            $table->string("DoiTuongTacDong", 100)->nullable();
            $table->unsignedBigInteger("IdDoiTuong")->nullable();
            $table->text("NoiDungThayDoi")->nullable();
            $table->string("DiaChiIP", 50)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("NHAT_KY_HE_THONG");
    }
};