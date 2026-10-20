<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AbsenceCategory extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'requires_attachment'];

    protected function casts(): array
    {
        return ['requires_attachment' => 'boolean'];
    }

    public function excuseRequests(): HasMany
    {
        return $this->hasMany(ExcuseRequest::class, 'category_id');
    }
}
