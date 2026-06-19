<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class LoyaltyTransaction extends Model
{
    use \App\Traits\Tenantable;

    protected $fillable = ['customer_id', 'points', 'type', 'order_id', 'description'];
    public function customer() { return $this->belongsTo(Customer::class); }
    public function order() { return $this->belongsTo(Order::class); }
}
