<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = "categories";
    protected $fillable = ["ten", "slug", "mo_ta"];

    public function articles() { return $this->hasMany(Article::class, "category_id"); }
}