<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$payment = App\Models\SubscriptionPayment::first();
if($payment) {
    echo 'Status: ' . $payment->status;
    try {
        $tenant = App\Models\Tenant::find($payment->tenant_id);
        $cycle = $payment->cycle ?? 'monthly';
        $nextBillingDate = $cycle === 'yearly' ? now()->addYear() : now()->addMonth();

        $tenant->update([
            'tier' => $payment->tier,
            'billing_status' => 'active',
            'next_billing_date' => $nextBillingDate,
            'trial_ends_at' => null,
        ]);
        
        $payment->status = 'completed';
        $payment->save();
        echo ' Success!';
    } catch (\Exception $e) {
        echo ' Error: ' . $e->getMessage();
    }
} else {
    echo 'No payment found.';
}
