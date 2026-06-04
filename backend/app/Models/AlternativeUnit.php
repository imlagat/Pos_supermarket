<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AlternativeUnit extends Model
{
    protected $fillable = ['product_id', 'unit_name', 'quantity_in_base_unit', 'price'];
    public function product() { return $this->belongsTo(Product::class); }
}
