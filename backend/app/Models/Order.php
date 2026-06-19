<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class Order extends Model
{
    use \App\Traits\Tenantable;

    use Auditable;
    protected $fillable = ['order_number', 'customer_id', 'user_id', 'total_amount', 'status', 'discounts_applied', 'branch_id', 'shift_id'];
    protected static function booted() {
        static::addGlobalScope(new \App\Models\Scopes\BranchScope);
        static::created(function ($order) {
            \App\Jobs\ProcessStockDeduction::dispatch($order);
        });
    }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function payments() { return $this->hasMany(Payment::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function cashier() { return $this->belongsTo(User::class, 'user_id'); }
    public function branch() { return $this->belongsTo(Branch::class); }
}
