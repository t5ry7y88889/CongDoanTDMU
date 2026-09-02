<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $table = "articles";
    protected $fillable = [
        "user_id", "tieu_de", "slug", "category_id", "tom_tat",
        "noi_dung_web", "noi_dung_fb", "noi_dung_zalo", "video_script",
        "hinh_anh_url", "trang_thai", "scheduled_at", "published_at",
        "fb_post_id", "fb_published_at", "is_ai_generated", "ai_prompt", "luot_xem"
    ];
    protected $casts = [
        "scheduled_at" => "datetime",
        "published_at" => "datetime",
        "fb_published_at" => "datetime",
        "is_ai_generated" => "boolean"
    ];

    public function author() { return $this->belongsTo(User::class, "user_id"); }
    public function category() { return $this->belongsTo(Category::class, "category_id"); }
    public function audits() { return $this->hasMany(ArticleAudit::class, "article_id"); }
    public function schedules() { return $this->hasMany(Schedule::class, "article_id"); }
}