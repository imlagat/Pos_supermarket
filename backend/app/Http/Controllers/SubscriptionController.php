<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\SubscriptionPayment;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends Controller
{
    public function subscribe(Request $request)
    {
        $request->validate([
            'tier' => 'required|in:bronze,silver',
            'phone' => 'required|string',
            'cycle' => 'nullable|in:monthly,yearly',
        ]);

        $user = $request->user();
        $tenant = $user->tenant;

        if (!$tenant) {
            return response()->json(['error' => 'No tenant associated with user'], 400);
        }

        $cycle = $request->cycle ?? 'monthly';
        $amounts = [
            'bronze' => ['monthly' => 1599, 'yearly' => 11513],
            'silver' => ['monthly' => 2599, 'yearly' => 18713],
        ];

        $amount = $amounts[$request->tier][$cycle];

        $mpesaService = new \App\Services\MpesaService();
        $response = $mpesaService->stkPush(
            $amount, 
            $request->phone, 
            'SUB_' . $tenant->id, 
            'SuperPOS SaaS'
        );

        if (isset($response['error'])) {
            return response()->json(['error' => $response['error']], 400);
        }

        if (isset($response['ResponseCode']) && $response['ResponseCode'] == "0") {
            SubscriptionPayment::create([
                'tenant_id' => $tenant->id,
                'checkout_id' => $response['CheckoutRequestID'],
                'tier' => $request->tier,
                'cycle' => $cycle,
                'amount' => $amount,
                'phone' => $request->phone,
                'status' => 'pending'
            ]);

            return response()->json([
                'message' => 'Payment initiated. Check your phone to enter PIN.',
                'checkout_id' => $response['CheckoutRequestID'],
            ]);
        }

        return response()->json([
            'error' => $response['errorMessage'] ?? 'Failed to initiate M-Pesa payment. Please check your number.'
        ], 400);
    }

    public function handleCallback(Request $request)
    {
        // Mock M-Pesa Callback
        $request->validate([
            'checkout_id' => 'required|string',
            'status' => 'required|in:completed,failed',
            'tier' => 'required|in:bronze,silver',
            'cycle' => 'nullable|in:monthly,yearly'
        ]);

        $payment = SubscriptionPayment::where('checkout_id', $request->checkout_id)->first();
        if ($payment) {
            $payment->update(['status' => $request->status]);
        }

        if ($request->status === 'completed') {
            $user = $request->user();
            $tenant = $user->tenant;

            $cycle = $request->cycle ?? 'monthly';
            $nextBillingDate = $cycle === 'yearly' ? now()->addYear() : now()->addMonth();

            $tenant->update([
                'tier' => $request->tier,
                'billing_status' => 'active',
                'next_billing_date' => $nextBillingDate,
                'trial_ends_at' => null, // Trial is over
            ]);

            return response()->json([
                'message' => 'Subscription upgraded successfully!',
                'tenant' => $tenant
            ]);
        }

        return response()->json(['error' => 'Payment failed'], 400);
    }

    public function history(Request $request)
    {
        $tenant = $request->user()->tenant;
        if (!$tenant) {
            return response()->json(['error' => 'No tenant associated with user'], 400);
        }

        $history = SubscriptionPayment::where('tenant_id', $tenant->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($history);
    }
}
