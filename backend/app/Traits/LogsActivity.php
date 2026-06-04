<?php
namespace App\Traits;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Request;

trait LogsActivity
{
    public static function bootLogsActivity()
    {
        static::created(function ($model) {
            $model->logActivity('created');
        });
        static::updated(function ($model) {
            $model->logActivity('updated');
        });
        static::deleted(function ($model) {
            $model->logActivity('deleted');
        });
    }

    public function logActivity($action)
    {
        AuditLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'model_type' => get_class($this),
            'model_id' => $this->id,
            'old_values' => $this->getOriginal(),
            'new_values' => $this->getAttributes(),
            'ip_address' => Request::ip(),
        ]);
    }
}
