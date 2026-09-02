<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create("BAO_CAO_THANG", function (Blueprint $table) {
            $table->id("MaBaoCao");
            $table->foreignId("MaToCongDoan")->constrained("TO_CONG_DOAN", "MaToCongDoan")->onDelete("cascade");
            $table->foreignId("MaNguoiBaoCao")->constrained("NHAN_SU", "MaNhanSu")->onDelete("cascade");
            $table->integer("ThangBaoCao");
            $table->integer("NamBaoCao")->default(2026);
            $table->integer("TongSoCBNV")->default(0);
            $table->integer("TongSoDoanVien")->default(0);
            $table->integer("TongSoNuDoanVien")->default(0);
            $table->integer("SoDoanVienKetNap")->default(0);
            $table->integer("SoDoanVienUuTuSangDang")->default(0);
            $table->integer("SoNguoiDuocChamLo")->default(0);
            $table->decimal("TongTienChamLo", 15, 2)->default(0);
            $table->text("NoiDungTuyenTruyen")->nullable();
            $table->text("HoatDongKhac")->nullable();
            $table->text("KeHoachThangToi")->nullable();
            $table->text("KienNghiNhaTruong")->nullable();
            $table->string("LinkMinhChung", 500)->nullable();
            $table->enum("TrangThai", ["Draft", "Submitted", "Approved"])->default("Submitted");
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("BAO_CAO_THANG");
    }
};