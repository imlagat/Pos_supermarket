<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class StockAlert extends Model
{
    use \App\Traits\Tenantable;

    protected $fillable = ['product_id', 'type', 'notified_at'];
    public function product() { return $this->belongsTo(Product::class); }
}
