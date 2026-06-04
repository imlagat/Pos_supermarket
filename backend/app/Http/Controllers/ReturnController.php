<?php
namespace App\Http\Controllers;
use App\Models\Order;
use App\Models\ReturnOrder;
use App\Models\ReturnedItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ReturnController extends Controller
{
    public function index()
    {
        $returns = ReturnOrder::with(['order.customer', 'user'])->orderBy('created_at', 'desc')->get();
        foreach ($returns as $return) {
            $return->items = is_string($return->items) ? json_decode($return->items, true) : $return->items;
        }
        return response()->json($returns);
    }

    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'items' => 'required|array',
            'reason' => 'nullable|string',
            'refund_amount' => 'required|numeric',
            'refund_method' => 'required|in:cash,mpesa,card,credit_note',
            'warranty_ok' => 'nullable|boolean',
            'restocking_fee' => 'nullable|numeric',
            'image' => 'nullable|string', // base64 encoded image
        ]);

        $order = Order::findOrFail($request->order_id);
        if ($order->status !== 'completed') {
            return response()->json(['message' => 'Only completed orders can be returned'], 400);
        }

        // 3-day window check
        $orderDate = new \DateTime($order->created_at);
        $now = new \DateTime();
        $diff = $orderDate->diff($now)->days;
        if ($diff > 3) {
            return response()->json(['message' => 'Returns are only allowed within 3 days of the order date'], 400);
        }

        // Fetch all existing returns for this order
        $existingReturns = ReturnOrder::where('order_id', $request->order_id)->get();
        $alreadyReturned = [];
        foreach ($existingReturns as $ret) {
            $items = is_string($ret->items) ? json_decode($ret->items, true) : $ret->items;
            foreach ($items as $item) {
                $productId = $item['product_id'];
                $alreadyReturned[$productId] = ($alreadyReturned[$productId] ?? 0) + $item['quantity'];
            }
        }

        // Validate each requested item does not exceed remaining quantity
        $orderItems = $order->items->keyBy('product_id');
        foreach ($request->items as $item) {
            $productId = $item['product_id'];
            $orderedQty = $orderItems[$productId]->quantity ?? 0;
            $already = $alreadyReturned[$productId] ?? 0;
            $requested = $item['quantity'];
            if ($already + $requested > $orderedQty) {
                $productName = Product::find($productId)->name ?? 'Unknown';
                return response()->json([
                    'message' => "Cannot return {$requested} units of {$productName}. Only " . ($orderedQty - $already) . " remaining."
                ], 422);
            }
        }

        DB::beginTransaction();
        try {
            // Handle image upload
            $imagePath = null;
            if ($request->filled('image')) {
                $imageData = $request->input('image');
                if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $type)) {
                    $imageData = substr($imageData, strpos($imageData, ',') + 1);
                    $type = strtolower($type[1]); // jpg, png, etc.
                    if (!in_array($type, ['jpg', 'jpeg', 'png', 'gif'])) {
                        throw new \Exception('Invalid image type');
                    }
                    $imageData = base64_decode($imageData);
                    $filename = 'return_' . time() . '_' . uniqid() . '.' . $type;
                    $path = 'returns/' . $filename;
                    Storage::disk('public')->put($path, $imageData);
                    $imagePath = $path;
                }
            }

            $return = ReturnOrder::create([
                'order_id' => $request->order_id,
                'user_id' => auth()->id(),
                'items' => json_encode($request->items),
                'reason' => $request->reason,
                'refund_amount' => $request->refund_amount,
                'refund_method' => $request->refund_method,
                'image_path' => $imagePath,
            ]);

            // Create returned items records – do NOT restock inventory
            foreach ($request->items as $item) {
                ReturnedItem::create([
                    'return_id' => $return->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'condition' => 'other',
                    'status' => 'pending',
                ]);
            }

            // Reverse loyalty points (if any)
            if ($order->customer_id) {
                $pointsEarned = floor($order->total_amount / 10);
                if ($pointsEarned > 0) {
                    $order->customer->decrement('points_balance', $pointsEarned);
                }
            }

            DB::commit();
            return response()->json(['message' => 'Return processed successfully', 'return' => $return], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Return failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to process return: ' . $e->getMessage()], 500);
        }
    }
}
