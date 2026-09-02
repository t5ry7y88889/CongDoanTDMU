<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("LICH_XUAT_BAN", function (Blueprint $table) {
            $table->id("MaLichDang");
            $table->foreignId("MaTinTuc")->constrained("TIN_TUC", "MaTinTuc")->onDelete("cascade");
            $table->enum("KenhXuatBan", ["Website", "Facebook", "Zalo"])->default("Website");
            $table->dateTime("ThoiGianDang");
            $table->enum("TrangThai", ["Pending", "Done", "Failed"])->default("Pending");
            $table->text("GhiChuLoi")->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("LICH_XUAT_BAN");
    }
};