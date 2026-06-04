<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ReturnOrder extends Model
{
    protected $table = 'returns';
    protected $fillable = ['order_id', 'user_id', 'items', 'reason', 'refund_amount', 'refund_method'];
    protected $casts = ['items' => 'array'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
