<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckTierLimits
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, $feature = null): Response
    {
        $user = $request->user();

        if ($user && $user->tenant && $user->tenant->tier === 'bronze') {
            if ($feature === 'ai') {
                return response()->json([
                    'message' => 'Feature not available on the Bronze plan. Please upgrade to Silver or Custom.'
                ], 403);
            }
        }

        return $next($request);
    }
}
