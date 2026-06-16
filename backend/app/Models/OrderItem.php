<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class OrderItem extends Model
{
    protected $fillable = ['order_id', 'product_id', 'batch_id', 'quantity', 'unit_price', 'total', 'unit_cost', 'total_cost'];
    public function order() { return $this->belongsTo(Order::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function batch() { return $this->belongsTo(Batch::class); }
}
