<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = [
        'branch_id',
        'user_id',
        'opening_time',
        'closing_time',
        'opening_balance',
        'opening_mpesa_balance',
        'expected_cash',
        'expected_mpesa',
        'expected_card',
        'actual_cash',
        'actual_mpesa',
        'actual_card',
        'variance',
        'status',
        'notes',
    ];

    protected $casts = [
        'opening_time' => 'datetime',
        'closing_time' => 'datetime',
        'opening_balance' => 'decimal:2',
        'expected_cash' => 'decimal:2',
        'actual_cash' => 'decimal:2',
        'variance' => 'decimal:2',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function drawerMovements()
    {
        return $this->hasMany(DrawerMovement::class);
    }
}
