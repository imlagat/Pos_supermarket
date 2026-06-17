
$customers = \App\Models\Customer::all();
$products = \App\Models\Product::inRandomOrder()->limit(50)->get();

for ($i = 1; $i <= 100; $i++) {
    $date = now()->subDays(rand(0, 30))->subHours(rand(0, 23));
    
    $order = \App\Models\Order::create([
        'order_number' => 'ORD-MOCK-' . rand(100000, 999999),
        'customer_id' => $customers->isNotEmpty() && rand(0, 1) ? $customers->random()->id : null,
        'user_id' => 1,
        'total_amount' => 0,
        'status' => 'completed',
        'payment_method' => ['cash', 'card', 'mobile_money'][array_rand(['cash', 'card', 'mobile_money'])],
        'amount_paid' => 0,
        'created_at' => $date,
        'updated_at' => $date,
    ]);
    
    $total = 0;
    $numItems = rand(1, 5);
    for ($j = 0; $j < $numItems; $j++) {
        $product = $products->random();
        $qty = rand(1, 4);
        $price = $product->base_price;
        $subtotal = $qty * $price;
        $total += $subtotal;
        
        $unitCost = $product->cost_price ?? 0;
        \App\Models\OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => $qty,
            'unit_price' => $price,
            'total' => $subtotal,
            'unit_cost' => $unitCost,
            'total_cost' => $unitCost * $qty,
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }
    
    $order->update(['total_amount' => $total, 'amount_paid' => $total]);
}
echo "Successfully generated 100 mock orders!\n";
