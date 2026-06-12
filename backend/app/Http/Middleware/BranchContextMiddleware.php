<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class BranchContextMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if ($user) {
            $branchId = $request->header('X-Branch-ID');
            
            if ($user->isAdmin() && $branchId) {
                // Admin can override branch
                app()->instance('current_branch_id', $branchId === 'all' ? null : $branchId);
            } else {
                // Normal user is restricted to their assigned branch
                app()->instance('current_branch_id', $user->branch_id);
            }
        }
        return $next($request);
    }
}
