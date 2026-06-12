<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = ['user_id', 'action', 'model_type', 'model_id', 'old_values', 'new_values', 'ip_address', 'branch_id'];
    protected $casts = ['old_values' => 'array', 'new_values' => 'array'];

    protected static function booted() {
        static::addGlobalScope(new \App\Models\Scopes\BranchScope);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }
}
