<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BranchStock extends Model
{
    protected $fillable = ['branch_id', 'product_id', 'alternative_unit_id', 'quantity', 'min_stock_threshold'];

    protected static function booted() {
        static::addGlobalScope(new \App\Models\Scopes\BranchScope);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function alternativeUnit()
    {
        return $this->belongsTo(AlternativeUnit::class);
    }
}
