<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            $model->logAuditAction('created', null, $model->getAttributes());
        });

        static::updated(function ($model) {
            $oldValues = [];
            $newValues = [];
            foreach ($model->getChanges() as $key => $value) {
                if ($key !== 'updated_at') {
                    $oldValues[$key] = $model->getOriginal($key);
                    $newValues[$key] = $value;
                }
            }
            if (!empty($newValues)) {
                $model->logAuditAction('updated', $oldValues, $newValues);
            }
        });

        static::deleted(function ($model) {
            $model->logAuditAction('deleted', $model->getAttributes(), null);
        });
    }

    protected function logAuditAction($action, $oldValues, $newValues)
    {
        AuditLog::create([
            'user_id' => Auth::check() ? Auth::id() : null,
            'action' => $action,
            'model_type' => get_class($this),
            'model_id' => $this->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => request()->ip(),
        ]);
    }
}
