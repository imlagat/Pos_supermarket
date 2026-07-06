<?php
namespace App\Models;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Traits\Auditable;

class User extends Authenticatable
{
    use HasApiTokens, Notifiable, Auditable, \App\Traits\Tenantable, SoftDeletes;
    protected $fillable = ['name', 'email', 'password', 'pin', 'role', 'branch_id', 'tenant_id', 'otp_code', 'otp_expires_at'];
    protected $hidden = ['password', 'pin'];

    public function isSuperAdmin() { return $this->role === 'super_admin'; }
    public function isAdmin() { return $this->role === 'admin'; }
    public function isManager() { return $this->role === 'manager'; }
    public function isCashier() { return $this->role === 'cashier'; }

    public function branch() {
        return $this->belongsTo(Branch::class);
    }
}
