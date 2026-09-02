<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArticleAudit extends Model
{
    protected $table = "article_audits";
    protected $fillable = ["article_id", "user_id", "hanh_dong", "ghi_chu"];

    public function article() { return $this->belongsTo(Article::class, "article_id"); }
    public function user() { return $this->belongsTo(User::class, "user_id"); }
}