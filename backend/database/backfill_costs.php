<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Product;
use App\Models\OrderItem;
use App\Models\PurchaseOrderItem;

echo "Backfilling product cost prices...\n";
$products = Product::all();
foreach ($products as $product) {
    // Try to find the latest purchase order item for this product
    $poi = PurchaseOrderItem::where('product_id', $product->id)
        ->orderBy('created_at', 'desc')
        ->first();

    if ($poi && $poi->cost_price > 0) {
        $product->cost_price = $poi->cost_price;
    } else {
        // Fallback: estimate 70% of base price if no PO history exists
        $product->cost_price = $product->base_price * 0.70;
    }
    
    // Safety check - cost_price shouldn't exceed base_price
    if ($product->cost_price > $product->base_price) {
        $product->cost_price = $product->base_price;
    }
    
    $product->save();
}

echo "Backfilling order items unit costs...\n";
$orderItems = OrderItem::all();
foreach ($orderItems as $item) {
    $product = Product::find($item->product_id);
    if ($product) {
        $item->unit_cost = $product->cost_price;
        $item->total_cost = $product->cost_price * $item->quantity;
        $item->save();
    }
}

echo "Done.\n";
