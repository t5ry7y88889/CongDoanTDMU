<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable;

    protected $table = "users";
    protected $fillable = ["ho_ten", "email", "password", "vai_tro", "to_cong_doan", "avatar_url", "last_login_at"];
    protected $hidden = ["password"];
    protected $casts = ["last_login_at" => "datetime"];

    public function articles() { return $this->hasMany(Article::class, "user_id"); }
    public function audits() { return $this->hasMany(ArticleAudit::class, "user_id"); }
    public function isAdmin(): bool { return $this->vai_tro === "admin"; }
    public function isEditor(): bool { return $this->vai_tro === "editor"; }
    public function isContributor(): bool { return $this->vai_tro === "contributor"; }
    public function canPublish(): bool { return in_array($this->vai_tro, ["admin", "editor"]); }
}