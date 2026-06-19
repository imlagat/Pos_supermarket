<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Payment extends Model
{
    use \App\Traits\Tenantable;

    protected $fillable = ['order_id', 'amount', 'method', 'reference', 'status', 'checkout_request_id'];
    public function order() { return $this->belongsTo(Order::class); }
}
