<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DrawerMovement extends Model
{
    protected $fillable = [
        'shift_id',
        'type',
        'amount',
        'method',
        'notes',
    ];

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
