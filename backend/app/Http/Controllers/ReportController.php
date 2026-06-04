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
        $grossSales = Order::where('status', 'completed')->sum('total_amount');
        $totalRefunds = ReturnOrder::sum('refund_amount');
        $netSales = $grossSales - $totalRefunds;
        $ordersCount = Order::where('status', 'completed')->count();
        $customersCount = Customer::count();
        $productsCount = Product::count();

        $weeklySales = Order::where('status', 'completed')
            ->where('created_at', '>=', now()->subDays(7))
            ->selectRaw('DATE(created_at) as date, SUM(total_amount) as total')
            ->groupBy('date')
            ->get()
            ->map(function ($item) {
                $refundsOnDate = ReturnOrder::whereDate('created_at', $item->date)->sum('refund_amount');
                $item->total = $item->total - $refundsOnDate;
                return $item;
            });

        return response()->json([
            'total_sales' => (float) $grossSales,
            'net_sales' => (float) $netSales,
            'total_refunds' => (float) $totalRefunds,
            'orders' => $ordersCount,
            'customers' => $customersCount,
            'products' => $productsCount,
            'weekly_sales' => $weeklySales
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
        $top = OrderItem::select('product_id', DB::raw('SUM(quantity) as total_quantity'))
            ->with('product')
            ->groupBy('product_id')
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
