<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("TIN_TUC", function (Blueprint $table) {
            $table->id("MaTinTuc");
            $table->foreignId("MaTacGia")->constrained("NHAN_SU", "MaNhanSu")->onDelete("cascade");
            $table->foreignId("MaNguoiBienTap")->nullable()->constrained("NHAN_SU", "MaNhanSu")->onDelete("set null");
            $table->string("TieuDe", 255);
            $table->string("Slug", 255)->unique();
            $table->string("ChuyenMuc", 100)->default("Tin tức");
            $table->text("TomTat")->nullable();
            $table->longText("NoiDungWeb")->nullable();
            $table->text("NoiDungFb")->nullable();
            $table->text("NoiDungZalo")->nullable();
            $table->text("VideoScript")->nullable();
            $table->string("AnhDaiDien", 500)->nullable();
            $table->json("DanhSachAnh")->nullable();
            $table->string("VideoUrl", 500)->nullable();
            $table->text("AiPrompt")->nullable();
            $table->string("AiModel", 100)->default("gemini-2.5-flash");
            $table->json("AiGeneratedData")->nullable();
            $table->enum("TrangThai", ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SCHEDULED", "PUBLISHED", "HIDDEN"])->default("DRAFT");
            $table->integer("LuotXem")->default(0);
            $table->dateTime("ThoiGianXuatBan")->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("TIN_TUC");
    }
};