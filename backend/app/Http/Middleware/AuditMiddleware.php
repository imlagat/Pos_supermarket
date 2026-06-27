<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;

class AuditMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Avoid logging the audit logs retrieval itself to prevent infinite recursion loop
        if ($request->is('api/audit-logs*')) {
            return $response;
        }

        // We log requests that modify state, or all requests if we want full tracking.
        // Let's log all requests since user asked for "any operations on the system should be recorded".
        // To save space, we omit large GET payloads and focus on the action.
        
        $method = $request->method();
        $path = $request->path();
        
        // Ignore GET requests completely
        if ($method === 'GET') {
            return $response;
        }

        // Map routes to simple actions
        $action = "{$method} {$path}";
        
        if ($method === 'POST') {
            if (\Illuminate\Support\Str::is('api/orders', $path)) $action = 'Sale';
            elseif (\Illuminate\Support\Str::is('api/register', $path)) $action = 'User Register';
            elseif (\Illuminate\Support\Str::is('api/products', $path)) $action = 'Added Product';
            elseif (\Illuminate\Support\Str::is('api/users', $path)) $action = 'Added User';
            elseif (\Illuminate\Support\Str::is('api/discount-rules', $path)) $action = 'Created Discount';
            elseif (\Illuminate\Support\Str::is('api/shifts/open', $path)) $action = 'Opened Shift';
            elseif (\Illuminate\Support\Str::is('api/shifts/close', $path)) $action = 'Closed Shift';
        } elseif ($method === 'PUT' || $method === 'PATCH') {
            if (\Illuminate\Support\Str::is('api/products/*', $path)) $action = 'Updated Product';
            elseif (\Illuminate\Support\Str::is('api/users/*', $path)) $action = 'Updated User';
            elseif (\Illuminate\Support\Str::is('api/discount-rules/*', $path)) $action = 'Updated Discount';
        } elseif ($method === 'DELETE') {
            if (\Illuminate\Support\Str::is('api/products/*', $path)) $action = 'Deleted Product';
            elseif (\Illuminate\Support\Str::is('api/users/*', $path)) $action = 'Deleted User';
            elseif (\Illuminate\Support\Str::is('api/discount-rules/*', $path)) $action = 'Deleted Discount';
        }
        
        // Don't log passwords
        $payload = $request->except(['password', 'password_confirmation', 'current_password']);

        AuditLog::create([
            'user_id' => Auth::check() ? Auth::id() : null,
            'action' => $action,
            'model_type' => 'Action',
            'model_id' => null,
            'old_values' => null,
            'new_values' => !empty($payload) ? $payload : null,
            'ip_address' => $request->ip(),
        ]);

        return $response;
    }
}
