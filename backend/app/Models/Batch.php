<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Batch extends Model
{
    protected $fillable = ['product_id', 'batch_number', 'expiry_date', 'quantity', 'branch_id', 'created_at'];

    protected static function booted() {
        static::addGlobalScope(new \App\Models\Scopes\BranchScope);
    }

    public function product() { return $this->belongsTo(Product::class); }
}
