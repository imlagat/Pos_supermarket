<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Tenant;
use App\Models\User;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

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

    public function getAdmins(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $admins = User::where('role', 'super_admin')->get();
        return response()->json($admins);
    }

    public function createAdmin(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->whereNull('deleted_at')],
            'password' => 'required|string|min:8',
        ]);

        $admin = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'super_admin',
        ]);

        return response()->json($admin, 201);
    }

    public function updateAdmin(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $admin = User::where('role', 'super_admin')->findOrFail($id);
        
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($id)->whereNull('deleted_at')],
            'password' => 'nullable|string|min:8',
        ]);

        $admin->name = $request->name;
        $admin->email = $request->email;
        if ($request->filled('password')) {
            $admin->password = Hash::make($request->password);
        }
        $admin->save();

        return response()->json($admin);
    }

    public function deleteAdmin(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $admin = User::where('role', 'super_admin')->findOrFail($id);
        
        if ($admin->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete yourself.'], 400);
        }
        
        $adminCount = User::where('role', 'super_admin')->count();
        if ($adminCount <= 1) {
            return response()->json(['message' => 'Cannot delete the last super admin.'], 400);
        }

        $admin->delete();
        return response()->json(['message' => 'Super admin deleted successfully']);
    }

    public function getSubscriptionTransactions(Request $request)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $payments = SubscriptionPayment::with('tenant')->orderBy('created_at', 'desc')->get();
        return response()->json($payments);
    }

    public function updateSubscriptionTransaction(Request $request, $id)
    {
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'status' => 'required|in:pending,completed,failed'
        ]);

        $payment = SubscriptionPayment::findOrFail($id);
        
        // Only trigger tenant updates if the status transitions to completed
        if ($payment->status !== 'completed' && $request->status === 'completed') {
            $tenant = Tenant::find($payment->tenant_id);
            if ($tenant) {
                $cycle = $payment->cycle ?? 'monthly';
                $nextBillingDate = $cycle === 'yearly' ? now()->addYear() : now()->addMonth();

                $tenant->update([
                    'tier' => $payment->tier,
                    'billing_status' => 'active',
                    'next_billing_date' => $nextBillingDate,
                    'trial_ends_at' => null,
                ]);
            }
        }

        $payment->status = $request->status;
        $payment->save();

        return response()->json($payment->load('tenant'));
    }
}
