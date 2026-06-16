<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FinanceController extends Controller
{
    public function getPnL(Request $request)
    {
        $period = $request->query('period', 'today'); // today, yesterday, this_week, this_month, custom
        $startDate = null;
        $endDate = null;

        $now = now();
        
        switch ($period) {
            case 'today':
                $startDate = $now->copy()->startOfDay();
                $endDate = $now->copy()->endOfDay();
                break;
            case 'yesterday':
                $startDate = $now->copy()->subDay()->startOfDay();
                $endDate = $now->copy()->subDay()->endOfDay();
                break;
            case 'this_week':
                $startDate = $now->copy()->startOfWeek();
                $endDate = $now->copy()->endOfWeek();
                break;
            case 'this_month':
                $startDate = $now->copy()->startOfMonth();
                $endDate = $now->copy()->endOfMonth();
                break;
            case 'custom':
                $startDate = Carbon::parse($request->query('start_date'))->startOfDay();
                $endDate = Carbon::parse($request->query('end_date'))->endOfDay();
                break;
            default:
                $startDate = $now->copy()->startOfDay();
                $endDate = $now->copy()->endOfDay();
                break;
        }

        // Get aggregated order items within the period
        $orderItems = OrderItem::select(
                'products.name as product_name',
                'order_items.unit_cost as cost_price',
                'order_items.unit_price as selling_price',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.total) as total_revenue'),
                DB::raw('SUM(order_items.total_cost) as total_cogs'),
                DB::raw('SUM(order_items.total - order_items.total_cost) as total_profit')
            )
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('orders.status', 'completed')
            ->whereBetween('orders.created_at', [$startDate, $endDate])
            ->groupBy('order_items.product_id', 'products.name', 'order_items.unit_cost', 'order_items.unit_price')
            ->get();

        $totalRevenue = $orderItems->sum('total_revenue');
        $totalCogs = $orderItems->sum('total_cogs');
        $totalGrossProfit = $orderItems->sum('total_profit');

        return response()->json([
            'period' => $period,
            'start_date' => $startDate->toDateString(),
            'end_date' => $endDate->toDateString(),
            'total_revenue' => (float) $totalRevenue,
            'total_cogs' => (float) $totalCogs,
            'total_gross_profit' => (float) $totalGrossProfit,
            'items' => $orderItems->map(function ($item) {
                return [
                    'product_name' => $item->product_name,
                    'cost_price' => (float) $item->cost_price,
                    'selling_price' => (float) $item->selling_price,
                    'quantity_sold' => (int) $item->total_quantity,
                    'profit' => (float) $item->total_profit
                ];
            })
        ]);
    }
}
