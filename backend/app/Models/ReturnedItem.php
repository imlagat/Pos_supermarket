<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class ReturnedItem extends Model
{
    use \App\Traits\Tenantable;

    protected $fillable = ['return_id', 'product_id', 'quantity', 'condition', 'status', 'open_box_price', 'disposal_reason', 'image_path'];
    protected $casts = ['open_box_price' => 'float'];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function return()
    {
        return $this->belongsTo(ReturnOrder::class, 'return_id');
    }
}
