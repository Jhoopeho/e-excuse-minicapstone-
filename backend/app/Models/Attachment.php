<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attachment extends Model
{
    protected $fillable = ['excuse_request_id', 'file_path', 'original_name'];

    public function excuseRequest(): BelongsTo
    {
        return $this->belongsTo(ExcuseRequest::class);
    }
}
