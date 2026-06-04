<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = ['order_number', 'customer_id', 'user_id', 'total_amount', 'status'];
    protected static function booted() {
        static::created(function ($order) {
            \App\Jobs\ProcessStockDeduction::dispatch($order);
        });
    }
    public function items() { return $this->hasMany(OrderItem::class); }
    public function payments() { return $this->hasMany(Payment::class); }
    public function customer() { return $this->belongsTo(Customer::class); }
    public function cashier() { return $this->belongsTo(User::class, 'user_id'); }
}
