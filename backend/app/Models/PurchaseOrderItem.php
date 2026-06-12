<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = ['purchase_order_id', 'product_id', 'alternative_unit_id', 'quantity', 'cost_price', 'expiry_date'];
    public function purchaseOrder() { return $this->belongsTo(PurchaseOrder::class); }
    public function product() { return $this->belongsTo(Product::class); }
    public function alternativeUnit() { return $this->belongsTo(AlternativeUnit::class); }
}
