<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Order;

class SearchController extends Controller
{
    public function globalSearch(Request $request)
    {
        $query = $request->query('q');

        if (!$query) {
            return response()->json([
                'products' => [],
                'customers' => [],
                'orders' => []
            ]);
        }

        $products = Product::where('name', 'LIKE', "%{$query}%")
            ->orWhere('sku', 'LIKE', "%{$query}%")
            ->orWhere('barcode', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get();

        $customers = Customer::where('name', 'LIKE', "%{$query}%")
            ->orWhere('phone', 'LIKE', "%{$query}%")
            ->orWhere('email', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get();

        $orders = Order::where('order_number', 'LIKE', "%{$query}%")
            ->limit(5)
            ->get();

        return response()->json([
            'products' => $products,
            'customers' => $customers,
            'orders' => $orders
        ]);
    }
}
