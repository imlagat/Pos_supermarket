<?php
namespace App\Http\Controllers;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Product;
use App\Models\Batch;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        $orders = PurchaseOrder::with(['supplier', 'creator', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                $totalQuantity = $order->items->sum('quantity');
                $totalAmount = $order->items->sum(function ($item) {
                    return $item->quantity * $item->cost_price;
                });
                $order->total_quantity = $totalQuantity;
                $order->total_amount = $totalAmount;
                return $order;
            });
        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.cost_price' => 'required|numeric|min:0',
        ]);

        try {
            DB::beginTransaction();
            $po = PurchaseOrder::create([
                'po_number' => 'PO-'.Str::upper(Str::random(8)),
                'supplier_id' => $request->supplier_id,
                'order_date' => $request->order_date,
                'expected_delivery_date' => $request->expected_delivery_date,
                'notes' => $request->notes,
                'created_by' => auth()->id(),
                'status' => 'pending'
            ]);

            foreach ($request->items as $item) {
                PurchaseOrderItem::create([
                    'purchase_order_id' => $po->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                ]);
            }
            DB::commit();
            return response()->json($po->load('items.product'), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('PO creation failed: '.$e->getMessage());
            return response()->json(['message' => 'Failed to create purchase order'], 500);
        }
    }

    public function show(PurchaseOrder $purchaseOrder)
    {
        $purchaseOrder->load('items.product', 'supplier', 'creator');
        $purchaseOrder->total_quantity = $purchaseOrder->items->sum('quantity');
        $purchaseOrder->total_amount = $purchaseOrder->items->sum(function ($item) {
            return $item->quantity * $item->cost_price;
        });
        return $purchaseOrder;
    }

    // NEW receive method that accepts expiry dates per item
    public function receive(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'pending') {
            return response()->json(['message' => 'Order already received or cancelled'], 400);
        }

        $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_order_items,id',
            'items.*.expiry_date' => 'nullable|date',
        ]);

        try {
            DB::beginTransaction();
            foreach ($request->items as $itemData) {
                $poItem = PurchaseOrderItem::find($itemData['id']);
                if (!$poItem) continue;

                $product = $poItem->product;
                // Increase stock quantity
                $product->increment('stock_quantity', $poItem->quantity);

                // Create batch if expiry date provided
                if (!empty($itemData['expiry_date'])) {
                    Batch::create([
                        'product_id' => $product->id,
                        'batch_number' => 'BATCH-'.$product->id.'-'.time(),
                        'expiry_date' => $itemData['expiry_date'],
                        'quantity' => $poItem->quantity,
                    ]);
                }
            }
            $purchaseOrder->status = 'received';
            $purchaseOrder->save();
            DB::commit();
            return response()->json(['message' => 'Purchase order received successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Receive PO failed: '.$e->getMessage());
            return response()->json(['message' => 'Failed to receive order: '.$e->getMessage()], 500);
        }
    }

    public function destroy(PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'pending') {
            return response()->json(['message' => 'Only pending orders can be deleted'], 400);
        }
        $purchaseOrder->delete();
        return response()->noContent();
    }

    // Overdue POs for dashboard alerts
    public function overdue()
    {
        $overdue = PurchaseOrder::with('supplier')
            ->where('status', 'pending')
            ->where('expected_delivery_date', '<=', now()->addDays(3))
            ->orderBy('expected_delivery_date', 'asc')
            ->get();
        return response()->json($overdue);
    }
}
