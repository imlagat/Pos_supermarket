<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

use App\Traits\Auditable;

class Customer extends Model
{
    use \App\Traits\Tenantable;

    use Auditable;
    protected $fillable = ['name', 'phone', 'email', 'points_balance', 'tier'];
    public function orders() { return $this->hasMany(Order::class); }
}
