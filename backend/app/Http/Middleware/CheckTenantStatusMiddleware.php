<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckTenantStatusMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if ($user && $user->tenant && !$user->tenant->is_active) {
            // Block all non-GET requests (POST, PUT, PATCH, DELETE)
            $isModifyingRequest = !in_array($request->method(), ['GET', 'HEAD', 'OPTIONS']);

            // Block specific features completely
            $isRestrictedPath = $request->is('api/ai*') || $request->is('api/settings*') || $request->is('api/users*') || $request->is('api/purchase-orders*') || $request->is('api/suppliers*') || $request->is('api/customers*');

            if ($isModifyingRequest || $isRestrictedPath) {
                return response()->json([
                    'error' => 'tenant_suspended_readonly',
                    'message' => 'Your account is suspended. This feature is disabled.'
                ], 403);
            }
        }

        return $next($request);
    }
}
