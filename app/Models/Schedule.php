<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    protected $table = "schedules";
    protected $fillable = ["article_id", "kenh", "scheduled_at", "trang_thai", "error_message"];
    protected $casts = ["scheduled_at" => "datetime"];

    public function article() { return $this->belongsTo(Article::class, "article_id"); }
}