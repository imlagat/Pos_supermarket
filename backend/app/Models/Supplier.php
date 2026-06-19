<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use \App\Traits\Tenantable;

    protected $fillable = ['name', 'contact_person', 'phone', 'email', 'address'];
    public function purchaseOrders() { return $this->hasMany(PurchaseOrder::class); }
}
