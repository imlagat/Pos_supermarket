<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\DiscountRule;
use App\Models\Batch;
use Illuminate\Support\Str;

class AIOperationsController extends Controller
{
    /**
     * Epic 1: Auto-Reordering
     */
    public function autoReorder(Request $request)
    {
        // 1. Find products low on stock
        $lowStockProducts = Product::whereColumn('stock_quantity', '<=', 'min_stock_threshold')->get();

        if ($lowStockProducts->isEmpty()) {
            return response()->json([
                'status' => 'success',
                'message' => 'No products currently need auto-reordering.',
                'pos_created' => 0
            ]);
        }

        // We assume supplier ID 1 is the default supplier if we don't have supplier tracking at the product level yet.
        // In a fully scaled system, we would group by product->supplier_id.
        $po = PurchaseOrder::create([
            'po_number' => 'PO-' . strtoupper(Str::random(8)),
            'supplier_id' => 1, // Fallback to first supplier
            'order_date' => now(),
            'expected_delivery_date' => now()->addDays(3),
            'status' => 'draft',
            'notes' => 'AI Auto-Generated PO for low stock items',
            'created_by' => auth()->id() ?? 1
        ]);

        $itemsAdded = 0;

        foreach ($lowStockProducts as $product) {
            $orderQuantity = max(50, $product->min_stock_threshold * 2); // Simple heuristic: order enough to be 2x above threshold
            
            PurchaseOrderItem::create([
                'purchase_order_id' => $po->id,
                'product_id' => $product->id,
                'quantity' => $orderQuantity,
                'cost_price' => $product->base_price * 0.7, // Estimate cost price
            ]);
            $itemsAdded++;
        }

        return response()->json([
            'status' => 'success',
            'message' => "AI successfully drafted Purchase Order {$po->po_number} with {$itemsAdded} items.",
            'pos_created' => 1,
            'details' => $po->load('items.product')
        ]);
    }

    /**
     * Epic 2: Dynamic Pricing & Promotions Automation
     */
    public function dynamicPricing(Request $request)
    {
        $rulesCreated = 0;
        $messages = [];

        // 1. Flash Sales: Expiring Products
        // Find batches expiring in the next 7 days with remaining quantity
        $expiringBatches = Batch::where('expiry_date', '<=', now()->addDays(7))
            ->where('expiry_date', '>=', now())
            ->where('quantity', '>', 0)
            ->with('product')
            ->get();

        foreach ($expiringBatches as $batch) {
            // Create a 50% off discount rule for this specific product
            $ruleName = "Flash Sale: Expiring {$batch->product->name}";
            $existing = DiscountRule::where('name', $ruleName)->first();
            
            if (!$existing) {
                DiscountRule::create([
                    'name' => $ruleName,
                    'type' => 'percentage',
                    'value' => 50,
                    'is_active' => true,
                    'starts_at' => now(),
                    'ends_at' => $batch->expiry_date,
                    'product_id' => $batch->product_id,
                    'conditions' => json_encode(['reason' => 'expiring_stock'])
                ]);
                $rulesCreated++;
                $messages[] = "Applied 50% discount to {$batch->product->name} (Expires: {$batch->expiry_date})";
            }
        }

        // 2. Excess Stock Discount
        // Find products with extremely high stock
        $excessProducts = Product::where('stock_quantity', '>', 500)->get();
        foreach ($excessProducts as $product) {
            $ruleName = "Clearance: {$product->name}";
            $existing = DiscountRule::where('name', $ruleName)->first();
            
            if (!$existing) {
                DiscountRule::create([
                    'name' => $ruleName,
                    'type' => 'percentage',
                    'value' => 20,
                    'is_active' => true,
                    'starts_at' => now(),
                    'ends_at' => now()->addDays(14),
                    'product_id' => $product->id,
                    'conditions' => json_encode(['reason' => 'excess_inventory'])
                ]);
                $rulesCreated++;
                $messages[] = "Applied 20% clearance discount to {$product->name} due to high stock ({$product->stock_quantity}).";
            }
        }

        return response()->json([
            'status' => 'success',
            'message' => "AI generated {$rulesCreated} dynamic pricing rules.",
            'rules_created' => $rulesCreated,
            'details' => $messages
        ]);
    }
}
