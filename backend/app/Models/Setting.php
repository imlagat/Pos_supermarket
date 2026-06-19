<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use \App\Traits\Tenantable;

    protected $fillable = ['key', 'value'];
    protected $casts = ['value' => 'json'];
}
