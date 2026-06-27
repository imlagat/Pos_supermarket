<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use \App\Traits\Tenantable;

    protected $fillable = ['user_id', 'action', 'model_type', 'model_id', 'old_values', 'new_values', 'ip_address', 'branch_id'];
    protected $casts = ['old_values' => 'array', 'new_values' => 'array'];

    protected static function booted() {
        static::addGlobalScope(new \App\Models\Scopes\BranchScope);
        
        static::creating(function ($model) {
            if (auth()->check() && empty($model->branch_id)) {
                $model->branch_id = auth()->user()->branch_id;
            }
        });
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
