<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        // 1. Allow console commands (e.g. background artisan workers) unless auth user is set
        if (app()->runningInConsole() && !auth()->check()) {
            return;
        }

        // 2. Authenticated user logic
        if (auth()->check()) {
            $user = auth()->user();

            // Super Admin can view all or filter by header
            if ($user->isSuperAdmin()) {
                if (request()->hasHeader('X-Tenant-ID')) {
                    $builder->where($model->getTable() . '.tenant_id', request()->header('X-Tenant-ID'));
                }
                return;
            }

            // Tenant user: enforce strict tenant_id matching
            if ($user->tenant_id) {
                $builder->where($model->getTable() . '.tenant_id', $user->tenant_id);
            } else {
                $builder->whereRaw('1 = 0');
            }
            return;
        }

        // 3. Unauthenticated requests must not leak tenant data
        $builder->whereRaw('1 = 0');
    }
}
