// In store method, replace the loyalty points section with:
if ($request->customer_id) {
    $customer = Customer::find($request->customer_id);
    if ($customer) {
        $pointsEarned = (int) floor($order->total_amount / 10);
        if ($pointsEarned > 0) {
            // Use save to trigger observer
            $customer->points_balance += $pointsEarned;
            $customer->save();
            LoyaltyTransaction::create([
                'customer_id' => $customer->id,
                'points' => $pointsEarned,
                'type' => 'earn',
                'order_id' => $order->id,
                'description' => 'Purchase at POS'
            ]);
        }
    }
}
