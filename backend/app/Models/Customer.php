<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = ['name', 'phone', 'email', 'points_balance', 'tier'];
    public function orders() { return $this->hasMany(Order::class); }
}
