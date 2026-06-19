<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class DiscountRule extends Model
{
    use \App\Traits\Tenantable;

    use Auditable;
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
