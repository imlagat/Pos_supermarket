<?php
namespace App\Models;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

use App\Traits\Auditable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, Auditable;
    protected $fillable = ['name', 'email', 'password', 'pin', 'role', 'branch_id'];
    protected $hidden = ['password', 'pin'];

    public function isAdmin() { return $this->role === 'admin'; }
    public function isManager() { return $this->role === 'manager'; }
    public function isCashier() { return $this->role === 'cashier'; }

    public function branch() {
        return $this->belongsTo(Branch::class);
    }
}
