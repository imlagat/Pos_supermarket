<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingRegistration extends Model
{
    protected $fillable = [
        'email',
        'name',
        'password',
        'tenant_name',
        'tier',
        'otp_code',
        'expires_at',
    ];
    
    protected $casts = [
        'expires_at' => 'datetime',
    ];
}
