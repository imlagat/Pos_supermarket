<?php
namespace App\Http\Controllers;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Batch;
use App\Models\LoyaltyTransaction;
use App\Services\CartObject;
use App\Helpers\SettingsHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Pipeline;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function calculateCart(Request $request)
    {
        $items = $request->input('items', []);
        $customerId = $request->input('customer_id');
        $cart = new CartObject($items, $customerId);
        try {
            $cart = Pipeline::send($cart)->through([\App\Pipelines\ApplyAllPromotions::class])->thenReturn();
        } catch (\Exception $e) {
            Log::error('Pipeline error: ' . $e->getMessage());
        }
        return response()->json([
            'subtotal' => (float) $cart->subtotal,
            'total' => (float) $cart->total,
            'discounts' => $cart->discounts,
        ]);
    }

    public function store(Request $request)
    {
        Log::info('Order store started', $request->all());
        $request->validate([
            'items' => 'required|array',
            'payments' => 'required|array',
            'customer_id' => 'nullable|exists:customers,id',
            'total' => 'required|numeric',
            'discounts' => 'nullable|array',
            'points_discount' => 'nullable|numeric'
        ]);

        try {
            \DB::beginTransaction();

            $user = auth()->user();
            $activeShift = null;
            
            if ($user->role === 'cashier') {
                $activeShift = \App\Models\Shift::where('user_id', $user->id)
                    ->where('status', 'open')
                    ->first();

                if (!$activeShift) {
                    return response()->json(['message' => 'You must open a shift before completing an order'], 400);
                }
            }

            $order = Order::create([
                'order_number' => 'ORD-'.Str::upper(Str::random(8)),
                'customer_id' => $request->customer_id,
                'user_id' => auth()->id(),
                'shift_id' => $activeShift ? $activeShift->id : null,
                'total_amount' => $request->total,
                'status' => 'completed',
                'branch_id' => app('current_branch_id') ?? 1,
                'discounts_applied' => json_encode([
                    'discounts' => $request->discounts ?? [],
                    'points_discount' => $request->points_discount ?? 0
                ])
            ]);

            \App\Models\AuditLog::create([
                'user_id' => auth()->id(),
                'action' => 'sale',
                'model_type' => 'Order',
                'model_id' => $order->id,
                'ip_address' => request()->ip(),
                'branch_id' => app('current_branch_id') ?? 1,
            ]);

            foreach ($request->items as $item) {
                $product = Product::find($item['product_id']);
                if (!$product) continue;

                $unitCost = $product->cost_price ?? 0;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['price'],
                    'total' => $item['price'] * $item['quantity'],
                    'unit_cost' => $unitCost,
                    'total_cost' => $unitCost * $item['quantity']
                ]);

                if (isset($item['is_open_box']) && $item['is_open_box'] && isset($item['returned_item_id'])) {
                    $returnedItem = \App\Models\ReturnedItem::find($item['returned_item_id']);
                    if ($returnedItem) {
                        $returnedItem->decrement('quantity', $item['quantity']);
                    }
                    continue;
                }

                if (isset($item['unit_id']) && $item['unit_id']) {
                    $product->deductAlternativeUnit($item['unit_id'], $item['quantity']);
                } else {
                    $product->deductBaseStock($item['quantity']);
                }
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
                if ($customer) {
                    if (isset($request->points_discount) && $request->points_discount > 0) {
                        $redeemed = (int) $request->points_discount;
                        $customer->points_balance -= $redeemed;
                        LoyaltyTransaction::create([
                            'customer_id' => $customer->id,
                            'points' => -$redeemed,
                            'type' => 'redeem',
                            'order_id' => $order->id,
                            'description' => 'Points redeemed at POS'
                        ]);
                    }

                    $pointsEarningRate = (int) SettingsHelper::get('points_earning_rate', 10);
                    $pointsEarned = (int) floor($order->total_amount / $pointsEarningRate);
                    if ($pointsEarned > 0) {
                        $customer->points_balance += $pointsEarned;
                        LoyaltyTransaction::create([
                            'customer_id' => $customer->id,
                            'points' => $pointsEarned,
                            'type' => 'earn',
                            'order_id' => $order->id,
                            'description' => 'Purchase at POS'
                        ]);
                    }
                    $customer->save();
                }
            }

            \DB::commit();
            return response()->json(['order' => $order, 'message' => 'Sale completed'], 201);
        } catch (\Exception $e) {
            \DB::rollBack();
            Log::error('Order store failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to save order: ' . $e->getMessage()], 500);
        }
    }

    public function index()
    {
        if (auth()->user()->role === 'cashier') {
            return Order::where('user_id', auth()->id())->with('items.product', 'payments')->get();
        }
        return Order::with('items.product', 'payments', 'cashier')->get();
    }
}
