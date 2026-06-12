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
        
        $action = "API Request: {$method} {$path}";
        
        // Don't log passwords
        $payload = $request->except(['password', 'password_confirmation', 'current_password']);
        
        // If GET request, payload is empty to save space
        if ($method === 'GET') {
            $payload = [];
        }

        AuditLog::create([
            'user_id' => Auth::check() ? Auth::id() : null,
            'action' => $action,
            'model_type' => 'API Route',
            'model_id' => null,
            'old_values' => null,
            'new_values' => !empty($payload) ? $payload : null,
            'ip_address' => $request->ip(),
        ]);

        return $response;
    }
}
