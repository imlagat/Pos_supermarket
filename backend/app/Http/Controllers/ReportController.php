<?php
namespace App\Http\Controllers;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Customer;
use App\Models\ReturnOrder;
use App\Models\ReturnedItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function sales(Request $request)
    {
        $period = $request->query('period', 'weekly');

        if ($period === 'daily') {
            $startDate = now()->startOfDay();
        } elseif ($period === 'monthly') {
            $startDate = now()->subDays(29)->startOfDay();
        } else { // weekly
            $startDate = now()->subDays(6)->startOfDay();
        }

        $user = $request->user();

        $ordersQuery = Order::where('status', 'completed')
            ->where('created_at', '>=', $startDate);

        $refundsQuery = ReturnOrder::where('created_at', '>=', $startDate);

        $ordersCountQuery = Order::where('status', 'completed')
            ->where('created_at', '>=', $startDate);

        if ($user && $user->role === 'cashier') {
            $ordersQuery->where('user_id', $user->id);
            $refundsQuery->where('user_id', $user->id); // Assuming ReturnOrder has user_id
            $ordersCountQuery->where('user_id', $user->id);
        }

        $grossSales = $ordersQuery->sum('total_amount');
            
        $totalRefunds = $refundsQuery->sum('refund_amount');
            
        $netSales = $grossSales - $totalRefunds;
        
        $ordersCount = $ordersCountQuery->count();
            
        $customersCount = Customer::where('created_at', '>=', $startDate)->count();
        $productsCount = Product::where('created_at', '>=', $startDate)->count();

        $ordersQueryForChart = Order::where('status', 'completed')
            ->where('created_at', '>=', $startDate)
            ->select(['total_amount', 'created_at']);
            
        $refundsQueryForChart = ReturnOrder::where('created_at', '>=', $startDate)
            ->select(['refund_amount', 'created_at']);

        if ($user && $user->role === 'cashier') {
            $ordersQueryForChart->where('user_id', $user->id);
            $refundsQueryForChart->where('user_id', $user->id);
        }

        $orders = $ordersQueryForChart->get();
        $refunds = $refundsQueryForChart->get();

        $chartMap = [];
        
        if ($period === 'daily') {
            for ($i = 0; $i < 24; $i++) {
                $time = now()->startOfDay()->addHours($i);
                $key = $time->format('Y-m-d H:00');
                $chartMap[$key] = ['date' => $time->format('H:00'), 'total' => 0];
            }
        } elseif ($period === 'weekly') {
            for ($i = 6; $i >= 0; $i--) {
                $time = now()->subDays($i)->startOfDay();
                $key = $time->format('Y-m-d');
                $chartMap[$key] = ['date' => $time->format('M d'), 'total' => 0];
            }
        } else { // monthly
            for ($i = 29; $i >= 0; $i--) {
                $time = now()->subDays($i)->startOfDay();
                $key = $time->format('Y-m-d');
                $chartMap[$key] = ['date' => $time->format('M d'), 'total' => 0];
            }
        }

        foreach ($orders as $order) {
            $key = $period === 'daily' ? $order->created_at->format('Y-m-d H:00') : $order->created_at->format('Y-m-d');
            if (isset($chartMap[$key])) {
                $chartMap[$key]['total'] += $order->total_amount;
            }
        }
        
        foreach ($refunds as $refund) {
            $key = $period === 'daily' ? $refund->created_at->format('Y-m-d H:00') : $refund->created_at->format('Y-m-d');
            if (isset($chartMap[$key])) {
                $chartMap[$key]['total'] -= $refund->refund_amount;
            }
        }

        $chartData = array_values($chartMap);

        return response()->json([
            'total_sales' => (float) $grossSales,
            'net_sales' => (float) $netSales,
            'total_refunds' => (float) $totalRefunds,
            'orders' => $ordersCount,
            'customers' => $customersCount,
            'products' => $productsCount,
            'weekly_sales' => $chartData, // Keeping the same key for backwards compatibility or can change frontend
            'chart_data' => $chartData
        ]);
    }

    public function dailySales()
    {
        $grossSales = Order::where('status', 'completed')->whereDate('created_at', today())->sum('total_amount');
        $refunds = ReturnOrder::whereDate('created_at', today())->sum('refund_amount');
        $orders = Order::where('status', 'completed')->whereDate('created_at', today())->count();
        return response()->json([
            'gross_sales' => (float) $grossSales,
            'refunds' => (float) $refunds,
            'orders' => $orders
        ]);
    }

    public function weeklySales()
    {
        $start = now()->startOfWeek();
        $end = now()->endOfWeek();
        $grossSales = Order::where('status', 'completed')->whereBetween('created_at', [$start, $end])->sum('total_amount');
        $refunds = ReturnOrder::whereBetween('created_at', [$start, $end])->sum('refund_amount');
        $orders = Order::where('status', 'completed')->whereBetween('created_at', [$start, $end])->count();
        return response()->json([
            'gross_sales' => (float) $grossSales,
            'refunds' => (float) $refunds,
            'orders' => $orders
        ]);
    }

    public function monthlySales()
    {
        $start = now()->startOfMonth();
        $end = now()->endOfMonth();
        $grossSales = Order::where('status', 'completed')->whereBetween('created_at', [$start, $end])->sum('total_amount');
        $refunds = ReturnOrder::whereBetween('created_at', [$start, $end])->sum('refund_amount');
        $orders = Order::where('status', 'completed')->whereBetween('created_at', [$start, $end])->count();
        return response()->json([
            'gross_sales' => (float) $grossSales,
            'refunds' => (float) $refunds,
            'orders' => $orders
        ]);
    }

    public function topProducts(Request $request)
    {
        $limit = $request->get('limit', 5);
        $user = $request->user();

        $query = OrderItem::select('order_items.product_id', DB::raw('SUM(order_items.quantity) as total_quantity'))
            ->with('product')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', 'completed');

        if ($user && $user->role === 'cashier') {
            $query->where('orders.user_id', $user->id);
        }

        $top = $query->groupBy('order_items.product_id')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->product->name ?? 'Unknown',
                    'sku' => $item->product->sku ?? '',
                    'total_quantity' => (int) $item->total_quantity,
                    'revenue' => (float) ($item->product->base_price * $item->total_quantity)
                ];
            });
        return response()->json($top);
    }

    public function salesByCategory()
    {
        $categories = OrderItem::select('products.category', DB::raw('SUM(order_items.total) as revenue'))
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->groupBy('products.category')
            ->get()
            ->map(function ($item) {
                return [
                    'category' => $item->category ?? 'Uncategorized',
                    'revenue' => (float) $item->revenue
                ];
            });
        return response()->json($categories);
    }

    public function lowStock()
    {
        $lowStock = Product::whereColumn('stock_quantity', '<=', 'min_stock_threshold')->get();
        return response()->json($lowStock);
    }

    public function returnedItems()
    {
        $items = ReturnedItem::with(['product', 'return.order.customer'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($item) {
                $return = $item->return;
                $order = $return ? $return->order : null;
                return [
                    'id' => $item->id,
                    'return_id' => $return->id ?? null,
                    'order_number' => $order->order_number ?? 'N/A',
                    'customer' => $order->customer->name ?? 'Walk-in',
                    'product_name' => $item->product->name ?? 'Unknown',
                    'quantity' => $item->quantity,
                    'condition' => $item->condition,
                    'status' => $item->status,
                    'open_box_price' => $item->open_box_price,
                    'disposal_reason' => $item->disposal_reason,
                    'refund_amount' => $return->refund_amount ?? 0,
                    'created_at' => $item->created_at,
                ];
            });
        $totalRefund = $items->sum('refund_amount');
        $totalQuantity = $items->sum('quantity');
        return response()->json([
            'items' => $items,
            'total_refund' => $totalRefund,
            'total_quantity' => $totalQuantity,
        ]);
    }
}
