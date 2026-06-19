<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Tenant;

class SuperAdminController extends Controller
{
    public function getTenants(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $tenants = Tenant::orderBy('created_at', 'desc')->get();
        return response()->json($tenants);
    }

    public function updateTier(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $request->validate(['tier' => 'required|in:bronze,silver,custom']);
        $tenant = Tenant::findOrFail($id);
        $tenant->tier = $request->tier;
        $tenant->save();
        return response()->json($tenant);
    }

    public function updateStatus(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $request->validate(['is_active' => 'required|boolean']);
        $tenant = Tenant::findOrFail($id);
        $tenant->is_active = $request->is_active;
        $tenant->save();
        return response()->json($tenant);
    }
}
