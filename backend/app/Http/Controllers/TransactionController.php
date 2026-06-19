<?php
namespace App\Http\Controllers;
use App\Models\Order;
use Illuminate\Http\Request;
use Carbon\Carbon;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $limit = $request->query('limit');
        $user = $request->user();
        $query = Order::with(['items.product', 'payments', 'customer', 'cashier'])
            ->orderBy('created_at', 'desc');

        if ($user && $user->role === 'cashier') {
            $query->where('user_id', $user->id);
        }

        if ($limit) {
            $query->limit($limit);
        }

        $orders = $query->get()
            ->map(function ($order) {
                $discounts = json_decode($order->discounts_applied, true);
                $order->discounts = $discounts['discounts'] ?? [];
                $order->points_discount = $discounts['points_discount'] ?? 0;
                return $order;
            });
        return response()->json($orders);
    }

    public function show($id)
    {
        $order = Order::with(['items.product', 'payments', 'customer', 'cashier'])->findOrFail($id);
        $discounts = json_decode($order->discounts_applied, true);
        $order->discounts = $discounts['discounts'] ?? [];
        $order->points_discount = $discounts['points_discount'] ?? 0;
        return response()->json($order);
    }

    public function export(Request $request)
    {
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $user = $request->user();

        $query = Order::with(['customer', 'cashier', 'payments']);

        if ($user && $user->role === 'cashier') {
            $query->where('user_id', $user->id);
        }

        if ($startDate && $endDate) {
            $query->whereBetween('created_at', [Carbon::parse($startDate)->startOfDay(), Carbon::parse($endDate)->endOfDay()]);
        } elseif ($request->input('period')) {
            $period = $request->input('period');
            switch ($period) {
                case 'daily':
                    $query->whereDate('created_at', today());
                    break;
                case 'weekly':
                    $query->whereBetween('created_at', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
                    break;
                case 'monthly':
                    $query->whereMonth('created_at', now()->month);
                    break;
                case 'yearly':
                    $query->whereYear('created_at', now()->year);
                    break;
            }
        }

        if ($request->input('payment_method') && $request->input('payment_method') !== 'all') {
            $paymentMethod = $request->input('payment_method');
            $query->whereHas('payments', function($q) use ($paymentMethod) {
                $q->where('method', $paymentMethod);
            });
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        $csvData = [];
        $csvData[] = ['Order #', 'Date', 'Customer', 'Cashier', 'Total (Ksh)', 'Payment Method', 'Status'];

        foreach ($orders as $order) {
            $paymentMethods = $order->payments->pluck('method')->map(fn($m) => ucfirst($m))->join(', ');
            $csvData[] = [
                $order->order_number,
                $order->created_at->format('Y-m-d H:i:s'),
                $order->customer->name ?? 'Walk-in',
                $order->cashier->name,
                $order->total_amount,
                $paymentMethods,
                ucfirst($order->status),
            ];
        }

        $fileName = 'transactions_' . date('Y-m-d_His') . '.csv';
        $handle = fopen('php://temp', 'w+');
        foreach ($csvData as $row) {
            fputcsv($handle, $row);
        }
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return response($content, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$fileName\"",
        ]);
    }
}
