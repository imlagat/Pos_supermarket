
public function store(Request $request)
{
    \Log::info('Order store started', $request->all());
    $request->validate([
        'items' => 'required|array',
        'payments' => 'required|array',
        'customer_id' => 'nullable|exists:customers,id',
        'total' => 'required|numeric'
    ]);
    
    try {
        $order = Order::create([
            'order_number' => 'ORD-'.Str::upper(Str::random(8)),
            'customer_id' => $request->customer_id,
            'user_id' => auth()->id(),
            'total_amount' => $request->total,
            'status' => 'completed'
        ]);
        
        foreach ($request->items as $item) {
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['price'],
                'total' => $item['price'] * $item['quantity']
            ]);
        }
        
        foreach ($request->payments as $payment) {
            Payment::create([
                'order_id' => $order->id,
                'amount' => $payment['amount'],
                'method' => $payment['method'],
                'status' => 'completed'
            ]);
        }
        
        if ($request->customer_id) {
            $customer = Customer::find($request->customer_id);
            $pointsEarned = floor($order->total_amount / 100);
            if ($pointsEarned > 0) {
                $customer->increment('points_balance', $pointsEarned);
                LoyaltyTransaction::create([
                    'customer_id' => $customer->id,
                    'points' => $pointsEarned,
                    'type' => 'earn',
                    'order_id' => $order->id,
                    'description' => 'Purchase at POS'
                ]);
            }
        }
        
        return response()->json(['order' => $order, 'message' => 'Sale completed'], 201);
    } catch (\Exception $e) {
        \Log::error('Order store failed: ' . $e->getMessage());
        return response()->json(['message' => 'Failed to save order: ' . $e->getMessage()], 500);
    }
}
