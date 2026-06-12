<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrder extends Model
{
    protected $fillable = ['po_number', 'supplier_id', 'order_date', 'expected_delivery_date', 'status', 'notes', 'created_by', 'agreed_price', 'paid_amount', 'balance', 'branch_id'];
    protected $casts = ['order_date' => 'date', 'expected_delivery_date' => 'date'];

    protected static function booted() {
        static::addGlobalScope(new \App\Models\Scopes\BranchScope);
    }
    public function supplier() { return $this->belongsTo(Supplier::class); }
    public function items() { return $this->hasMany(PurchaseOrderItem::class); }
    public function creator() { return $this->belongsTo(User::class, 'created_by'); }
    public function branch() { return $this->belongsTo(Branch::class); }
}
