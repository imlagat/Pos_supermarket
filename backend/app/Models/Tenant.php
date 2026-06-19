<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    protected $fillable = ['name', 'tier', 'is_active', 'trial_ends_at', 'billing_status', 'next_billing_date', 'has_completed_onboarding'];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'next_billing_date' => 'datetime',
        'has_completed_onboarding' => 'boolean',
    ];


    public function users()
    {
        return $this->hasMany(User::class);
    }
}
