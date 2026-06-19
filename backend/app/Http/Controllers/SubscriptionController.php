<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'tier' => 'required|in:bronze,silver',
            'phone' => 'required|string',
        ]);

        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'No tenant associated with user'], 400);
        }

        // Mock STK Push initiation
        // In reality, you would call MpesaService here
        Log::info("Initiating STK push for SaaS subscription. Tenant: {$tenant->id}, Tier: {$request->tier}, Phone: {$request->phone}");

        return response()->json([
            'message' => 'Payment initiated. Check your phone to enter PIN.',
            'checkout_id' => 'mock_checkout_' . time(),
        ]);
    }

    public function handleCallback(Request $request)
    {
        // Mock M-Pesa Callback
        $request->validate([
            'checkout_id' => 'required|string',
            'status' => 'required|in:completed,failed',
            'tier' => 'required|in:bronze,silver'
        ]);

        if ($request->status === 'completed') {
            $user = $request->user();
            $tenant = $user->tenant;

            $tenant->update([
                'tier' => $request->tier,
                'billing_status' => 'active',
                'next_billing_date' => now()->addMonth(),
                'trial_ends_at' => null, // Trial is over
            ]);

            return response()->json([
                'message' => 'Subscription upgraded successfully!',
                'tenant' => $tenant
            ]);
        }

        return response()->json(['error' => 'Payment failed'], 400);
    }
}
