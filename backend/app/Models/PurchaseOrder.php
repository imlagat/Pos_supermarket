<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = ['po_number', 'supplier_id', 'order_date', 'expected_delivery_date', 'status', 'notes', 'created_by'];
    protected $casts = ['order_date' => 'date', 'expected_delivery_date' => 'date'];
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function items() { return $this->hasMany(PurchaseOrderItem::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
}
