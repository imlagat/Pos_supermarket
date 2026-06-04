<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class DiscountRule extends Model
{
    protected $fillable = [
        'name', 'type', 'value', 'conditions', 'starts_at', 'ends_at', 'is_active',
        'product_id', 'category', 'min_quantity', 'free_quantity', 'discount_percentage',
        'tier', 'days_left_min', 'days_left_max', 'discount_type'
    ];
    protected $casts = [
        'conditions' => 'array',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'value' => 'float',
    ];
}
